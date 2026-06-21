document.addEventListener('DOMContentLoaded', () => {

  // ── Fallback data (used if API is unreachable) ─────────────────────
  const FALLBACK_LOCATIONS = [
    'Banashankari', 'Basavanagudi', 'BTM', 'Electronic City', 'HSR',
    'Indiranagar', 'JP Nagar', 'Jayanagar', 'Koramangala', 'Marathahalli',
    'New Delhi', 'Connaught Place', 'South Delhi', 'West Delhi',
    'Andheri', 'Bandra', 'Dadar', 'Juhu', 'Lower Parel', 'Worli',
    'Banjara Hills', 'Gachibowli', 'Hitech City', 'Jubilee Hills', 'Secunderabad',
    'Anna Nagar', 'Adyar', 'Velachery', 'T Nagar',
    'Salt Lake', 'Park Street', 'New Town',
    'Karol Bagh', 'Rajouri Garden', 'Dwarka',
    'Gurgaon', 'Noida', 'Faridabad',
    'Powai', 'Thane', 'Navi Mumbai',
    'Majestic', 'Malleshwaram', 'Rajajinagar', 'Whitefield',
    'Kondapur', 'Madhapur', 'Ameerpet',
    'Mylapore', 'Nungambakkam', 'Kodambakkam',
    'Alipore', 'Behala', 'Dum Dum',
    'Rohini', 'Pitampura', 'Janakpuri'
  ];

  const FALLBACK_CUISINES = [
    'North Indian', 'South Indian', 'Chinese', 'Fast Food', 'Biryani',
    'Italian', 'Pizza', 'Continental', 'Street Food', 'Desserts',
    'Cafe', 'Bakery', 'Beverages', 'Seafood', 'Mughlai', 'Rolls',
    'Sandwich', 'Burgers', 'Salads', 'Wraps', 'BBQ', 'Healthy Food',
    'Thai', 'Japanese', 'Mexican', 'Mediterranean', 'Middle Eastern',
    'Kerala', 'Chettinad', 'Andhra', 'Rajasthani', 'Bengali', 'Goan'
  ];

  // ── Element refs ───────────────────────────────────────────────────
  const locationSelect     = document.getElementById('location-select');
  const cuisineSelect      = document.getElementById('cuisine-select');
  const form               = document.getElementById('preferences-form');
  const submitBtn          = document.getElementById('submit-btn');
  const btnText            = submitBtn.querySelector('.btn-text');
  const btnLoader          = submitBtn.querySelector('.btn-loader');
  const btnIcon            = submitBtn.querySelector('.btn-icon');

  const emptyState         = document.getElementById('empty-state');
  const resultsHeader      = document.getElementById('results-header');
  const resultsSub         = document.getElementById('results-sub');
  const resultsMeta        = document.getElementById('results-meta');
  const cardsGrid          = document.getElementById('cards-grid');

  const activeFiltersPanel = document.getElementById('active-filters-panel');
  const activeFiltersBody  = document.getElementById('active-filters-body');
  const resetBtn           = document.getElementById('reset-btn');


  const specialNotes       = document.getElementById('special-notes');
  const charCounter        = document.getElementById('char-counter');

  const toast              = document.getElementById('toast');
  const toastMsg           = document.getElementById('toast-msg');
  const themeToggle        = document.getElementById('theme-toggle');
  const themeThumb         = document.getElementById('theme-thumb');

  // ── Init ──────────────────────────────────────────────────────────
  initTheme();
  fetchMetadata();
  initCharCounter();
  initNavTabs();
  initResetBtn();
  initThemeToggle();

  // ── Theme ──────────────────────────────────────────────────────────
  function initTheme() {
    const saved = localStorage.getItem('tasteai-theme') || 'dark';
    applyTheme(saved);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeThumb.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('tasteai-theme', theme);
  }

  function initThemeToggle() {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // ── Fetch metadata (locations + cuisines) from API, fallback ───────
  async function fetchMetadata() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const [locRes, cuiRes] = await Promise.all([
        fetch('/api/locations', { signal: controller.signal }),
        fetch('/api/cuisines',  { signal: controller.signal })
      ]);
      clearTimeout(timeout);

      const locations = await locRes.json();
      const cuisines  = await cuiRes.json();

      // Use API data if it returned meaningful results, else use fallback
      const finalLocations = Array.isArray(locations) && locations.length > 0
        ? locations : FALLBACK_LOCATIONS;
      const finalCuisines = Array.isArray(cuisines) && cuisines.length > 0
        ? cuisines : FALLBACK_CUISINES;

      populateSelect(locationSelect, finalLocations, 'Select a city…', true);
      populateSelect(cuisineSelect,  finalCuisines,  'Any Cuisine',    false);

    } catch (err) {
      // Silently fall back to hardcoded data
      console.info('[TasteAI] Using offline data (server not reachable).');
      populateSelect(locationSelect, FALLBACK_LOCATIONS, 'Select a city…', true);
      populateSelect(cuisineSelect,  FALLBACK_CUISINES,  'Any Cuisine',    false);
    }
  }

  function populateSelect(el, items, defaultText, required) {
    el.innerHTML = '';
    const def = document.createElement('option');
    def.value = '';
    def.textContent = defaultText;
    if (required) { def.disabled = true; def.selected = true; }
    el.appendChild(def);
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      el.appendChild(opt);
    });
  }

  // ── Char counter ───────────────────────────────────────────────────
  function initCharCounter() {
    specialNotes.addEventListener('input', () => {
      const len = specialNotes.value.length;
      charCounter.textContent = `${len} / 200`;
      charCounter.style.color = len > 180 ? '#F97316' : '';
    });
  }

  // ── Nav tabs ───────────────────────────────────────────────────────
  function initNavTabs() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
      });
    });

    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('.sidebar-link').forEach(l => {
          l.classList.remove('active');
          l.removeAttribute('aria-current');
        });
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      });
    });
  }

  // ── Reset button ───────────────────────────────────────────────────
  function initResetBtn() {
    resetBtn.addEventListener('click', () => {
      form.reset();
      charCounter.textContent = '0 / 200';
      charCounter.style.color = '';
      activeFiltersPanel.classList.add('hidden');
      showEmptyState();
    });
  }

  // ── Form submit ────────────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const location  = locationSelect.value;
    if (!location) { showToast('Please select a location.'); return; }

    const cuisine   = cuisineSelect.value;
    const minRating = parseFloat(document.querySelector('input[name="minRating"]:checked')?.value || '0');
    const budget    = document.querySelector('input[name="budget"]:checked')?.value || '';
    const notes     = specialNotes.value.trim();

    setLoading(true);
    updateActiveFilters({ location, cuisine, budget, minRating, notes });

    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          cuisine,
          budget:       budget || undefined,
          minRating:    minRating > 0 ? minRating : undefined,
          specialNotes: notes
        })
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      renderResults(data, location);

    } catch (err) {
      console.error(err);
      showEmptyState();
      showToast('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  // ── Loading / Skeleton state ───────────────────────────────────────
  function setLoading(on) {
    submitBtn.disabled = on;
    btnText.textContent = on ? 'Searching…' : 'Find Restaurants →';
    btnIcon.classList.toggle('hidden', on);
    btnLoader.classList.toggle('hidden', !on);

    if (on) {
      emptyState.classList.add('hidden');
      resultsHeader.classList.add('hidden');
      cardsGrid.classList.remove('hidden');
      cardsGrid.innerHTML = Array(3).fill(null).map(() => `
        <div class="skeleton-card">
          <div class="skel-img"></div>
          <div class="skel-body">
            <div class="skel-box skel-title"></div>
            <div class="skel-box skel-meta"></div>
            <div class="skel-box skel-tags"></div>
            <div class="skel-box skel-text"></div>
            <div class="skel-box skel-badges"></div>
          </div>
        </div>
      `).join('');
    }
  }

  // ── Render results ─────────────────────────────────────────────────
  function renderResults(data, location) {
    cardsGrid.innerHTML = '';

    const recs = data.recommendations || [];

    if (recs.length === 0) {
      showEmptyState();
      showToast('No restaurants matched your filters. Try relaxing them.');
      return;
    }

    emptyState.classList.add('hidden');
    resultsHeader.classList.remove('hidden');
    cardsGrid.classList.remove('hidden');

    const note = data.aiOffline
      ? 'Showing top database matches (AI recommendations offline).'
      : data.relaxedFiltersUsed
        ? 'Some filters were relaxed to find the best nearby matches.'
        : 'Based on your refined taste profile and real-time availability.';

    resultsSub.textContent = note;
    resultsMeta.innerHTML  = `<span class="results-count-badge">${recs.length} picks</span>`;

    recs.forEach((rec, i) => {
      const card = buildCard(rec, data.aiOffline, i);
      cardsGrid.appendChild(card);
    });
  }

  function buildCard(rec, aiOffline, index) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.style.animationDelay = `${index * 90}ms`;
    card.setAttribute('role', 'article');

    const costSymbol   = costToSymbol(rec.cost);
    const ratingNum    = typeof rec.rating === 'number' ? rec.rating.toFixed(1) : rec.rating || '—';
    const cuisine      = rec.cuisine || 'Various';
    const explanation  = rec.explanation || 'A great pick based on your preferences.';
    const locationName = rec.location || '';

    const cuisineTags = cuisine.split(',').slice(0, 2).map(c =>
      `<span class="tag-pill">${c.trim()}</span>`
    ).join('');

    const locationTag = locationName
      ? `<span class="tag-pill location-pill">📍 ${locationName}</span>`
      : '';

    const aiLabel   = aiOffline ? '📊 TOP DB MATCH' : '🤖 WHY WE PICKED THIS';

    // Service badges: use rec data if available, else show both as defaults
    const hasOnlineOrder  = rec.has_online_delivery !== false;
    const hasTableBooking = rec.has_table_booking !== false;

    const badges = [
      hasOnlineOrder  ? '<span class="service-badge">🛵 Online Order</span>' : '',
      hasTableBooking ? '<span class="service-badge">🍽️ Table Booking</span>' : ''
    ].filter(Boolean).join('') || '<span class="service-badge">✅ Available</span>';

    card.innerHTML = `
      <div class="card-image-area">
        <div class="card-image-placeholder" role="img" aria-label="${rec.name} food image"></div>
        <div class="card-rating-overlay">⭐ ${ratingNum}</div>
        ${locationName ? `<div class="card-location-overlay">📍 ${locationName}</div>` : ''}
      </div>
      <div class="card-body">
        <div class="card-top-row">
          <h3 class="card-name">${escapeHtml(rec.name)}</h3>
          <span class="cost-badge">${costSymbol}</span>
        </div>
        <div class="card-tags">
          ${cuisineTags}
          ${locationTag}
          <span class="rating-inline">⭐ ${ratingNum}</span>
        </div>
        <div class="card-divider"></div>
        <div class="ai-section">
          <div class="ai-label">${aiLabel}</div>
          <blockquote class="ai-explanation">${escapeHtml(explanation)}</blockquote>
        </div>
        <div class="card-badges">
          ${badges}
        </div>
      </div>
    `;

    return card;
  }

  // ── Cost → symbol (matches backend thresholds: ≤500 low, 501-1500 medium, >1500 high) ──
  function costToSymbol(cost) {
    if (!cost) return '₹₹';
    const s = String(cost).toLowerCase();

    // Handle explicit category labels (fallback path)
    if (s === '₹' || s === 'low')    return '<₹500';
    if (s === '₹₹' || s === 'medium') return '₹501-1500';
    if (s === '₹₹₹' || s === 'high') return '>₹1500';

    // Extract numeric value from "₹NNN for two" format
    const num = parseInt(s.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      if (num <= 500)  return '<₹500';
      if (num <= 1500) return '₹501-1500';
      return '>₹1500';
    }
    return '₹501-1500';
  }

  // ── Active filters summary in sidebar ─────────────────────────────
  function updateActiveFilters({ location, cuisine, budget, minRating, notes }) {
    activeFiltersBody.innerHTML = '';

    const rows = [
      { label: 'Location', values: location ? [location] : [] },
      { label: 'Cuisine',  values: cuisine  ? [cuisine]  : ['Any'] },
      { label: 'Budget',   values: budget   ? [budgetLabel(budget)] : ['Any'] },
      { label: 'Rating',   values: minRating > 0 ? [`${minRating.toFixed(1)}+ ⭐`] : ['Any'] },
    ];

    rows.forEach(({ label, values }) => {
      const group = document.createElement('div');
      group.style.marginBottom = '0.65rem';
      group.innerHTML = `
        <span class="filter-chip-label">${label}</span>
        <div class="filter-chip-group">
          ${values.map(v => `<span class="filter-chip">${escapeHtml(v)}</span>`).join('')}
        </div>
      `;
      activeFiltersBody.appendChild(group);
    });

    activeFiltersPanel.classList.remove('hidden');
  }

  function budgetLabel(b) {
    const map = { low: '<₹500', medium: '₹501-1500', high: '>₹1500' };
    return map[b] || capitalize(b);
  }

  // ── Empty state ────────────────────────────────────────────────────
  function showEmptyState() {
    emptyState.classList.remove('hidden');
    resultsHeader.classList.add('hidden');
    cardsGrid.classList.add('hidden');
    cardsGrid.innerHTML = '';
    resultsMeta.innerHTML = '';
  }

  // ── Toast ──────────────────────────────────────────────────────────
  let toastTimer = null;
  function showToast(msg, type = 'error') {
    toastMsg.textContent = msg;
    toast.querySelector('.toast-icon').textContent = type === 'error' ? '❌' : 'ℹ️';
    toast.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 4500);
  }

  // ── Helpers ────────────────────────────────────────────────────────
  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});
