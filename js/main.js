/* ========== CART STATE ========== */
let cart = JSON.parse(localStorage.getItem('rolf_cart') || '[]');

function saveCart() { localStorage.setItem('rolf_cart', JSON.stringify(cart)); }

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
    div.innerHTML = `
      <div class="cart-item-img" style="display:flex;align-items:center;justify-content:center;font-size:2rem;background:#f8f6f3">⌚</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${item.price} €</div>
        <div class="cart-item-qty">
          <button class="qty-ctrl" onclick="changeQty(${idx}, -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-ctrl" onclick="changeQty(${idx}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item-del" onclick="removeFromCart(${idx})" title="Retirer">✕</button>
    `;
    body.appendChild(div);
  });
}

function addToCart(name, price, btn) {
  const existing = cart.find(i => i.name === name);
  if (existing) { existing.qty++; }
  else { cart.push({ name, price, qty: 1 }); }
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
  btn.textContent = '✓ Merci !';
  btn.style.background = '#27ae60';
  input.value = '';
  setTimeout(() => { btn.textContent = "S'inscrire"; btn.style.background = ''; }, 3000);
}

/* ========== COUNTDOWN ========== */
function initCountdown(elId, endsAt) {
  const el = document.getElementById(elId);
  if (!el) return;
  const target = new Date(endsAt).getTime();
  function tick() {
    const diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.querySelectorAll('[data-u]').forEach(u => {
      const map = { d, h, m, s };
      u.textContent = String(map[u.dataset.u]).padStart(2, '0');
    });
  }
  tick();
  setInterval(tick, 1000);
}

/* ========== PARRAINAGE ========== */
function copyReferralCode(code, btn) {
  navigator.clipboard?.writeText(code).catch(() => {});
  if (btn) {
    const original = btn.textContent;
    btn.textContent = '✓ Copié !';
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

const PRODUCT_IMG_BASE = 'images/products/';

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

const TYPE_LABELS_PLURAL = { montres: 'Montres', bagues: 'Bagues', bracelets: 'Bracelets', colliers: 'Colliers', boucles: "Boucles d'oreilles" };
const TYPE_LABELS_SINGULAR = { montres: 'Montre', bagues: 'Bague', bracelets: 'Bracelet', colliers: 'Collier', boucles: "Boucles d'oreilles" };
const PUBLIC_LABELS = { homme: 'Homme', femme: 'Femme', mixte: 'Mixte' };
const MATERIAL_LABELS = { acier: 'Acier', or: 'Plaqué or', argent: 'Argent', cuir: 'Cuir', silicone: 'Silicone' };
const COLOR_LABELS = { or: 'Or', argent: 'Argent', noir: 'Noir', rose: 'Rose', blanc: 'Blanc', bleu: 'Bleu', vert: 'Vert', rouge: 'Rouge', multicolore: 'Multicolore' };
const STYLE_LABELS = { classique: 'Classique', moderne: 'Moderne', vintage: 'Vintage', sportif: 'Sportif', romantique: 'Romantique' };

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
  return `
    <div class="product-card" data-type="${p.type}" data-public="${p.public}" data-brand="${p.brand_slug}" data-material="${p.material}" data-color="${p.color}" data-style="${p.style}" data-price="${p.price}">
      <div class="product-img-wrap">
        <img src="${productImageSrc(p)}" alt="${nameSafe}" loading="lazy" onerror="this.onerror=null;this.src='${productImage(p)}'" />
        ${badgeHtml}
        <div class="product-quick-actions"><button class="qa-btn">♡</button><button class="qa-btn">👁</button></div>
      </div>
      <div class="product-info">
        <div class="product-cat">${catLine}</div>
        <div class="product-name">${nameSafe}</div>
        <div class="product-stars" style="font-size:0.72rem;color:var(--text-muted);letter-spacing:0;font-style:italic">${escapeHtml(p.desc || '')}</div>
        <div class="product-footer">
          <div class="product-price">${priceHtml}</div>
          <button class="atc-btn" onclick="addToCart('${jsAttrString(p.name)}', ${p.price}, this)">+</button>
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

  catalogFiltered = CATALOG.filter(p => matchesFilters(p, checked) && p.price >= priceMin && p.price <= priceMax);
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

  let html = `<button class="page-btn page-nav" ${catalogPage === 1 ? 'disabled' : ''} onclick="goToCatalogPage(${catalogPage - 1})">← Précédent</button>`;
  paginationRangeList(catalogPage, totalPages).forEach(p => {
    html += p === '...'
      ? `<span class="page-ellipsis">…</span>`
      : `<button class="page-btn ${p === catalogPage ? 'active' : ''}" onclick="goToCatalogPage(${p})">${p}</button>`;
  });
  html += `<button class="page-btn page-nav" ${catalogPage === totalPages ? 'disabled' : ''} onclick="goToCatalogPage(${catalogPage + 1})">Suivant →</button>`;
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

  if (grid) grid.innerHTML = pageItems.map(renderProductCard).join('');
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
  applyCatalogFilters();
}

function applyURLParams() {
  const params = new URLSearchParams(location.search);
  const type = params.get('type');
  const pub = params.get('public');
  const cat = params.get('cat');
  const brand = params.get('brand');
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
}

function wireFilterEvents() {
  document.querySelectorAll('.filters-sidebar input[type=checkbox][data-group]').forEach(cb => cb.addEventListener('change', applyCatalogFilters));
  document.getElementById('priceMin')?.addEventListener('input', applyCatalogFilters);
  document.getElementById('priceMax')?.addEventListener('input', applyCatalogFilters);
}

function initCollectionCatalog() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return; // not on collection.html

  fetch('data/products.json')
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(data => {
      CATALOG = data;
      CATALOG.forEach((p, i) => { p._idx = i; });
      buildFilterOptions();
      applyURLParams();
      wireFilterEvents();
      applyCatalogFilters();
    })
    .catch(err => {
      console.error('Impossible de charger le catalogue :', err);
      grid.innerHTML = '<p style="padding:40px 0;color:var(--text-muted)">Catalogue momentanément indisponible.</p>';
    });
}

/* ========== INIT ========== */
updateCartUI();
initCollectionCatalog();
