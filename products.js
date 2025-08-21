// ===== Products.js — Datový model, exporty, helpery a ProductManager =====
(() => {
  if (window.__BEZVA_PRODUCTS_READY__) return;

  // 1) Kategorie a produkty (zdrojová pravda)
  const CATEGORIES = [
    {
      id: 'skakaci-hrady',
      name: 'Skákací hrady',
      description: 'Nafukovací skákací hrady pro děti všech věkových kategorií',
      products: [
        {
          id: 1,
          name: 'BAGR SE SKLUZAVKOU',
          price: 8900,
          image: 'Image/Bagr.png',
          images: ['Image/Bagr.png'],
          description: 'Skákací hrad se skluzavkou. Do dojezdové části skluzavky je možné umístit plastové míčky.',
          dimensions: '8 × 3 × 4,5 m',
          capacity: '8–12 dětí',
          age: '3–12 let',
          weight: '120 kg',
          category: 'skakaci-hrady',
          available: true,
          rating: 4.8,
          reviewCount: 27,
          specifications: {
            dimensions: '8 × 3 × 4,5 m',
            capacity: '8–12 dětí',
            ageGroup: '3–12 let',
            weight: '120 kg',
            powerRequired: '220V / 16A',
            setupTime: '20–30 min',
            standardEN14960: true,
            weatherResistant: true
          },
          services: [
            { id: 'install', name: 'Instalace', price: 800 },
            { id: 'attendant', name: 'Obsluha', price: 1500 },
            { id: 'insurance', name: 'Pojištění akce', price: 600 }
          ],
          included: ['Kotvení, plachta, ventilátor', 'Instruktáž k obsluze'],
          safety: ['Dozor dospělých je povinný', 'Za silného větru nepoužívat', 'Respektujte kapacitní limity']
        },
        {
          id: 2,
          name: 'VODNÍ SVĚT SE SKLUZAVKOU',
          price: 8900,
          image: 'Image/Vodni-svet.png',
          images: ['Image/vodni-svet.jpg', 'Image/Vodni-svet.png'],
          description: 'Skákací hrad se skluzavkou vedle vstupu. Možnost plastových míčků v dojezdu.',
          dimensions: '7,6 × 4 × 4,5 m',
          capacity: '8–12 dětí',
          age: '3–12 let',
          weight: '110 kg',
          category: 'skakaci-hrady',
          available: true,
          rating: 4.7,
          reviewCount: 12,
          specifications: {
            dimensions: '7,6 × 4 × 4,5 m',
            capacity: '8–12 dětí',
            ageGroup: '3–12 let',
            weight: '110 kg',
            powerRequired: '220V / 16A',
            setupTime: '20–30 min',
            standardEN14960: true,
            weatherResistant: true
          }
        },
        {
          id: 3,
          name: 'MONSTER TRUCK',
          price: 7900,
          image: 'Image/Moster-truck.png',
          images: ['Image/Moster-truck.png'],
          description: 'Nafukovací skákací hrad v podobě Monster Trucku.',
          dimensions: '6 × 4 × 4,8 m',
          capacity: '6–10 dětí',
          age: '3–12 let',
          weight: '95 kg',
          category: 'skakaci-hrady',
          available: true,
          rating: 4.6,
          reviewCount: 18,
          specifications: {
            dimensions: '6 × 4 × 4,8 m',
            capacity: '6–10 dětí',
            ageGroup: '3–12 let',
            weight: '95 kg',
            powerRequired: '220V / 16A',
            setupTime: '15–25 min',
            standardEN14960: true,
            weatherResistant: true
          }
        },
        {
          id: 4,
          name: 'NAFUKOVACÍ HRAD PRINCEZNA ELSA',
          price: 6900,
          image: 'obrazky/princezna-elsa.jpg',
          images: ['obrazky/princezna-elsa.jpg'],
          description: 'Skákací hrad pro nejmenší princezny.',
          dimensions: '4 × 4 m',
          capacity: '4–8 dětí',
          age: '2–8 let',
          weight: '60 kg',
          category: 'skakaci-hrady',
          available: true
        },
        {
          id: 5,
          name: 'PAVOUČÍ MUŽ',
          price: 7900,
          image: 'obrazky/pavouci-muz.jpg',
          images: ['obrazky/pavouci-muz.jpg'],
          description: 'Skákací hrad pro malé superhrdiny.',
          dimensions: '5 × 4 m',
          capacity: '6–10 dětí',
          age: '3–12 let',
          weight: '80 kg',
          category: 'skakaci-hrady',
          available: true
        },
        {
          id: 6,
          name: 'BÍLÝ HRAD',
          price: 7900,
          image: 'obrazky/bily-hrad.jpg',
          images: ['obrazky/bily-hrad.jpg'],
          description: 'Bílý skákací hrad vhodný na svatbu i jiné akce.',
          dimensions: '5 × 5 m',
          capacity: '6–10 dětí',
          age: '3–12 let',
          weight: '85 kg',
          category: 'skakaci-hrady',
          available: true
        }
      ]
    },
    {
      id: 'skluzavky',
      name: 'Obří skluzavky',
      description: 'Velké nafukovací skluzavky pro maximální zábavu',
      products: [
        {
          id: 7,
          name: 'SKLUZAVKA KLAUN',
          price: 13900,
          image: 'obrazky/skluzavka-klaun.jpg',
          images: ['obrazky/skluzavka-klaun.jpg'],
          description: 'Dvě obří skluzavky v podobě klauna.',
          dimensions: '9 × 7 × 7 m',
          capacity: '15–20 dětí',
          age: '4–15 let',
          weight: '200 kg',
          category: 'skluzavky',
          available: true,
          rating: 4.9,
          reviewCount: 9
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
          weight: '120 kg',
          category: 'skluzavky',
          available: true,
          rating: 4.7,
          reviewCount: 13
        },
        {
          id: 9,
          name: 'OBŘÍ KLOUZAČKA',
          price: null,
          priceNote: 'INDIVIDUÁLNÍ CENA',
          image: 'obrazky/obri-klouzacka.jpg',
          images: ['obrazky/obri-klouzacka.jpg'],
          description: 'Barevná klouzačka s 6 dráhami. Dopadiště lze naplnit vodou.',
          dimensions: '20 × 11 m',
          capacity: '20+ dětí',
          age: '5+ let',
          weight: '300 kg',
          category: 'skluzavky',
          available: true
        }
      ]
    },
    {
      id: 'aktivni-centrum',
      name: 'Aktivní centrum',
      description: 'Interaktivní atrakce a sportovní aktivity',
      products: [
        {
          id: 10,
          name: 'SAFARI PARK',
          price: 11900,
          image: 'obrazky/safari-park.jpg',
          images: ['obrazky/safari-park.jpg'],
          description: 'Nafukovací dráha plná překážek napříč safari.',
          dimensions: '11 × 3,3 × 4,5 m',
          capacity: '10–15 dětí',
          age: '4–15 let',
          weight: '180 kg',
          category: 'aktivni-centrum',
          available: true
        },
        {
          id: 11,
          name: 'AKTIVNÍ CENTRUM',
          price: 6900,
          image: 'obrazky/aktivni-centrum.jpg',
          images: ['obrazky/aktivni-centrum.jpg'],
          description: 'Baseball, Basketball či Rugby? Zjisti, jak dobrou máš mušku.',
          dimensions: 'Různé',
          capacity: '6–12 dětí',
          age: '5+ let',
          weight: '50 kg',
          category: 'aktivni-centrum',
          available: true
        },
        {
          id: 12,
          name: 'AKTIVNÍ CENTRUM LEDOVÉ KRÁLOVSTVÍ',
          price: 7900,
          image: 'obrazky/ledove-kralovstvi.jpg',
          images: ['obrazky/ledove-kralovstvi.jpg'],
          description: 'Zábava pro malé princezny v nafukovacím ledovém království.',
          dimensions: '5 × 5 m',
          capacity: '6–10 dětí',
          age: '3–10 let',
          weight: '85 kg',
          category: 'aktivni-centrum',
          available: true
        }
      ]
    },
    {
      id: 'sportovni-aktivity',
      name: 'Sportovní aktivity',
      description: 'Soutěžní a sportovní nafukovací atrakce',
      products: [
        {
          id: 13,
          name: 'GLADIÁTOR ARÉNA',
          price: 6900,
          image: 'obrazky/gladiator-arena.jpg',
          images: ['obrazky/gladiator-arena.jpg'],
          description: 'Utkej se v zápasu se svým protivníkem.',
          dimensions: '4 × 5 m',
          capacity: '2 účastníci',
          age: '8+ let',
          weight: '70 kg',
          category: 'sportovni-aktivity',
          available: true
        },
        {
          id: 14,
          name: 'HOD SEKEROU',
          price: 6900,
          image: 'obrazky/hod-sekerou.jpg',
          images: ['obrazky/hod-sekerou.jpg'],
          description: 'Který ze dvou hráčů se přiblíží svou trefou nejblíže středu?',
          dimensions: '4,8 × 3 × 3,1 m',
          capacity: '2–4 hráči',
          age: '10+ let',
          weight: '60 kg',
          category: 'sportovni-aktivity',
          available: true
        },
        {
          id: 15,
          name: 'BUNGEE RUNNING',
          price: 8900,
          image: 'obrazky/bungee-running.jpg',
          images: ['obrazky/bungee-running.jpg'],
          description: 'Souboj v co nejvzdálenějším běhu proti odporu lana.',
          dimensions: '7 × 2,5 m',
          capacity: '2 hráči',
          age: '12+ let',
          weight: '45 kg',
          category: 'sportovni-aktivity',
          available: true
        },
        {
          id: 16,
          name: 'NAFUKOVACÍ BILLIARD',
          price: 7900,
          image: 'obrazky/nafukovaci-billiard.jpg',
          images: ['obrazky/nafukovaci-billiard.jpg'],
          description: 'Obří billiard – místo tága použij nohy.',
          dimensions: '7,8 × 4,8 × 0,45 m',
          capacity: '4–8 hráčů',
          age: '8+ let',
          weight: '55 kg',
          category: 'sportovni-aktivity',
          available: true
        },
        {
          id: 17,
          name: 'NAFUKOVACÍ ELEKTRICKÝ BÝK',
          price: 13900,
          image: 'obrazky/elektricky-byk.jpg',
          images: ['obrazky/elektricky-byk.jpg'],
          description: 'Bezva rodeo na divokém býkovi. Udrž se co nejdéle.',
          dimensions: '5 × 5 m',
          capacity: '1 jezdec',
          age: '14+ let',
          weight: '80 kg',
          category: 'sportovni-aktivity',
          available: true
        }
      ]
    },
    {
      id: 'party-vybaveni',
      name: 'Párty vybavení',
      description: 'Stany, stoly, židle a vybavení pro dokonalou akci',
      products: [
        {
          id: 18,
          name: 'PIVNÍ SET',
          price: 300,
          priceNote: 'cena za set',
          image: 'obrazky/pivni-set.jpg',
          images: ['obrazky/pivni-set.jpg'],
          description: 'Dřevěný stůl a 2 lavice. Vhodné pro akce i zahradní párty.',
          dimensions: '220 × 80 cm',
          capacity: '6–8 osob',
          age: 'Všechny věky',
          weight: '25 kg',
          category: 'party-vybaveni',
          available: true
        },
        {
          id: 19,
          name: 'NŮŽKOVÝ STAN 3×3 m',
          price: 1000,
          priceNote: 'cena za ks',
          image: 'obrazky/stan-3x3.jpg',
          images: ['obrazky/stan-3x3.jpg'],
          description: 'Bílý nůžkový stan pro venkovní i vnitřní použití, možnost bočnic.',
          dimensions: '3 × 3 m',
          capacity: '—',
          age: '—',
          weight: '—',
          category: 'party-vybaveni',
          available: true
        }
      ]
    }
  ];

  // 2) Plochý seznam pro rychlý render/filtry
  const FLAT_PRODUCTS = CATEGORIES.flatMap(c =>
    (c.products || []).map(p => ({ ...p, category: p.category || c.id }))
  );

  // 3) Helpery pro UI a data
  const ProductUtils = {
    formatPrice(n) {
      if (n == null) return '—';
      const num = Number(n);
      return Number.isFinite(num) ? `${num.toLocaleString('cs-CZ')} Kč` : '—';
    },
    generateStars(rating = 5) {
      const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
      return '★★★★★'.slice(0, r);
    },
    slugify(name = '') {
      return String(name).toLowerCase().trim()
        .replace(/[áäâà]/g, 'a').replace(/[éěëèê]/g, 'e').replace(/[íïîì]/g, 'i')
        .replace(/[óöôò]/g, 'o').replace(/[úůüûů]/g, 'u').replace(/[ý]/g, 'y')
        .replace(/[č]/g, 'c').replace(/[ř]/g, 'r').replace(/[š]/g, 's')
        .replace(/[ť]/g, 't').replace(/[ž]/g, 'z')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    },
    safeText(s = '') {
      return String(s).replace(/[&<>"']/g, m => (
        { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]
      ));
    }
  };

  // 4) Správce produktů
  class ProductManager {
    constructor(products, categories) {
      this.products = products;
      this.categories = categories;
      this.index = new Map(products.map(p => [String(p.id), p]));
    }
    getAll() { return this.products.slice(); }
    getCategories() { return this.categories.slice(); }
    getProductById(id) { return this.index.get(String(id)) || null; }
    search(q = '') {
      const s = String(q).toLowerCase().trim();
      if (!s) return this.getAll();
      return this.products.filter(p => p.name?.toLowerCase().includes(s));
    }
    filterByCategory(catId = '') {
      if (!catId) return this.getAll();
      const id = String(catId).toLowerCase();
      return this.products.filter(p => (p.category || '').toLowerCase() === id);
    }
    sort(items, by = 'name') {
      const arr = items.slice();
      if (by === 'price-low') return arr.sort((a, b) => (num(a.price) ?? 1e12) - (num(b.price) ?? 1e12));
      if (by === 'price-high') return arr.sort((a, b) => (num(b.price) ?? 0) - (num(a.price) ?? 0));
      return arr.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'cs'));
    }
  }

  function num(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }

  // 5) Export do window
  window.BEZVA_CATEGORIES = CATEGORIES;
  window.BEZVA_PRODUCTS = FLAT_PRODUCTS;
  window.ProductUtils = ProductUtils;
  window.productManager = new ProductManager(FLAT_PRODUCTS, CATEGORIES);

  window.__BEZVA_PRODUCTS_READY__ = true;
  console.log(`📦 Products.js: ${FLAT_PRODUCTS.length} produktů ve ${CATEGORIES.length} kategoriích připraveno.`);
})();
