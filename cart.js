// ===== cart.js — Off‑canvas košík: perzistentní, přístupný, s animacemi =====

(() => {
  if (window.cartManager) return;

  const STORAGE_KEY = 'bezvaparta_cart_v1';
  const PROMO_KEY = 'bezvaparta_promo_v1';

  class CartManager {
    constructor() {
      this.sidebar = document.querySelector('[data-cart-sidebar]') || this.mountSidebar();
      this.backdrop = this.sidebar.querySelector('[data-cart-close]');
      this.container = this.sidebar.querySelector('.cart-container');
      this.content = this.sidebar.querySelector('[data-cart-content]');
      this.totalEl = this.sidebar.querySelector('[data-cart-total]');
      this.countBadge = document.querySelector('[data-cart-count]');
      this.btnToggle = document.querySelector('[data-cart-toggle]');
      this.btnClear = this.sidebar.querySelector('[data-cart-clear]');
      this.btnCheckout = this.sidebar.querySelector('[data-cart-checkout]');
      this.btnClose = this.sidebar.querySelector('.cart-close');

      // Promo (volitelné; lze přidat do HTML)
      this.promoInput = this.sidebar.querySelector('[data-promo-input]');
      this.promoApply = this.sidebar.querySelector('[data-promo-apply]');

      // State
      this.items = this.load();
      this.promo = this.loadPromo();
      this.isOpen = false;
      this.lastFocused = null;

      // Bind
      this.bindGlobalButtons();
      this.render();
      this.updateBadge();

      // Expose
      window.cartManager = this;
    }

    // Sidebar mount (fallback, kdyby v HTML nebyl)
    mountSidebar() {
      const wrap = document.createElement('div');
      wrap.className = 'cart-sidebar';
      wrap.setAttribute('data-cart-sidebar', '');
      wrap.innerHTML = `
        <div class="cart-backdrop" data-cart-close></div>
        <div class="cart-container" role="dialog" aria-modal="true" aria-label="Košík" tabindex="-1">
          <header class="cart-header">
            <h2>Košík</h2>
            <button class="cart-close" data-cart-close aria-label="Zavřít košík">×</button>
          </header>
          <div class="cart-content" data-cart-content></div>
          <footer class="cart-footer">
            <div class="cart-total">
              <div class="total-row"><span>Mezisoučet</span><strong data-cart-subtotal>0 Kč</strong></div>
              <div class="total-row"><span>Sleva</span><strong data-cart-discount>0 Kč</strong></div>
              <div class="total-row total-row--grand"><span>Celkem</span><strong data-cart-total>0 Kč</strong></div>
            </div>
            <div class="cart-actions">
              <button class="btn btn-secondary" data-cart-clear>Vyprázdnit</button>
              <button class="btn btn-primary" data-cart-checkout>Pokračovat k objednávce</button>
            </div>
          </footer>
        </div>`;
      document.body.appendChild(wrap);
      return wrap;
    }

    bindGlobalButtons() {
      // Toggle button v navigaci
      this.btnToggle?.addEventListener('click', () => this.open());

      // Close actions
      [this.backdrop, this.btnClose].forEach(el => el?.addEventListener('click', () => this.close()));

      // Klávesnice
      document.addEventListener('keydown', (e) => {
        if (!this.isOpen) return;
        if (e.key === 'Escape') this.close();
        if (e.key === 'Tab') this.trapFocus(e);
      });

      // Clear
      this.btnClear?.addEventListener('click', () => {
        if (this.items.length === 0) return;
        if (confirm('Opravdu chcete vyprázdnit košík?')) {
          this.items = [];
          this.persist();
          this.render();
          this.updateBadge();
          toast('Košík byl vyprázdněn', 'info');
        }
      });

      // Checkout
      this.btnCheckout?.addEventListener('click', () => {
        if (!this.items.length) {
          toast('Košík je prázdný', 'error');
          return;
        }
        // Hook: tady přesměruj na /checkout nebo otevři checkout modal
        toast('Pokračujeme k objednávce…', 'success');
      });

      // Swipe to close pro touch zařízení
      this.attachSwipeClose();
    }

    attachSwipeClose() {
      let startX = null, deltaX = 0, active = false;
      const el = this.container;
      if (!el) return;

      el.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'touch') return;
        active = true;
        startX = e.clientX;
        el.setPointerCapture(e.pointerId);
      });
      el.addEventListener('pointermove', (e) => {
        if (!active) return;
        deltaX = e.clientX - startX;
        if (deltaX > 0) { // posun doprava
          el.style.transform = `translateX(${Math.min(deltaX, el.offsetWidth)}px)`;
        }
      });
      const end = (e) => {
        if (!active) return;
        active = false;
        el.releasePointerCapture?.(e.pointerId);
        const threshold = el.offsetWidth * 0.35;
        if (deltaX > threshold) {
          this.close();
        } else {
          el.style.transition = 'transform 200ms ease';
          el.style.transform = 'translateX(0)';
          setTimeout(() => (el.style.transition = ''), 220);
        }
        startX = null; deltaX = 0;
      };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('pointerleave', end);
    }

    // Public API
    open() {
      if (this.isOpen) return;
      this.lastFocused = document.activeElement;
      this.sidebar.classList.add('is-open');
      this.isOpen = true;
      document.body.style.overflow = 'hidden';
      // Focus do panelu
      this.container?.focus();
    }

    close() {
      if (!this.isOpen) return;
      this.sidebar.classList.remove('is-open');
      this.isOpen = false;
      document.body.style.overflow = '';
      this.lastFocused?.focus?.();
      // reset inline transform (ze swipe)
      this.container.style.transform = '';
    }

    add({ id, name, price = 0, qty = 1, image = '', meta = {} }) {
      if (!id) return;
      const key = String(id) + JSON.stringify(meta || {});
      const existing = this.items.find(i => i.key === key);
      if (existing) {
        existing.qty += qty;
      } else {
        this.items.push({
          key,
          id,
          name,
          price: Number(price) || 0,
          qty: Number(qty) || 1,
          image,
          meta
        });
      }
      this.persist();
      this.render();
      this.updateBadge();
      toast('Přidáno do košíku', 'success');
    }

    remove(key) {
      const idx = this.items.findIndex(i => i.key === key);
      if (idx >= 0) {
        this.items.splice(idx, 1);
        this.persist();
        this.render();
        this.updateBadge();
        toast('Položka odstraněna', 'info');
      }
    }

    updateQty(key, qty) {
      const it = this.items.find(i => i.key === key);
      if (!it) return;
      it.qty = Math.max(1, Math.min(99, Number(qty) || 1));
      this.persist();
      this.renderTotals(); // stačí přepočítat součty
      this.updateBadge();
    }

    clear() {
      this.items = [];
      this.persist();
      this.render();
      this.updateBadge();
    }

    // Storage
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }

    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      } catch {}
    }

    loadPromo() {
      try {
        const raw = localStorage.getItem(PROMO_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }

    persistPromo() {
      try {
        if (this.promo) localStorage.setItem(PROMO_KEY, JSON.stringify(this.promo));
        else localStorage.removeItem(PROMO_KEY);
      } catch {}
    }

    // Rendering
    render() {
      if (!this.content) return;
      if (!this.items.length) {
        this.content.innerHTML = this.emptyHTML();
        this.renderTotals();
        return;
      }
      this.content.innerHTML = this.items.map(i => this.itemHTML(i)).join('');
      this.bindItemControls();
      this.renderTotals();
    }

    renderTotals() {
      const subtotal = this.items.reduce((s, i) => s + i.price * i.qty, 0);

      // Promo logika (příklad: BEZVA10 = -10% z mezisoučtu, MAX2000)
      const discount = this.computeDiscount(subtotal);

      const total = Math.max(0, subtotal - discount);

      const subtotalEl = this.sidebar.querySelector('[data-cart-subtotal]');
      const discountEl = this.sidebar.querySelector('[data-cart-discount]');

      subtotalEl && (subtotalEl.textContent = formatCZK(subtotal));
      discountEl && (discountEl.textContent = `-${formatCZK(discount)}`);
      this.totalEl && (this.totalEl.textContent = formatCZK(total));
    }

    computeDiscount(subtotal) {
      if (!this.promo || !this.promo.code) return 0;
      const code = this.promo.code.toUpperCase().trim();
      let disc = 0;

      if (code === 'BEZVA10') {
        disc = Math.round(subtotal * 0.10);
        const cap = 2_000;
        disc = Math.min(disc, cap);
      } else if (code === 'FREESHIP') {
        // příklad: nulová doprava – pokud by byla položka doprava v meta, lze odečíst
        // zde jen demonstrativně sleva 300 Kč
        disc = 300;
      } else {
        disc = 0;
      }
      return Math.max(0, Math.min(disc, subtotal));
    }

    updateBadge() {
      const count = this.items.reduce((s, i) => s + i.qty, 0);
      if (this.countBadge) this.countBadge.textContent = String(count);
    }

    // HTML šablony
    emptyHTML() {
      return `
        <div class="cart-empty" role="status" aria-live="polite">
          <svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 4V2A1 1 0 0 0 5 2V4H1A1 1 0 0 0 1 6H2.08L4.15 17.25A3 3 0 0 0 7.12 20H16.88A3 3 0 0 0 19.85 17.25L21.92 6H23A1 1 0 0 0 23 4H19V2A1 1 0 0 0 17 2V4H7Z"/>
          </svg>
          <h3>Košík je prázdný</h3>
          <p>Přidejte si nějaké atrakce a začněte plánovat skvělou akci!</p>
        </div>
      `;
    }

    itemHTML(i) {
      const metaParts = [];
      if (i.meta?.date) metaParts.push(`Datum: ${escapeHtml(i.meta.date)}`);
      if (i.meta?.time) metaParts.push(`Čas: ${escapeHtml(i.meta.time)}`);
      if (i.meta?.days) metaParts.push(`Dní: ${escapeHtml(i.meta.days)}`);
      if (i.meta?.participants) metaParts.push(`Účastníků: ${escapeHtml(i.meta.participants)}`);
      if (Array.isArray(i.meta?.services) && i.meta.services.length) {
        metaParts.push(...i.meta.services.map(s => `• ${escapeHtml(s.name)} (${formatCZK(s.price)})`));
      }

      return `
        <article class="cart-item" data-key="${escapeAttr(i.key)}">
          <div class="cart-item__media">
            <img src="${escapeAttr(i.image || '')}" alt="${escapeAttr(i.name)}" loading="lazy" width="160" height="120">
          </div>
          <div class="cart-item__info">
            <div class="cart-item__title">${escapeHtml(i.name)}</div>
            <div class="cart-item__meta">${metaParts.join(' · ')}</div>
          </div>
          <div class="cart-item__price">
            <div class="cart-item__amount">${formatCZK(i.price * i.qty)}</div>
            <div class="qty">
              <button type="button" data-qty-dec aria-label="Snížit množství">−</button>
              <input type="number" value="${i.qty}" min="1" max="99" inputmode="numeric" aria-label="Množství">
              <button type="button" data-qty-inc aria-label="Zvýšit množství">+</button>
            </div>
            <button class="cart-item__remove" type="button" aria-label="Odstranit položku">×</button>
          </div>
          ${metaParts.length ? `<div class="cart-item__details">${metaParts.join('<br>')}</div>` : ''}
        </article>
      `;
    }

    bindItemControls() {
      this.content.querySelectorAll('.cart-item').forEach(node => {
        const key = node.getAttribute('data-key');

        // Remove
        node.querySelector('.cart-item__remove')?.addEventListener('click', () => this.remove(key));

        // Qty dec/inc
        node.querySelector('[data-qty-dec]')?.addEventListener('click', () => {
          const it = this.items.find(i => i.key === key);
          if (!it) return;
          this.updateQty(key, Math.max(1, it.qty - 1));
          node.querySelector('input[type="number"]').value = String(this.items.find(i => i.key === key).qty);
          node.querySelector('.cart-item__amount').textContent = formatCZK(this.items.find(i => i.key === key).price * this.items.find(i => i.key === key).qty);
        });
        node.querySelector('[data-qty-inc]')?.addEventListener('click', () => {
          const it = this.items.find(i => i.key === key);
          if (!it) return;
          this.updateQty(key, Math.min(99, it.qty + 1));
          node.querySelector('input[type="number"]').value = String(this.items.find(i => i.key === key).qty);
          node.querySelector('.cart-item__amount').textContent = formatCZK(this.items.find(i => i.key === key).price * this.items.find(i => i.key === key).qty);
        });

        // Direct input
        const qtyInput = node.querySelector('input[type="number"]');
        qtyInput?.addEventListener('input', () => {
          const v = clamp(parseInt(qtyInput.value || '1', 10) || 1, 1, 99);
          qtyInput.value = String(v);
          this.updateQty(key, v);
          node.querySelector('.cart-item__amount').textContent = formatCZK(this.items.find(i => i.key === key).price * this.items.find(i => i.key === key).qty);
        });
      });

      // Promo events (pokud je ve footeru pole)
      if (this.promoApply && this.promoInput) {
        this.promoApply.onclick = () => {
          const code = (this.promoInput.value || '').trim().toUpperCase();
          if (!code) {
            this.promo = null;
            this.persistPromo();
            this.renderTotals();
            toast('Promo kód odstraněn', 'info');
            return;
          }
          // Validace známých kódů (příklad)
          if (!['BEZVA10', 'FREESHIP'].includes(code)) {
            toast('Neplatný promo kód', 'error');
            return;
          }
          this.promo = { code };
          this.persistPromo();
          this.renderTotals();
          toast(`Promo kód ${code} aplikován`, 'success');
        };
      }
    }

    // Focus management v dialogu
    trapFocus(e) {
      const focusable = Array.from(this.container.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
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
  }

  // Utils
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function formatCZK(n) { return `${Number(n).toLocaleString('cs-CZ')} Kč`; }
  function escapeHtml(s = '') { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function escapeAttr(s = '') { return escapeHtml(s).replace(/"/g, '&quot;'); }
  function toast(message, type = 'info') {
    if (window.toasts?.show) window.toasts.show({ title: type === 'error' ? 'Chyba' : type === 'success' ? 'Hotovo' : 'Info', message, type });
    else console.log(`[${type}] ${message}`);
  }

  // Auto-init
  document.addEventListener('DOMContentLoaded', () => new CartManager());
})();
