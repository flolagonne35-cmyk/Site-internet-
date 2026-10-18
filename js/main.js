/* ========== I18N ========== */
const LANG = document.documentElement.lang === 'en' ? 'en' : 'fr';
const SITE_ROOT = LANG === 'en' ? '../' : '';

const STR = LANG === 'en' ? {
  remove: 'Remove',
  catalogUnavailable: 'Catalogue temporarily unavailable.',
  prev: '← Previous',
  next: 'Next →',
  searchLoading: 'Loading catalogue…',
  searchNoResults: q => `No results for “${q}”.`,
  searchSeeAll: q => `See all results for “${q}” →`,
  newsletterThanks: '✓ Thank you!',
  newsletterSubscribe: 'Subscribe',
  copied: '✓ Copied!',
} : {
  remove: 'Retirer',
  catalogUnavailable: 'Catalogue momentanément indisponible.',
  prev: '← Précédent',
  next: 'Suivant →',
  searchLoading: 'Chargement du catalogue…',
  searchNoResults: q => `Aucun résultat pour « ${q} ».`,
  searchSeeAll: q => `Voir tous les résultats pour « ${q} » →`,
  newsletterThanks: '✓ Merci !',
  newsletterSubscribe: "S'inscrire",
  copied: '✓ Copié !',
};

/* ========== CART STATE ========== */
let cart = JSON.parse(localStorage.getItem('rolf_cart') || '[]');

function saveCart() { localStorage.setItem('rolf_cart', JSON.stringify(cart)); }

/* ========== WISHLIST (localStorage, per-visitor) ========== */
function rolfGetWishlist() {
  try { return JSON.parse(localStorage.getItem('rolf_wishlist') || '[]'); } catch (e) { return []; }
}
function rolfIsWished(ref) { return rolfGetWishlist().includes(ref); }
function rolfToggleWish(ref, btn) {
  let list = rolfGetWishlist();
  if (list.includes(ref)) list = list.filter(r => r !== ref);
  else list.push(ref);
  localStorage.setItem('rolf_wishlist', JSON.stringify(list));
  if (btn) btn.classList.toggle('active');
}

function updateCartUI() {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  document.querySelectorAll('#cartCount').forEach(el => el.textContent = count);
  const countEl = document.getElementById('cartItemCount');
  if (countEl) countEl.textContent = count;
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = total.toFixed(2) + ' €';

  const body = document.getElementById('cartBody');
  const empty = document.getElementById('cartEmpty');
  const ftr = document.getElementById('cartFtr');
  if (!body) return;

  if (cart.length === 0) {
    if (empty) empty.style.display = '';
    if (ftr) ftr.style.display = 'none';
    body.querySelectorAll('.cart-item').forEach(el => el.remove());
    return;
  }
  if (empty) empty.style.display = 'none';
  if (ftr) ftr.style.display = '';

  body.querySelectorAll('.cart-item').forEach(el => el.remove());
  cart.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    const imgSrc = item.img ? `${SITE_ROOT}images/products/${encodeURIComponent(item.img)}` : PLACEHOLDER_IMAGES.montres[0];
    div.innerHTML = `
      <img class="cart-item-img" src="${imgSrc}" alt="${escapeHtml(item.name)}" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGES.montres[0]}'" />
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-price">${item.price} €</div>
        <div class="cart-item-qty">
          <button class="qty-ctrl" onclick="changeQty(${idx}, -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-ctrl" onclick="changeQty(${idx}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item-del" onclick="removeFromCart(${idx})" title="${STR.remove}">✕</button>
    `;
    body.appendChild(div);
  });
}

function addToCart(name, price, btn, img) {
  const existing = cart.find(i => i.name === name);
  if (existing) { existing.qty++; }
  else { cart.push({ name, price, qty: 1, img }); }
  saveCart(); updateCartUI();

  if (btn) {
    btn.textContent = '✓';
    btn.style.background = '#27ae60';
    setTimeout(() => { btn.textContent = '+'; btn.style.background = ''; }, 1200);
  }
  openCart();
}

function changeQty(idx, delta) {
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart(); updateCartUI();
}

function removeFromCart(idx) {
  cart.splice(idx, 1);
  saveCart(); updateCartUI();
}

/* ========== CART SIDEBAR ========== */
function openCart() {
  document.getElementById('cartSidebar')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cartSidebar')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('cartBtn')?.addEventListener('click', openCart);
document.getElementById('cartClose')?.addEventListener('click', closeCart);
document.getElementById('cartOverlay')?.addEventListener('click', closeCart);

/* ========== HEADER SCROLL ========== */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (header) header.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ========== HERO PARALLAX ========== */
const hero = document.getElementById('hero');
if (hero) {
  setTimeout(() => hero.classList.add('loaded'), 100);
}

/* ========== MOBILE MENU ========== */
const mobileMenu = document.getElementById('mobileMenu');
const menuBtn = document.getElementById('menuBtn');
const menuClose = document.getElementById('menuClose');

function openMenu() {
  mobileMenu?.classList.add('open');
  menuBtn?.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeMenu() {
  mobileMenu?.classList.remove('open');
  menuBtn?.classList.remove('active');
  document.body.style.overflow = '';
}
menuBtn?.addEventListener('click', openMenu);
menuClose?.addEventListener('click', closeMenu);
mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

function rolfToggleNavGroup(btn) {
  btn.closest('.mobile-nav-group')?.classList.toggle('open');
}

/* ========== SEARCH ========== */
const searchOverlay = document.getElementById('searchOverlay');
document.getElementById('searchBtn')?.addEventListener('click', () => {
  searchOverlay?.classList.add('open');
  document.getElementById('searchInput')?.focus();
});
document.getElementById('searchClose')?.addEventListener('click', () => searchOverlay?.classList.remove('open'));
searchOverlay?.addEventListener('click', e => { if (e.target === searchOverlay) searchOverlay.classList.remove('open'); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { searchOverlay?.classList.remove('open'); closeCart(); closeMenu(); }
});

/* ========== PRODUCT TABS ========== */
const tabBtns = document.querySelectorAll('.tab-btn');
const productCards = document.querySelectorAll('.product-card[data-cat]');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;

    productCards.forEach(card => {
      const cat = card.dataset.cat;
      const show = filter === 'all' || cat === filter;
      card.style.display = show ? '' : 'none';
    });
  });
});

/* ========== SCROLL REVEAL ========== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ========== NEWSLETTER ========== */
function handleNewsletter(e) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const btn = e.target.querySelector('button');
  btn.textContent = STR.newsletterThanks;
  btn.style.background = '#27ae60';
  input.value = '';
  setTimeout(() => { btn.textContent = STR.newsletterSubscribe; btn.style.background = ''; }, 3000);
}

/* ========== PARRAINAGE ========== */
function copyReferralCode(code, btn) {
  navigator.clipboard?.writeText(code).catch(() => {});
  if (btn) {
    const original = btn.textContent;
    btn.textContent = STR.copied;
    setTimeout(() => { btn.textContent = original; }, 2000);
  }
}

/* ========== PRODUCT GALLERY ========== */
function switchProductImg(src, thumb, fallback) {
  const main = document.getElementById('productMainImg');
  if (main) {
    main.src = src;
    main.onerror = fallback ? () => { main.onerror = null; main.src = fallback; } : null;
  }
  document.querySelectorAll('.product-thumb').forEach(t => t.classList.remove('active'));
  thumb?.classList.add('active');
}

/* ========== CATALOG (DATA-DRIVEN, PAGINATED) ========== */
let CATALOG = [];
let catalogFiltered = [];
let catalogPage = 1;
const CATALOG_PAGE_SIZE = 30;
let catalogLoadPromise = null;

function loadCatalog() {
  if (catalogLoadPromise) return catalogLoadPromise;
  catalogLoadPromise = fetch(SITE_ROOT + 'data/products.json')
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(data => {
      CATALOG = data;
      CATALOG.forEach((p, i) => { p._idx = i; });
      return CATALOG;
    })
    .catch(err => {
      console.error('Impossible de charger le catalogue :', err);
      return [];
    });
  return catalogLoadPromise;
}

const PRODUCT_IMG_BASE = SITE_ROOT + 'images/products/';

const PLACEHOLDER_IMAGES = {
  montres: [
    'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=400&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=400&h=400&fit=crop&q=80',
  ],
  bijoux: [
    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=400&h=400&fit=crop&q=80',
  ],
};

const TYPE_LABELS_PLURAL = LANG === 'en'
  ? { montres: 'Watches', bagues: 'Rings', bracelets: 'Bracelets', colliers: 'Necklaces', boucles: 'Earrings' }
  : { montres: 'Montres', bagues: 'Bagues', bracelets: 'Bracelets', colliers: 'Colliers', boucles: "Boucles d'oreilles" };
const TYPE_LABELS_SINGULAR = LANG === 'en'
  ? { montres: 'Watch', bagues: 'Ring', bracelets: 'Bracelet', colliers: 'Necklace', boucles: 'Earrings' }
  : { montres: 'Montre', bagues: 'Bague', bracelets: 'Bracelet', colliers: 'Collier', boucles: "Boucles d'oreilles" };
const PUBLIC_LABELS = LANG === 'en'
  ? { homme: 'Men', femme: 'Women', mixte: 'Unisex' }
  : { homme: 'Homme', femme: 'Femme', mixte: 'Mixte' };
const MATERIAL_LABELS = LANG === 'en'
  ? { acier: 'Steel', or: 'Gold-plated', argent: 'Silver', cuir: 'Leather', silicone: 'Silicone' }
  : { acier: 'Acier', or: 'Plaqué or', argent: 'Argent', cuir: 'Cuir', silicone: 'Silicone' };
const COLOR_LABELS = LANG === 'en'
  ? { or: 'Gold', argent: 'Silver', noir: 'Black', rose: 'Pink', blanc: 'White', bleu: 'Blue', vert: 'Green', rouge: 'Red', multicolore: 'Multicolour' }
  : { or: 'Or', argent: 'Argent', noir: 'Noir', rose: 'Rose', blanc: 'Blanc', bleu: 'Bleu', vert: 'Vert', rouge: 'Rouge', multicolore: 'Multicolore' };
const STYLE_LABELS = LANG === 'en'
  ? { classique: 'Classic', moderne: 'Modern', vintage: 'Vintage', sportif: 'Sporty', romantique: 'Romantic' }
  : { classique: 'Classique', moderne: 'Moderne', vintage: 'Vintage', sportif: 'Sportif', romantique: 'Romantique' };

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// safe to embed inside a single-quoted JS string literal that itself sits inside a double-quoted HTML attribute
function jsAttrString(str) {
  const jsEscaped = String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return jsEscaped.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatPriceEUR(n) {
  const rounded = Math.round(n * 100) / 100;
  if (Number.isInteger(rounded)) return `${rounded} €`;
  const s = rounded.toFixed(2).replace(/0$/, '').replace(/\.$/, '').replace('.', ',');
  return `${s} €`;
}

function productImage(p) {
  const set = p.type === 'montres' ? PLACEHOLDER_IMAGES.montres : PLACEHOLDER_IMAGES.bijoux;
  const idx = typeof p._idx === 'number' ? p._idx : 0;
  return set[idx % set.length];
}

function productImageSrc(p) {
  return p.img ? PRODUCT_IMG_BASE + encodeURIComponent(p.img) : productImage(p);
}

function renderProductCard(p) {
  const nameSafe = escapeHtml(p.name);
  const catLine = `${PUBLIC_LABELS[p.public] || p.public} — ${TYPE_LABELS_SINGULAR[p.type] || p.type} — ${escapeHtml(p.brand)}`;
  const priceHtml = p.was
    ? `<span class="price-now">${formatPriceEUR(p.price)}</span><span class="price-was">${formatPriceEUR(p.was)}</span>`
    : `<span class="price-now">${formatPriceEUR(p.price)}</span>`;
  const badgeHtml = p.was
    ? `<span class="product-badge badge-promo">-${Math.round((1 - p.price / p.was) * 100)}%</span>`
    : '';
  const href = `product.html?ref=${encodeURIComponent(p.ref)}`;
  const wished = rolfIsWished(p.ref);
  return `
    <div class="product-card" data-type="${p.type}" data-public="${p.public}" data-brand="${p.brand_slug}" data-material="${p.material}" data-color="${p.color}" data-style="${p.style}" data-price="${p.price}">
      <a href="${href}" class="product-img-wrap">
        <img src="${productImageSrc(p)}" alt="${nameSafe}" loading="lazy" onerror="this.onerror=null;this.src='${productImage(p)}'" />
        ${badgeHtml}
      </a>
      <div class="product-quick-actions"><button class="qa-btn${wished ? ' active' : ''}" onclick="rolfToggleWish('${p.ref}', this)"><span data-icon="heart"></span></button><a class="qa-btn" href="${href}"><span data-icon="eye"></span></a></div>
      <div class="product-info">
        <div class="product-cat">${catLine}</div>
        <a href="${href}" class="product-name">${nameSafe}</a>
        <div class="product-stars" style="font-size:0.72rem;color:var(--text-muted);letter-spacing:0;font-style:italic">${escapeHtml(p.desc || '')}</div>
        <div class="product-footer">
          <div class="product-price">${priceHtml}</div>
          <button class="atc-btn" onclick="addToCart('${jsAttrString(p.name)}', ${p.price}, this, '${p.img ? jsAttrString(p.img) : ''}')">+</button>
        </div>
      </div>
    </div>`;
}

function buildFilterGroup(containerId, dataGroup, valueField, labelFn) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const counts = new Map();
  CATALOG.forEach(p => {
    const key = p[valueField];
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const keys = Array.from(counts.keys()).sort((a, b) => labelFn(a).localeCompare(labelFn(b), 'fr'));
  container.innerHTML = keys.map(key => (
    `<label class="filter-option"><input type="checkbox" data-group="${dataGroup}" value="${escapeHtml(key)}" /> ${escapeHtml(labelFn(key))} <span class="filter-count">${counts.get(key)}</span></label>`
  )).join('');
}

function buildBrandFilterGroup() {
  const container = document.getElementById('filterBrand');
  if (!container) return;
  const counts = new Map();
  const names = new Map();
  CATALOG.forEach(p => {
    counts.set(p.brand_slug, (counts.get(p.brand_slug) || 0) + 1);
    names.set(p.brand_slug, p.brand);
  });
  const keys = Array.from(counts.keys()).sort((a, b) => names.get(a).localeCompare(names.get(b), 'fr'));
  container.innerHTML = keys.map(key => (
    `<label class="filter-option"><input type="checkbox" data-group="brand" value="${escapeHtml(key)}" /> ${escapeHtml(names.get(key))} <span class="filter-count">${counts.get(key)}</span></label>`
  )).join('');
}

function buildFilterOptions() {
  buildFilterGroup('filterType', 'type', 'type', k => TYPE_LABELS_PLURAL[k] || k);
  buildFilterGroup('filterPublic', 'public', 'public', k => PUBLIC_LABELS[k] || k);
  buildBrandFilterGroup();
  buildFilterGroup('filterMaterial', 'material', 'material', k => MATERIAL_LABELS[k] || k);
  buildFilterGroup('filterColor', 'color', 'color', k => COLOR_LABELS[k] || k);
  buildFilterGroup('filterStyle', 'style', 'style', k => STYLE_LABELS[k] || k);
}

function getActiveFilters() {
  const checked = {};
  document.querySelectorAll('.filters-sidebar input[type=checkbox][data-group]:checked').forEach(cb => {
    if (!checked[cb.dataset.group]) checked[cb.dataset.group] = [];
    checked[cb.dataset.group].push(cb.value);
  });
  return checked;
}

function matchesFilters(p, checked) {
  for (const group in checked) {
    const values = checked[group];
    if (!values.length) continue;
    const field = group === 'brand' ? 'brand_slug' : group;
    if (!values.includes(String(p[field]))) return false;
  }
  return true;
}

function applyCatalogFilters() {
  if (!CATALOG.length) return;
  const checked = getActiveFilters();
  const minInput = parseFloat(document.getElementById('priceMin')?.value);
  const maxInput = parseFloat(document.getElementById('priceMax')?.value);
  const priceMin = isNaN(minInput) ? 0 : minInput;
  const priceMax = isNaN(maxInput) ? Infinity : maxInput;
  const query = (document.getElementById('collectionSearch')?.value || '').trim().toLowerCase();

  let list = CATALOG.filter(p => matchesFilters(p, checked) && p.price >= priceMin && p.price <= priceMax);

  if (query) {
    list = list
      .map(p => ({ p, score: queryScore(p, query) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.p);
  }

  const sortKey = document.getElementById('sortSelect')?.value;
  if (sortKey === 'price-asc') list = list.slice().sort((a, b) => a.price - b.price);
  else if (sortKey === 'price-desc') list = list.slice().sort((a, b) => b.price - a.price);

  catalogFiltered = list;
  catalogPage = 1;
  renderCatalogPage();
}

function paginationRangeList(current, total) {
  const delta = 1;
  const range = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    } else if (range[range.length - 1] !== '...') {
      range.push('...');
    }
  }
  return range;
}

function renderPagination(totalPages) {
  const el = document.getElementById('pagination');
  if (!el) return;
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = `<button class="page-btn page-nav" ${catalogPage === 1 ? 'disabled' : ''} onclick="goToCatalogPage(${catalogPage - 1})">${STR.prev}</button>`;
  paginationRangeList(catalogPage, totalPages).forEach(p => {
    html += p === '...'
      ? `<span class="page-ellipsis">…</span>`
      : `<button class="page-btn ${p === catalogPage ? 'active' : ''}" onclick="goToCatalogPage(${p})">${p}</button>`;
  });
  html += `<button class="page-btn page-nav" ${catalogPage === totalPages ? 'disabled' : ''} onclick="goToCatalogPage(${catalogPage + 1})">${STR.next}</button>`;
  el.innerHTML = html;
}

function renderCatalogPage() {
  const grid = document.getElementById('productsGrid');
  const countEl = document.getElementById('resultCount');
  const noResults = document.getElementById('noResults');
  const total = catalogFiltered.length;

  if (countEl) countEl.textContent = total;
  if (noResults) noResults.style.display = total === 0 ? 'block' : 'none';

  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  if (catalogPage > totalPages) catalogPage = totalPages;
  if (catalogPage < 1) catalogPage = 1;
  const startIdx = (catalogPage - 1) * CATALOG_PAGE_SIZE;
  const pageItems = catalogFiltered.slice(startIdx, startIdx + CATALOG_PAGE_SIZE);

  if (grid) { grid.innerHTML = pageItems.map(renderProductCard).join(''); renderIcons(grid); }
  renderPagination(totalPages);
}

function goToCatalogPage(n) {
  catalogPage = n;
  renderCatalogPage();
  document.querySelector('.collection-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearCatalogFilters() {
  document.querySelectorAll('.filters-sidebar input[type=checkbox][data-group]').forEach(cb => cb.checked = false);
  const min = document.getElementById('priceMin'), max = document.getElementById('priceMax');
  const maxPrice = CATALOG.length ? Math.ceil(Math.max(...CATALOG.map(p => p.price))) : 1000;
  if (min) min.value = 0;
  if (max) max.value = maxPrice;
  const search = document.getElementById('collectionSearch');
  if (search) search.value = '';
  const sort = document.getElementById('sortSelect');
  if (sort) sort.value = 'relevance';
  applyCatalogFilters();
}

function applyURLParams() {
  const params = new URLSearchParams(location.search);
  const type = params.get('type');
  const pub = params.get('public');
  const cat = params.get('cat');
  const brand = params.get('brand');
  const q = params.get('q');
  const bijouxTypes = ['bagues', 'bracelets', 'colliers', 'boucles'];

  function check(group, value) {
    const box = document.querySelector(`.filters-sidebar input[data-group="${group}"][value="${value}"]`);
    if (box) box.checked = true;
  }

  if (type) check('type', type);
  if (pub) check('public', pub);
  if (brand) check('brand', brand);
  if (cat === 'montres') check('type', 'montres');
  if (cat === 'bijoux') bijouxTypes.forEach(t => check('type', t));
  if (q) {
    const search = document.getElementById('collectionSearch');
    if (search) search.value = q;
  }
}

function wireFilterEvents() {
  document.querySelectorAll('.filters-sidebar input[type=checkbox][data-group]').forEach(cb => cb.addEventListener('change', applyCatalogFilters));
  document.getElementById('priceMin')?.addEventListener('input', applyCatalogFilters);
  document.getElementById('priceMax')?.addEventListener('input', applyCatalogFilters);
  document.getElementById('sortSelect')?.addEventListener('change', applyCatalogFilters);
  let searchDebounce;
  document.getElementById('collectionSearch')?.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(applyCatalogFilters, 150);
  });
}

function initCollectionCatalog() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return; // not on collection.html

  loadCatalog().then(() => {
    if (!CATALOG.length) {
      grid.innerHTML = `<p style="padding:40px 0;color:var(--text-muted)">${STR.catalogUnavailable}</p>`;
      return;
    }
    buildFilterOptions();
    applyURLParams();
    wireFilterEvents();
    applyCatalogFilters();
  });
}

/* ========== HEADER SEARCH (live suggestions, exact-ref and full-text) ========== */
function queryScore(p, q) {
  const ref = p.ref.toLowerCase();
  const name = p.name.toLowerCase();
  const brand = p.brand.toLowerCase();
  const desc = (p.desc || '').toLowerCase();
  if (ref === q) return 100;
  if (ref.startsWith(q)) return 90;
  if (name.startsWith(q)) return 80;
  if (ref.includes(q)) return 70;
  if (name.includes(q)) return 60;
  if (brand.includes(q)) return 50;
  if (desc.includes(q)) return 20;
  return 0;
}

function searchProducts(query, limit) {
  const q = query.trim().toLowerCase();
  if (!q || !CATALOG.length) return [];
  return CATALOG
    .map(p => ({ p, score: queryScore(p, q) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit || 50)
    .map(x => x.p);
}

function renderSearchResults(rawQuery) {
  const box = document.getElementById('searchResults');
  if (!box) return;
  const q = rawQuery.trim();
  if (!q) { box.innerHTML = ''; box.classList.remove('open'); return; }

  if (!CATALOG.length) {
    box.innerHTML = `<p class="search-empty">${STR.searchLoading}</p>`;
    box.classList.add('open');
    return;
  }

  const matches = searchProducts(q, 6);
  if (matches.length === 0) {
    box.innerHTML = `<p class="search-empty">${STR.searchNoResults(escapeHtml(q))}</p>`;
    box.classList.add('open');
    return;
  }

  const rows = matches.map(p => `
    <a class="search-result-row" href="product.html?ref=${encodeURIComponent(p.ref)}">
      <img src="${productImageSrc(p)}" alt="${escapeHtml(p.name)}" onerror="this.onerror=null;this.src='${productImage(p)}'" />
      <span class="search-result-info">
        <span class="search-result-name">${escapeHtml(p.name)}</span>
        <span class="search-result-meta">${escapeHtml(p.brand)} — ${formatPriceEUR(p.price)}</span>
      </span>
    </a>`).join('');

  box.innerHTML = rows + `<a class="search-result-all" href="collection.html?q=${encodeURIComponent(q)}">${STR.searchSeeAll(escapeHtml(q))}</a>`;
  box.classList.add('open');
}

function initHeaderSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderSearchResults(input.value), 150);
  });
  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    const exact = CATALOG.find(p => p.ref.toLowerCase() === q.toLowerCase());
    location.href = exact
      ? `product.html?ref=${encodeURIComponent(exact.ref)}`
      : `collection.html?q=${encodeURIComponent(q)}`;
  });
}

/* ========== ICONS (line-art SVG, replaces emoji glyphs site-wide) ========== */
const ICONS = {
  search: '<svg viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6"/><path d="M17 17l-4.3-4.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  cart: '<svg viewBox="0 0 20 20" fill="none"><path d="M5 7h10l-.8 9.2a1 1 0 01-1 .8H6.8a1 1 0 01-1-.8L5 7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.5 7V5.5a2.5 2.5 0 015 0V7" stroke="currentColor" stroke-width="1.6"/></svg>',
  user: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="6.5" r="3.2" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 17c1-3.6 4-5.4 6.5-5.4s5.5 1.8 6.5 5.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  truck: '<svg viewBox="0 0 20 20" fill="none"><path d="M2.5 6h8v7.5h-8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10.5 9h3.3l2.7 2.7v1.8h-6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="6" cy="14.7" r="1.3" stroke="currentColor" stroke-width="1.4"/><circle cx="13.5" cy="14.7" r="1.3" stroke="currentColor" stroke-width="1.4"/></svg>',
  return: '<svg viewBox="0 0 20 20" fill="none"><path d="M4 10a6 6 0 1 1 1.8 4.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M4 14.5V10h4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  shield: '<svg viewBox="0 0 20 20" fill="none"><path d="M10 2.5l6.5 2.3v5c0 4.3-2.8 6.9-6.5 8-3.7-1.1-6.5-3.7-6.5-8v-5L10 2.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7.3 10l1.9 1.9 3.5-3.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  gem: '<svg viewBox="0 0 20 20" fill="none"><path d="M4 8l3-4.5h6l3 4.5-6 8.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 8h12M8 3.5L7 8l3 8.5 3-8.5-1-4.5" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  'badge-check': '<svg viewBox="0 0 20 20" fill="none"><path d="M10 2.2l2.1 1.2 2.4-.2 1 2.2 2.1 1.3-.6 2.3.6 2.3-2.1 1.3-1 2.2-2.4-.2L10 17l-2.1-1.2-2.4.2-1-2.2-2.1-1.3.6-2.3-.6-2.3 2.1-1.3 1-2.2 2.4.2L10 2.2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M7.3 10l1.9 1.9 3.5-3.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  gift: '<svg viewBox="0 0 20 20" fill="none"><rect x="3" y="8" width="14" height="8.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 8h14v3H3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 8v8.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 8C8.5 8 6.8 7 6.8 5.4a1.8 1.8 0 013.2-1.1c.6.6 1 1.8 0 3.7zM10 8c1.5 0 3.2-1 3.2-2.6a1.8 1.8 0 00-3.2-1.1c-.6.6-1 1.8 0 3.7z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  pin: '<svg viewBox="0 0 20 20" fill="none"><path d="M10 17.5S4 12.2 4 7.8a6 6 0 1112 0c0 4.4-6 9.7-6 9.7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="10" cy="7.7" r="2.1" stroke="currentColor" stroke-width="1.4"/></svg>',
  mail: '<svg viewBox="0 0 20 20" fill="none"><rect x="2.5" y="4.5" width="15" height="11" rx="1.2" stroke="currentColor" stroke-width="1.5"/><path d="M3.2 5.5l6.8 5.4 6.8-5.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  phone: '<svg viewBox="0 0 20 20" fill="none"><path d="M5 3.5h2.3l1.1 3-1.5 1.4a9 9 0 005.2 5.2l1.4-1.5 3 1.1V15a1.5 1.5 0 01-1.6 1.5A12.5 12.5 0 013.5 5.1 1.5 1.5 0 015 3.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  lock: '<svg viewBox="0 0 20 20" fill="none"><rect x="4.5" y="9" width="11" height="8" rx="1.2" stroke="currentColor" stroke-width="1.5"/><path d="M6.5 9V6.5a3.5 3.5 0 017 0V9" stroke="currentColor" stroke-width="1.5"/></svg>',
  heart: '<svg viewBox="0 0 20 20" fill="none"><path d="M10 17S3 12.4 3 7.8a3.8 3.8 0 017-2.1 3.8 3.8 0 017 2.1C17 12.4 10 17 10 17z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  eye: '<svg viewBox="0 0 20 20" fill="none"><path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="10" cy="10" r="2.3" stroke="currentColor" stroke-width="1.5"/></svg>',
  instagram: '<svg viewBox="0 0 20 20" fill="none"><rect x="2.5" y="2.5" width="15" height="15" rx="4" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="3.6" stroke="currentColor" stroke-width="1.5"/><circle cx="14.2" cy="5.8" r="0.9" fill="currentColor"/></svg>',
  facebook: '<svg viewBox="0 0 20 20" fill="none"><path d="M12.5 7h-1.8c-.5 0-1 .4-1 1v1.5H12.5l-.3 2.2h-2V17h-2.4v-5.3H6v-2.2h1.8V8c0-1.8 1.1-3 3-3h1.7V7z" fill="currentColor"/></svg>',
  tiktok: '<svg viewBox="0 0 20 20" fill="none"><circle cx="7.5" cy="14.5" r="2.3" stroke="currentColor" stroke-width="1.5"/><path d="M9.8 14.5V3.5h1c.3 2 1.7 3.4 3.7 3.7v2c-1.4-.1-2.7-.6-3.7-1.5v6.8" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  ring: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="12.5" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M7.3 7.5L10 3l2.7 4.5-2.7 2.2-2.7-2.2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  bracelet: '<svg viewBox="0 0 20 20" fill="none"><circle cx="6.5" cy="7" r="2.6" stroke="currentColor" stroke-width="1.4"/><circle cx="13.5" cy="7" r="2.6" stroke="currentColor" stroke-width="1.4"/><circle cx="6.5" cy="13.5" r="2.6" stroke="currentColor" stroke-width="1.4"/><circle cx="13.5" cy="13.5" r="2.6" stroke="currentColor" stroke-width="1.4"/></svg>',
  necklace: '<svg viewBox="0 0 20 20" fill="none"><path d="M3.5 4c0 5 2.9 8 6.5 8s6.5-3 6.5-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="14.3" r="2" stroke="currentColor" stroke-width="1.4"/></svg>',
  sparkle: '<svg viewBox="0 0 20 20" fill="none"><path d="M10 2.5c.5 3.3 1.7 4.5 5 5-3.3.5-4.5 1.7-5 5-.5-3.3-1.7-4.5-5-5 3.3-.5 4.5-1.7 5-5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  gear: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.6" stroke="currentColor" stroke-width="1.4"/><path d="M10 3.3v2M10 14.7v2M16.7 10h-2M5.3 10h-2M14.7 5.3l-1.4 1.4M6.7 13.3l-1.4 1.4M14.7 14.7l-1.4-1.4M6.7 6.7L5.3 5.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  leaf: '<svg viewBox="0 0 20 20" fill="none"><path d="M16 4C8 4 4 8.5 4 14.5c6 0 10.5-4 10.5-10.5-2.5 2-5 5-6.5 8" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  trophy: '<svg viewBox="0 0 20 20" fill="none"><path d="M6 4h8v4.5a4 4 0 01-8 0V4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 5H3.5v1.5A2.5 2.5 0 006 9M14 5h2.5v1.5A2.5 2.5 0 0114 9" stroke="currentColor" stroke-width="1.4"/><path d="M10 12.5v2.5M7 17h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  ribbon: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="6" r="3.3" stroke="currentColor" stroke-width="1.5"/><path d="M7.5 8.5L5.5 17l4.5-2.3 4.5 2.3-2-8.5" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  warning: '<svg viewBox="0 0 20 20" fill="none"><path d="M10 3l8 14H2L10 3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 8.5v3.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="14.5" r="0.9" fill="currentColor"/></svg>',
  pencil: '<svg viewBox="0 0 20 20" fill="none"><path d="M12.5 3.5l4 4-9 9-4.3 1 .7-4.3 8.6-9.7z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M11 5l4 4" stroke="currentColor" stroke-width="1.4"/></svg>',
  ruler: '<svg viewBox="0 0 20 20" fill="none"><rect x="2.5" y="7" width="15" height="6" rx="1" stroke="currentColor" stroke-width="1.4" transform="rotate(-10 10 10)"/><path d="M6 8.3l.6 1.8M9 7.7l.6 1.8M12 7.1l.6 1.8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" transform="rotate(-10 10 10)"/></svg>',
  family: '<svg viewBox="0 0 20 20" fill="none"><circle cx="6.5" cy="6" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="13.5" cy="6" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="10" cy="12.5" r="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M3 16c.5-2.5 2-4 3.5-4s3 1.5 3.5 4M10 16.5c.4-1.8 1.4-2.8 3.5-2.8s3.1 1 3.5 2.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  tag: '<svg viewBox="0 0 20 20" fill="none"><path d="M3 3h6.5l7.5 7.5-6.5 6.5L3 9.5V3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="6.5" cy="6.5" r="1.1" fill="currentColor"/></svg>',
  filter: '<svg viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="7" cy="5" r="1.8" fill="currentColor" stroke="var(--white,#fff)" stroke-width="1"/><circle cx="14" cy="10" r="1.8" fill="currentColor" stroke="var(--white,#fff)" stroke-width="1"/><circle cx="9" cy="15" r="1.8" fill="currentColor" stroke="var(--white,#fff)" stroke-width="1"/></svg>',
  chevron: '<svg viewBox="0 0 20 20" fill="none"><path d="M5.5 7.5L10 12l4.5-4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function rolfToggleFilters() {
  const sidebar = document.querySelector('.filters-sidebar');
  const btn = document.getElementById('filterToggleBtn');
  if (!sidebar) return;
  const open = sidebar.classList.toggle('open');
  if (btn) btn.classList.toggle('active', open);
}

function renderIcons(root) {
  (root || document).querySelectorAll('[data-icon]').forEach(el => {
    const svg = ICONS[el.dataset.icon];
    if (svg) el.innerHTML = svg;
  });
}

/* ========== INIT ========== */
updateCartUI();
loadCatalog();
initCollectionCatalog();
initHeaderSearch();
renderIcons();
