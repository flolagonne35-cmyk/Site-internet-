// ROLF — creates a Stripe Checkout Session from the visitor's cart.
//
// The browser sends only references, sizes and quantities. Every price, name and
// availability is re-read here from data/products.json on the live site, so a
// visitor cannot change what they pay by editing the page.
//
// Secrets (set by .github/workflows/deploy-checkout.yml):
//   STRIPE_SECRET_KEY   sk_test_... while testing, sk_live_... once the account is validated
// Optional:
//   SITE_URL            defaults to the GitHub Pages address
//   ALLOWED_ORIGINS     comma-separated, defaults to the GitHub Pages origin + rolf.fr

const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://flolagonne35-cmyk.github.io/Site-internet-").replace(/\/$/, "");
const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://flolagonne35-cmyk.github.io,https://rolf.fr,https://www.rolf.fr").split(",").map((s) => s.trim());

// Shipping rules — keep in sync with SHIPPING in js/main.js and the "Livraison & retours" page.
const SHIPPING = {
  FR: { cents: 490, freeFromCents: 8000, countries: ["FR", "MC"], label: { fr: "Livraison France — Colissimo", en: "Delivery France — Colissimo" }, days: [2, 4] },
  EU: {
    cents: 1490, freeFromCents: null, label: { fr: "Livraison Europe", en: "Delivery Europe" }, days: [4, 8],
    countries: ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"],
  },
} as const;

type Product = {
  ref: string; name: string; name_en?: string; brand: string; brand_slug: string; type: string; price: number;
  img?: string; availability?: string; sizes_in_stock?: string[]; specs?: Record<string, string>;
};

let catalog: Map<string, Product> | null = null;
let catalogAt = 0;

async function getCatalog(): Promise<Map<string, Product>> {
  if (catalog && Date.now() - catalogAt < 10 * 60 * 1000) return catalog;
  const res = await fetch(`${SITE_URL}/data/products.json`, { headers: { "Cache-Control": "no-cache" } });
  if (!res.ok) throw new Error(`catalogue ${res.status}`);
  const list: Product[] = await res.json();
  catalog = new Map(list.map((p) => [p.ref, p]));
  catalogAt = Date.now();
  return catalog;
}

function cors(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(origin), "Content-Type": "application/json" } });
}

// Stripe's API takes form-encoded nested fields: line_items[0][price_data][currency]=eur
function formEncode(obj: unknown, prefix = "", out = new URLSearchParams()): URLSearchParams {
  if (obj === null || obj === undefined) return out;
  if (Array.isArray(obj)) obj.forEach((v, i) => formEncode(v, `${prefix}[${i}]`, out));
  else if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) formEncode(v, prefix ? `${prefix}[${k}]` : k, out);
  } else out.append(prefix, String(obj));
  return out;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (!STRIPE_KEY) return json({ error: "Paiement non configuré." }, 503, origin);

  let body: { items?: { ref?: string; size?: string; qty?: number }[]; zone?: string; lang?: string };
  try { body = await req.json(); } catch { return json({ error: "Requête invalide." }, 400, origin); }

  const lang = body.lang === "en" ? "en" : "fr";
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const zoneKey = body.zone === "EU" ? "EU" : "FR";
  const zone = SHIPPING[zoneKey];
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0 || items.length > 50) return json({ error: t("Panier vide ou trop grand.", "Cart is empty or too large.") }, 400, origin);

  let products: Map<string, Product>;
  try { products = await getCatalog(); } catch (e) {
    console.error(e);
    return json({ error: t("Catalogue momentanément indisponible.", "Catalogue temporarily unavailable.") }, 502, origin);
  }

  // Business days before shipping, per item — keep in sync with product.html.
  const leadDays = (p: Product) =>
    p.availability === "order" || p.availability === "preorder" ? 15
      : p.brand_slug === "jackie-gold" ? 15 : p.brand_slug === "orus-bijoux" ? 10 : 0;
  let maxLead = 0;
  const lineItems: unknown[] = [];
  let subtotalCents = 0;
  const summary: string[] = [];
  for (const it of items) {
    const p = products.get(String(it.ref ?? ""));
    const qty = Math.floor(Number(it.qty));
    if (!p) return json({ error: t("Un article du panier n'existe plus. Retirez-le puis réessayez.", "An item in your cart no longer exists. Remove it and try again.") }, 400, origin);
    if (!(qty >= 1 && qty <= 10)) return json({ error: t("Maximum 10 exemplaires par article.", "Maximum 10 of each item.") }, 400, origin);
    const name = lang === "en" && p.name_en ? p.name_en : p.name;
    if ((p.availability ?? "in") === "out") {
      return json({ error: t(`« ${name} » n'est plus disponible. Retirez-le du panier.`, `“${name}” is no longer available. Please remove it from your cart.`) }, 409, origin);
    }
    let size = String(it.size ?? "").trim();
    if (p.type === "bagues") {
      const allowed = (p.availability ?? "in") === "in" && p.sizes_in_stock?.length
        ? p.sizes_in_stock : String(p.specs?.size ?? "").split(/[,;]\s*/).filter(Boolean);
      if (allowed.length && !allowed.includes(size)) {
        return json({ error: t(`Choisissez une taille disponible pour « ${name} ».`, `Please choose an available size for “${name}”.`) }, 400, origin);
      }
    } else size = "";
    const unit = Math.round(p.price * 100);
    if (!(unit > 0)) return json({ error: t("Prix invalide.", "Invalid price.") }, 400, origin);
    subtotalCents += unit * qty;
    maxLead = Math.max(maxLead, leadDays(p));
    summary.push(`${p.ref}${size ? ` T${size}` : ""} x${qty}`);
    const lead = leadDays(p);
    const status = p.availability === "preorder" ? t(" · Précommande", " · Pre-order")
      : p.availability === "order" ? t(" · Expédié sous 10 à 15 jours", " · Ships in 10–15 days")
      : lead ? t(` · Expédié sous ${lead} jours`, ` · Ships within ${lead} days`) : "";
    lineItems.push({
      quantity: qty,
      price_data: {
        currency: "eur",
        unit_amount: unit,
        product_data: {
          name: size ? `${name} — ${t("Taille", "Size")} ${size}` : name,
          description: `${t("Réf.", "Ref.")} ${p.ref}${status}`,
          ...(p.img ? { images: [`${SITE_URL}/images/products/${encodeURIComponent(p.img)}`] } : {}),
          metadata: { ref: p.ref, size },
        },
      },
    });
  }

  const shippingCents = zone.freeFromCents !== null && subtotalCents >= zone.freeFromCents ? 0 : zone.cents;
  const base = lang === "en" ? `${SITE_URL}/en` : SITE_URL;
  const session = {
    mode: "payment",
    locale: lang,
    line_items: lineItems,
    success_url: `${base}/commande-confirmee.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/index.html?panier=1`,
    shipping_address_collection: { allowed_countries: zone.countries },
    shipping_options: [{
      shipping_rate_data: {
        type: "fixed_amount",
        display_name: zone.label[lang],
        fixed_amount: { amount: shippingCents, currency: "eur" },
        delivery_estimate: { minimum: { unit: "business_day", value: zone.days[0] + maxLead }, maximum: { unit: "business_day", value: zone.days[1] + maxLead } },
      },
    }],
    phone_number_collection: { enabled: true },
    billing_address_collection: "auto",
    allow_promotion_codes: true,
    custom_text: {
      submit: {
        message: t(
          "En validant, vous acceptez nos conditions générales de vente (rolf.fr/cgv). TVA non applicable, art. 293 B du CGI.",
          "By paying, you accept our terms & conditions of sale (rolf.fr/cgv). VAT not applicable, art. 293 B of the French Tax Code.",
        ),
      },
    },
    metadata: { zone: zoneKey, items: summary.join(", ").slice(0, 500) },
    payment_intent_data: { description: `ROLF — ${summary.join(", ")}`.slice(0, 1000) },
  };

  const res = await fetch(`${Deno.env.get("STRIPE_API_BASE") ?? "https://api.stripe.com"}/v1/checkout/sessions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${STRIPE_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: formEncode(session),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("stripe", res.status, JSON.stringify(data?.error ?? data));
    return json({ error: t("Le paiement n'a pas pu démarrer. Réessayez dans un instant.", "Payment could not be started. Please try again shortly.") }, 502, origin);
  }
  return json({ url: data.url }, 200, origin);
});
