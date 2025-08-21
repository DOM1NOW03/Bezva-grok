// ===== modal.js — Profesionální modal s WAAPI, a11y, galerií a kalkulačkou =====

(() => {
  // Guard proti dvojí inicializaci
  if (window.productModal) return;

  class ProductModal {
    constructor(rootId = 'attractionModal') {
      this.el = document.getElementById(rootId);
      if (!this.el) {
        console.error('[modal] Element #attractionModal nenalezen.');
        return;
      }
      // Selektory
      this.overlay = this.el.querySelector('.modal-overlay');
      this.container = this.el.querySelector('.modal-container');
      this.closeBtns = this.el.querySelectorAll('[data-modal-close], .modal-close');

      // Galerie
      this.mainImage = this.el.querySelector('#modalMainImage');
      this.thumbsWrap = this.el.querySelector('[data-thumbnail-gallery]');
      this.prevImgBtn = this.el.querySelector('[data-image-prev]');
      this.nextImgBtn = this.el.querySelector('[data-image-next]');

      // Info
      this.titleEl = this.el.querySelector('#modalTitle');
      this.descEl = this.el.querySelector('#modalDescription');
      this.priceEl = this.el.querySelector('[data-modal-price]');
      this.specsWrap = this.el.querySelector('[data-modal-specs]');
      this.includedWrap = this.el.querySelector('[data-modal-included]');
      this.safetyWrap = this.el.querySelector('[data-modal-safety]');
      this.reviewsWrap = this.el.querySelector('[data-modal-reviews-container]');
      this.starsEl = this.el.querySelector('[data-modal-stars]');
      this.reviewsCountEl = this.el.querySelector('[data-modal-reviews]');

      // Form & kalkulačka
      this.form = this.el.querySelector('[data-reservation-form]');
      this.dateInput = this.el.querySelector('#eventDate');
      this.timeSelect = this.el.querySelector('#eventTime');
      this.daysSelect = this.el.querySelector('#rentalDays');
      this.participantsInput = this.el.querySelector('#participants');
      this.servicesWrap = this.el.querySelector('[data-service-options]');
      this.calcBaseEl = this.el.querySelector('[data-calc-base]');
      this.calcTotalEl = this.el.querySelector('[data-calc-total]');
      this.addToCartBtn = this.el.querySelector('[data-add-to-cart]');

      // Taby
      this.tabsNav = this.el.querySelector('.tab-navigation');
      this.tabBtns = this.el.querySelectorAll('.tab-btn');
      this.tabPanels = this.el.querySelectorAll('.tab-panel');

      // Stav
      this.state = 'idle'; // idle | opening | open | closing
      this.currentProduct = null;
      this.currentIndex = 0;
      this.images = [];
      this.formData = {
        date: null,
        time: null,
        days: 1,
        participants: 1,
        services: [], // {id, name, price}
        basePrice: 0,
        total: 0,
      };
      this.lastFocused = null;

      this.init();
    }

    init() {
      this.bindUI();
      this.enhanceA11y();
      this.prepareDefaults();
      window.productModal = this; // Expozice globálně
      console.log('✅ modal.js připraven');
    }

    bindUI() {
      // Zavření
      this.closeBtns.forEach((b) => b.addEventListener('click', () => this.close()));
      this.overlay?.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });

      // Klávesnice
      document.addEventListener('keydown', (e) => {
        if (this.state !== 'open') return;
        if (e.key === 'Escape') this.close();
        if (e.key === 'Tab') this.trapFocus(e);
        if (e.key === 'ArrowLeft') this.prevImage();
        if (e.key === 'ArrowRight') this.nextImage();
      });

      // Galerie
      this.prevImgBtn?.addEventListener('click', () => this.prevImage());
      this.nextImgBtn?.addEventListener('click', () => this.nextImage());

      // Taby
      this.tabBtns.forEach((btn) =>
        btn.addEventListener('click', () => this.switchTab(btn.getAttribute('data-tab')))
      );

      // Form inputs
      this.dateInput?.addEventListener('change', () => this.updateFormFromInputs());
      this.timeSelect?.addEventListener('change', () => this.updateFormFromInputs());
      this.daysSelect?.addEventListener('change', () => this.updateFormFromInputs());
      this.participantsInput?.addEventListener('input', () => this.updateFormFromInputs());

      // Submit
      this.form?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addToCart();
      });
    }

    enhanceA11y() {
      this.el.setAttribute('role', 'dialog');
      this.el.setAttribute('aria-modal', 'true');
      if (!this.container.getAttribute('tabindex')) {
        this.container.setAttribute('tabindex', '-1');
      }
    }

    prepareDefaults() {
      if (this.dateInput) {
        const tomorrow = this.getTomorrowISO();
        this.dateInput.min = tomorrow;
        if (!this.dateInput.value) this.dateInput.value = tomorrow;
      }
    }

    open(productId) {
      const product = findProduct(productId);
      if (!product) {
        toast('Produkt nenalezen', 'error');
        return;
      }

      this.currentProduct = product;
      this.images = Array.isArray(product.images) && product.images.length ? product.images : [product.image];
      this.currentIndex = 0;

      // Naplnit UI
      this.populateBasics(product);
      this.populateGallery();
      this.populateSpecs(product);
      this.populateLists(product);
      this.prepareServices(product);
      this.updateFormFromInputs(); // včetně kalkulace
      this.switchTab('overview');

      // Otevření s animací
      if (this.state !== 'idle') return;
      this.state = 'opening';
      this.lastFocused = document.activeElement;
      document.body.style.overflow = 'hidden';
      this.el.style.visibility = 'visible';
      this.el.classList.add('active'); // pro overlay CSS

      // Overlay animace
      this.overlay?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: prefersReduced() ? 1 : 150,
        fill: 'forwards',
      });

      // Container animace (scale+translate)
      this.container
        ?.animate(
          [
            { transform: 'translateY(24px) scale(.96)', opacity: 0 },
            { transform: 'translateY(0) scale(1)', opacity: 1 },
          ],
          {
            duration: prefersReduced() ? 1 : 320,
            easing: 'cubic-bezier(.34,1.56,.64,1)',
            fill: 'forwards',
          }
        )
        .addEventListener('finish', () => {
          this.state = 'open';
          this.setInitialFocus();
        });
    }

    close() {
      if (this.state !== 'open') return;
      this.state = 'closing';

      const dur = prefersReduced() ? 1 : 220;

      // Container out
      this.container
        ?.animate(
          [
            { transform: 'translateY(0) scale(1)', opacity: 1 },
            { transform: 'translateY(16px) scale(.98)', opacity: 0 },
          ],
          { duration: dur, easing: 'cubic-bezier(.25,.46,.45,.94)', fill: 'forwards' }
        )
        .addEventListener('finish', () => {
          this.el.classList.remove('active');
          this.el.style.visibility = 'hidden';
          document.body.style.overflow = '';
          this.state = 'idle';
          this.lastFocused?.focus?.();
        });

      // Overlay out
      this.overlay?.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: Math.round(dur * 0.7),
        fill: 'forwards',
      });
    }

    // Focus handling
    setInitialFocus() {
      const focusable = this.getFocusable();
      (focusable[0] || this.container).focus();
    }

    trapFocus(e) {
      const focusable = this.getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    getFocusable() {
      return Array.from(
        this.el.querySelectorAll(
          'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
    }

    // Naplňování UI
    populateBasics(p) {
      if (this.titleEl) this.titleEl.textContent = p.name || 'Detail atrakce';
      if (this.descEl) this.descEl.textContent = p.description || '';
      if (this.priceEl) this.priceEl.textContent = isFiniteNumber(p.price) ? formatCZK(p.price) : 'na dotaz';

      // rating
      const rating = p.rating || null;
      const count = p.reviewCount || 0;
      if (this.starsEl) this.starsEl.textContent = rating ? '★★★★★'.slice(0, Math.round(rating)) : '★★★★★';
      if (this.reviewsCountEl) this.reviewsCountEl.textContent = `(${count} recenzí)`;
    }

    populateGallery() {
      if (this.mainImage) {
        this.mainImage.src = this.images[0] || '';
        this.mainImage.alt = this.currentProduct?.name || 'Atrakce';
      }
      if (this.thumbsWrap) {
        this.thumbsWrap.innerHTML = this.images
          .map(
            (src, i) => `
            <button class="thumbnail ${i === 0 ? 'active' : ''}" data-idx="${i}" aria-label="Náhled ${i + 1}">
              <img src="${src}" alt="${escapeHtml(this.currentProduct?.name || '')} náhled ${i + 1}">
            </button>
          `
          )
          .join('');
        this.thumbsWrap.querySelectorAll('.thumbnail').forEach((btn) =>
          btn.addEventListener('click', () => {
            const index = Number(btn.getAttribute('data-idx') || '0');
            this.goImage(index);
          })
        );
      }
    }

    goImage(i) {
      if (!this.images.length) return;
      const next = (i + this.images.length) % this.images.length;
      this.currentIndex = next;
      if (this.mainImage) this.mainImage.src = this.images[next];

      // active state na thumb
      this.thumbsWrap?.querySelectorAll('.thumbnail').forEach((b, bi) => {
        b.classList.toggle('active', bi === next);
      });
    }

    prevImage() {
      this.goImage(this.currentIndex - 1);
    }

    nextImage() {
      this.goImage(this.currentIndex + 1);
    }

    populateSpecs(p) {
      if (!this.specsWrap) return;
      // očekávané klíče z Products.js nebo fallback
      const rows = [
        { label: 'Rozměry', value: p.dimensions || p?.specifications?.dimensions },
        { label: 'Kapacita', value: p.capacity || p?.specifications?.capacity },
        { label: 'Věk', value: p.age || p?.specifications?.ageGroup },
        { label: 'Hmotnost', value: p.weight || p?.specifications?.weight },
        { label: 'Příkon', value: p?.specifications?.powerRequired },
        { label: 'Doba instalace', value: p?.specifications?.setupTime },
        { label: 'EN14960', value: p?.specifications?.standardEN14960 ? 'Ano' : null },
      ].filter((r) => r.value);

      this.specsWrap.innerHTML = rows
        .map(
          (r) => `
        <div class="spec-item">
          <span class="spec-label">${escapeHtml(r.label)}</span>
          <span class="spec-value">${escapeHtml(String(r.value))}</span>
        </div>
      `
        )
        .join('');
    }

    populateLists(p) {
      if (this.includedWrap) {
        const items = p.included || ['Kotvení a příslušenství', 'Instruktáž k obsluze', 'Základní úklid po akci'];
        this.includedWrap.innerHTML = items.map((t) => `<li>${escapeHtml(t)}</li>`).join('');
      }
      if (this.safetyWrap) {
        const safety =
          p.safety ||
          [
            'Dodržujte bezpečnostní odstup a kotvení.',
            'Dozor dospělých je povinný.',
            'Za silného větru a deště atrakci nepoužívat.',
            'Respektujte věkové a kapacitní limity.',
          ];
        this.safetyWrap.innerHTML = safety.map((t) => `<li>${escapeHtml(t)}</li>`).join('');
      }
      if (this.reviewsWrap) {
        const reviews = p.reviews || [];
        this.reviewsWrap.innerHTML = reviews.length
          ? reviews
              .map(
                (r) => `
            <article class="review-item">
              <header class="review-header">
                <strong>${escapeHtml(r.author || 'Anonym')}</strong>
                <span class="review-stars">${'★'.repeat(Math.max(1, Math.min(5, Math.round(r.rating || 5))))}</span>
              </header>
              <p>${escapeHtml(r.text || '')}</p>
            </article>
          `
              )
              .join('')
          : `<p>Žádné recenze zatím nejsou.</p>`;
      }
    }

    prepareServices(p) {
      if (!this.servicesWrap) return;
      // Konfigurovatelné doplňky; pokud nejsou v produktu, použij default
      const defaults = [
        { id: 'service-install', name: 'Instalace', price: 800 },
        { id: 'service-attendant', name: 'Obsluha', price: 1_500 },
        { id: 'service-insurance', name: 'Pojištění akce', price: 600 },
      ];
      const services = Array.isArray(p.services) && p.services.length ? p.services : defaults;

      this.servicesWrap.innerHTML = services
        .map(
          (s) => `
        <label class="service-option">
          <input type="checkbox" data-service-id="${escapeHtml(s.id)}" data-service-name="${escapeHtml(
            s.name
          )}" data-service-price="${Number(s.price) || 0}">
          <span class="checkmark"></span>
          <span>${escapeHtml(s.name)}</span>
          <span style="margin-left:auto; color:var(--dark-green, #7CB342)">${formatCZK(Number(s.price) || 0)}</span>
        </label>
      `
        )
        .join('');

      // Bind změn
      this.servicesWrap.querySelectorAll('input[type="checkbox"]').forEach((cb) =>
        cb.addEventListener('change', () => this.updateFormFromInputs())
      );
    }

    // Form & kalkulace
    updateFormFromInputs() {
      this.formData.date = this.dateInput?.value || null;
      this.formData.time = this.timeSelect?.value || null;
      this.formData.days = toInt(this.daysSelect?.value, 1);
      this.formData.participants = clamp(toInt(this.participantsInput?.value, 1), 1, 200);
      this.formData.basePrice = Number(this.currentProduct?.price || 0);

      // Services
      this.formData.services = [];
      this.servicesWrap
        ?.querySelectorAll('input[type="checkbox"]')
        .forEach((cb) => cb.checked && this.formData.services.push(readService(cb)));

      // Pricing logika
      const total = this.calcTotal(this.formData);
      this.formData.total = total;

      if (this.calcBaseEl)
        this.calcBaseEl.textContent = `${formatCZK(this.formData.basePrice)} Kč`;
      if (this.calcTotalEl) this.calcTotalEl.textContent = `${formatCZK(total)} Kč`;
    }

    calcTotal(fd) {
      // Základ: cena za den × počet dní
      let subtotal = (Number(fd.basePrice) || 0) * (Number(fd.days) || 1);

      // Víkendový příplatek (pokud datum padá na So/Ne): +10% na první den
      if (fd.date && isWeekend(fd.date)) {
        subtotal += Math.round((Number(fd.basePrice) || 0) * 0.1);
      }

      // Doplňky (fixní částka)
      const extras = fd.services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
      subtotal += extras;

      // Sleva za více dní (2 dny -5%, 3+ dny -10%)
      const d = Number(fd.days) || 1;
      if (d === 2) subtotal = Math.round(subtotal * 0.95);
      if (d >= 3) subtotal = Math.round(subtotal * 0.9);

      return Math.max(0, subtotal);
    }

    // Přidání do košíku
    addToCart() {
      const p = this.currentProduct;
      if (!p) return;

      // Validace minima
      if (!this.formData.date) {
        toast('Zvolte datum akce', 'error');
        this.dateInput?.focus();
        return;
      }

      const item = {
        id: p.id,
        name: p.name,
        image: p.image,
        price: Number(this.formData.total) || 0,
        meta: {
          basePrice: Number(p.price) || 0,
          date: this.formData.date,
          time: this.formData.time,
          days: this.formData.days,
          participants: this.formData.participants,
          services: this.formData.services,
        },
        qty: 1,
      };

      if (window.cartManager?.add) {
        window.cartManager.add(item);
      } else {
        // Fallback: lokální storage
        const key = 'bezvaparta_cart';
        const cart = JSON.parse(localStorage.getItem(key) || '[]');
        cart.push(item);
        localStorage.setItem(key, JSON.stringify(cart));
      }

      toast('Přidáno do košíku', 'success');
      this.close();
      // otevřít košík pokud je k dispozici
      window.cartManager?.open?.();
    }

    // Taby
    switchTab(name) {
      if (!name) return;
      this.tabBtns.forEach((btn) => {
        const active = btn.getAttribute('data-tab') === name;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', String(active));
      });
      this.tabPanels.forEach((panel) => {
        const active = panel.getAttribute('data-tab-panel') === name;
        panel.classList.toggle('active', active);
        // Jemný fade/slide
        if (active) {
          panel.style.opacity = 0;
          panel.style.transform = 'translateY(8px)';
          requestAnimationFrame(() => {
            panel.style.transition = prefersReduced() ? 'none' : 'opacity 200ms var(--ease-out, ease), transform 200ms var(--ease-out, ease)';
            panel.style.opacity = 1;
            panel.style.transform = 'translateY(0)';
          });
        }
      });
    }

    // Helpers
    getTomorrowISO() {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  // Globální utilitky
  function prefersReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function toInt(v, def = 0) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : def;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function escapeHtml(s = '') {
    return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function formatCZK(n) {
    return Number(n).toLocaleString('cs-CZ');
  }

  function isFiniteNumber(v) {
    return Number.isFinite(Number(v));
  }

  function isWeekend(isoDate) {
    // 0=Ne, 6=So
    const d = new Date(isoDate + 'T00:00:00');
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  function readService(cb) {
    return {
      id: cb.getAttribute('data-service-id') || '',
      name: cb.getAttribute('data-service-name') || '',
      price: Number(cb.getAttribute('data-service-price') || 0),
    };
  }

  function findProduct(id) {
    // Hledá v window.BEZVA_PRODUCTS nebo window.products (fallback)
    if (Array.isArray(window.BEZVA_PRODUCTS)) {
      const p = window.BEZVA_PRODUCTS.find((x) => String(x.id) === String(id));
      if (p) return p;
    }
    if (Array.isArray(window.products)) {
      return window.products.find((x) => String(x.id) === String(id));
    }
    // fallback: načíst z local products.json? Ne – držíme sync na klientu.
    return null;
  }

  function toast(message, type = 'info') {
    if (window.toasts?.show) {
      window.toasts.show({ title: type === 'success' ? 'Hotovo' : type === 'error' ? 'Chyba' : 'Info', message, type });
    } else {
      console.log(`[toast:${type}] ${message}`);
    }
  }

  // Auto-inicializace
  document.addEventListener('DOMContentLoaded', () => new ProductModal());
})();
