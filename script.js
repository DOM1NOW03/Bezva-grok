// ===== script.js — Inicializace UI, katalog, navigace, hero, toasty =====
(() => {
  const STATE = {
    products: [],
    currentSlide: 0,
    autoplay: null,
    menuOpen: false,
  };

  document.addEventListener('DOMContentLoaded',init);

  async function init() {
    initNav();
    initHero();
    initCTA();
    await loadProducts();
    initCatalog();
    initToasts();
    wireGlobalQuickView();
    console.log('✅ script.js inicializován');
  }

  // ===== Navigace =====
function initNav() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  const links = document.querySelectorAll('.nav-link');

  toggle?.addEventListener('click', () => {
    STATE.menuOpen = !STATE.menuOpen;
    menu?.classList.toggle('active', STATE.menuOpen);
    toggle.setAttribute('aria-expanded', String(STATE.menuOpen));
  });

  links.forEach((a) =>
    a.addEventListener('click', () => {
      if (STATE.menuOpen) toggle?.click();
    })
  );

  // ✅ Scroll listener — jen přidává/odebírá třídu
  window.addEventListener(
    'scroll',
    () => {
      const nav = document.querySelector('.main-navigation');
      const scrolled = window.scrollY > 50;
      nav?.classList.toggle('is-scrolled', scrolled);
    },
    { passive: true }
  );
}

  // ===== Hero slider =====
  function initHero() {
    const root = document.querySelector('.image-slider');
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prev = document.querySelector('.prev-btn');
    const next = document.querySelector('.next-btn');
    if (!root || !slides.length) return;

    const go = (i) => {
      const count = slides.length;
      const nextIndex = (i + count) % count;
      slides[STATE.currentSlide].classList.remove('active');
      dots[STATE.currentSlide]?.classList.remove('active');
      STATE.currentSlide = nextIndex;
      slides[STATE.currentSlide].classList.add('active');
      dots[STATE.currentSlide]?.classList.add('active');
    };

    prev?.addEventListener('click', () => go(STATE.currentSlide - 1));
    next?.addEventListener('click', () => go(STATE.currentSlide + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));

    // Swipe
    let startX = 0;
    root.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      root.setPointerCapture?.(e.pointerId);
    });
    root.addEventListener('pointerup', (e) => {
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 50) go(STATE.currentSlide + (dx < 0 ? 1 : -1));
      root.releasePointerCapture?.(e.pointerId);
    });

    // Autoplay s pauzou na hover
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      STATE.autoplay = setInterval(() => go(STATE.currentSlide + 1), 5000);
      root.addEventListener('mouseenter', () => clearInterval(STATE.autoplay));
      root.addEventListener('mouseleave', () => {
        STATE.autoplay = setInterval(() => go(STATE.currentSlide + 1), 5000);
      });
    }
  }

  // ===== CTA scroll =====
  function initCTA() {
    document.querySelectorAll('[data-scroll-to]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-scroll-to');
        const el = document.getElementById(id);
        if (!el) return;
        const offset = 70; // výška navigace
        window.scrollTo({ top: el.offsetTop - offset, behavior: 'smooth' });
      });
    });
  }

  // ===== Načtení produktů =====
  async function loadProducts() {
    try {
      if (Array.isArray(window.BEZVA_PRODUCTS)) {
        STATE.products = window.BEZVA_PRODUCTS;
        return;
      }
      const res = await fetch('products.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('products.json not found');
      const data = await res.json();
      // Pokud je soubor strukturován po kategoriích, vyflattenujeme
      if (Array.isArray(data)) {
        STATE.products = data;
      } else if (Array.isArray(data.categories)) {
        STATE.products = data.categories.flatMap((c) =>
          (c.products || []).map((p) => ({ ...p, category: c.id || c.name || p.category }))
        );
      } else {
        STATE.products = [];
      }
    } catch (e) {
      console.warn('Products fallback (light)', e);
      STATE.products = [
        {
          id: 1,
          name: 'BAGR SE SKLUZAVKOU',
          price: 8900,
          image: 'Image/Bagr.png',
          images: ['Image/Bagr.png'],
          description:
            'Skákací hrad se skluzavkou. Do dojezdové části lze nasypat plastové míčky.',
          dimensions: '8 × 3 × 4,5 m',
          capacity: '8–12 dětí',
          age: '3–12 let',
          category: 'skakaci-hrady',
          available: true,
        },
        {
          id: 8,
          name: 'PIRÁTSKÁ LOĎ SE SKLUZAVKOU',
          price: 10900,
          image: 'obrazky/piratska-lod.jpg',
          images: ['obrazky/piratska-lod.jpg'],
          description: 'Nafukovací skluzavka pro malé piráty.',
          dimensions: '7 × 4 m',
          capacity: '8–12 dětí',
          age: '3–12 let',
          category: 'skluzavky',
          available: true,
        },
        {
          id: 3,
          name: 'MONSTER TRUCK',
          price: 7900,
          image: 'Image/Moster-truck.png',
          images: ['Image/Moster-truck.png'],
          description: 'Skákací hrad v podobě Monster Trucku.',
          dimensions: '6 × 4 × 4,8 m',
          capacity: '6–10 dětí',
          age: '3–12 let',
          category: 'skakaci-hrady',
          available: true,
        },
      ];
    }
  }

  // ===== Katalog: filtry, render, interakce =====
  function initCatalog() {
    const grid = document.querySelector('[data-catalog-grid]');
    const loading = document.querySelector('[data-catalog-loading]');
    const nores = document.querySelector('[data-no-results]');
    const selCat = document.querySelector('[data-filter="category"]');
    const search = document.querySelector('[data-search]');
    const sortSel = document.querySelector('[data-sort]');

    if (!grid) return;

    // Naplnění kategorií
    if (selCat) {
      const cats = [...new Set(STATE.products.map((p) => p.category).filter(Boolean))];
      selCat.innerHTML =
        '<option value="">Všechny kategorie</option>' +
        cats.map((c) => `<option value="${escapeAttr(c)}">${escapeHtml(labelize(c))}</option>`).join('');
    }

    const render = () => {
      let items = STATE.products.slice();
      const q = (search?.value || '').toLowerCase().trim();
      const cat = selCat?.value || '';
      const sort = sortSel?.value || 'name';

      if (cat) items = items.filter((p) => (p.category || '').toLowerCase() === cat.toLowerCase());
      if (q) items = items.filter((p) => p.name?.toLowerCase().includes(q));

      // Řazení
      if (sort === 'price-low') items.sort((a, b) => (num(a.price) ?? 1e12) - (num(b.price) ?? 1e12));
      else if (sort === 'price-high') items.sort((a, b) => (num(b.price) ?? 0) - (num(a.price) ?? 0));
      else items.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'cs'));

      grid.innerHTML = items.map(cardHTML).join('');
      attachCardEvents();
      if (nores) nores.style.display = items.length ? 'none' : 'block';
      loading?.setAttribute('hidden', '');
    };

    // Události
    search?.addEventListener('input', debounce(render, 150));
    selCat?.addEventListener('change', render);
    sortSel?.addEventListener('change', render);

    // První render
    loading?.removeAttribute('hidden');
    render();
  }

  function cardHTML(p) {
    const meta = [p.dimensions, p.capacity, p.age].filter(Boolean).join(' • ');
    const price = p.price ? `${formatCZK(p.price)} / den` : escapeHtml(p.priceNote || 'Cena na dotaz');
    return `
      <article class="catalog-card" data-id="${escapeAttr(p.id)}">
        <div class="card-image">
          <img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}" loading="lazy" decoding="async" width="600" height="400">
        </div>
        <div class="card-content">
          <h3 class="card-title">${escapeHtml(p.name)}</h3>
          <div class="card-meta">${escapeHtml(meta)}</div>
          <div class="card-price">${price}</div>
          <div class="card-actions">
            <button class="view-details btn-secondary" data-quick>Rychlý náhled</button>
            <button class="btn btn-primary" data-add>Přidat do košíku</button>
          </div>
        </div>
      </article>
    `;
  }

  function attachCardEvents() {
    document.querySelectorAll('[data-quick]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = idFromCard(e.currentTarget);
        if (id == null) return;
        window.productModal?.open?.(id);
      });
    });

    document.querySelectorAll('[data-add]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = idFromCard(e.currentTarget);
        if (id == null) return;
        const item = STATE.products.find((p) => String(p.id) === String(id));
        if (!item) return;
        window.cartManager?.add?.({
          id: item.id,
          name: item.name,
          price: Number(item.price) || 0,
          qty: 1,
          image: item.image,
          meta: {},
        });
        window.toasts?.show?.({ title: 'Přidáno do košíku', message: item.name, type: 'success' });
      });
    });
  }

  function idFromCard(node) {
    const card = node.closest('[data-id]');
    if (!card) return null;
    const raw = card.getAttribute('data-id');
    const n = Number(raw);
    return Number.isFinite(n) ? n : raw;
  }

  // ===== Toastery (fallback, pokud není jiný) =====
  function initToasts() {
    if (window.toasts?.show) return; // už existuje (např. z jiného souboru)
    window.toasts = new ToastCenter('toastRegion');
  }

  class ToastCenter {
    constructor(id) {
      this.root = document.getElementById(id);
      if (!this.root) {
        this.root = document.createElement('div');
        this.root.id = id;
        this.root.className = 'toast-region';
        this.root.setAttribute('aria-live', 'polite');
        this.root.setAttribute('aria-atomic', 'true');
        document.body.appendChild(this.root);
      }
    }
    show({ title = 'Info', message = '', type = 'info', timeout = 3000 } = {}) {
      const el = document.createElement('div');
      el.className = `toast toast--${type}`;
      el.style.cssText =
        'min-width:280px;max-width:420px;background:#2e2e2e;color:#fff;border-left:4px solid ' +
        (type === 'success' ? '#4caf50' : type === 'error' ? '#ff4757' : '#9ccc65') +
        ';padding:12px 14px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.28);display:grid;grid-template-columns:auto 1fr auto;gap:10px;opacity:0;transform:translateY(8px) scale(.98)';
      el.innerHTML = `
        <div style="align-self:center">${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}</div>
        <div>
          <div style="font-weight:800">${escapeHtml(title)}</div>
          <div style="opacity:.9">${escapeHtml(message)}</div>
        </div>
        <button aria-label="Zavřít" style="background:transparent;border:0;color:#fff;font-size:18px;cursor:pointer;opacity:.8">×</button>`;
      el.querySelector('button')?.addEventListener('click', () => dismiss());
      this.root.appendChild(el);
      const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const dur = prefersReduced ? 1 : 220;
      el.animate(
        [{ opacity: 0, transform: 'translateY(8px) scale(.98)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }],
        { duration: dur, easing: 'cubic-bezier(.25,.46,.45,.94)', fill: 'forwards' }
      );
      let h = setTimeout(dismiss, timeout);
      el.addEventListener('pointerenter', () => clearTimeout(h));
      el.addEventListener('pointerleave', () => (h = setTimeout(dismiss, timeout / 2)));
      function dismiss() {
        el.animate(
          [{ opacity: 1, transform: 'translateY(0) scale(1)' }, { opacity: 0, transform: 'translateY(6px) scale(.98)' }],
          { duration: dur, easing: 'cubic-bezier(.25,.46,.45,.94)', fill: 'forwards' }
        ).onfinish = () => el.remove();
      }
    }
  }

  // ===== Quick view z PLP přes .view-details =====
  function wireGlobalQuickView() {
    // Už řešeno v attachCardEvents, ale pokud by se katalog přepsal dynamicky jinde:
    document.addEventListener('click', (e) => {
      const btn = e.target.closest?.('[data-quick]');
      if (!btn) return;
      const id = idFromCard(btn);
      if (id == null) return;
      window.productModal?.open?.(id);
    });
  }

  // ===== Pomocné funkce =====
  function debounce(fn, ms) {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  }

  function escapeHtml(s = '') {
    return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function escapeAttr(s = '') {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  function formatCZK(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return '—';
    return `${num.toLocaleString('cs-CZ')} Kč`;
  }

  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function labelize(slug = '') {
    return String(slug)
      .replace(/[-_]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .replace(/^\w/, (m) => m.toUpperCase());
  }
})();
