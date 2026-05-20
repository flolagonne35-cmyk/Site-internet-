/* ========== CART STATE ========== */
let cart = JSON.parse(localStorage.getItem('horlona_cart') || '[]');

function saveCart() { localStorage.setItem('horlona_cart', JSON.stringify(cart)); }

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

/* ========== INIT ========== */
updateCartUI();
