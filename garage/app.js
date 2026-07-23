// app.js

const STORAGE_KEY_VEHICLES  = 'garageVehicles';
const STORAGE_KEY_LOGGED_IN = 'garageLoggedIn';
const STORAGE_KEY_THEME     = 'garageTheme';

const defaultVehicles = [
  {
    id: 'v1',
    make: 'BMW', model: '330d Touring', year: 2013,
    plate: 'S-KF 330', odometer: 210000, purchasePrice: 15000,
    nextInspectionDate: '2027-03-15',
    nextServiceDate:    '2026-11-01',
    todos: ['Bremsflüssigkeit wechseln', 'Software-Update Motorsteuerung'],
    history: [
      { type: 'maintenance', date: '2026-04-10', odo: 208000, description: 'Ölwechsel + Filter', cost: 180 },
      { type: 'upgrade',     date: '2025-12-05', odo: 205000, description: 'Winterreifen montiert', cost: 60 },
    ],
  },
  {
    id: 'v2',
    make: 'Mercedes', model: 'C 200', year: 2016,
    plate: 'S-MB 200', odometer: 145000, purchasePrice: 18500,
    nextInspectionDate: '2026-09-30',
    nextServiceDate:    '2026-08-20',
    todos: ['Lackpolitur komplett', 'Innenraumfilter tauschen'],
    history: [
      { type: 'maintenance', date: '2026-03-01', odo: 143500, description: 'Große Inspektion', cost: 650 },
    ],
  },
];

function loadVehicles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VEHICLES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (_) {}
  return JSON.parse(JSON.stringify(defaultVehicles));
}

function saveVehicles() {
  try { localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(vehicles)); } catch (_) {}
}

let vehicles = loadVehicles();
let selectedVehicleId = vehicles[0]?.id ?? null;

/* ===== THEME ===== */
function initTheme() {
  const stored     = localStorage.getItem(STORAGE_KEY_THEME);
  const preferDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  applyTheme(stored ?? (preferDark ? 'dark' : 'light'));

  const updateLabels = () => {
    const isDark = document.body.dataset.theme === 'dark';
    document.querySelectorAll('.theme-btn').forEach(b => b.textContent = isDark ? 'Hell' : 'Dunkel');
  };

  const toggle = () => {
    const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY_THEME, next);
    updateLabels();
  };

  document.querySelectorAll('.theme-btn').forEach(b => b.addEventListener('click', toggle));
  updateLabels();
}

function applyTheme(t) { document.body.dataset.theme = t; }

/* ===== TOR TOGGLE (Mobile Tap) ===== */
function initDoorToggle() {
  const wrap = document.getElementById('garage-wrap');
  if (!wrap) return;
  wrap.addEventListener('click', (e) => {
    // Klick innerhalb Login-Panel ignorieren
    if (e.target.closest('.login-panel')) return;
    wrap.classList.toggle('door-open');
  });
}

/* ===== AUTH ===== */
function initAuth() {
  const landing   = document.getElementById('landing');
  const appShell  = document.getElementById('app-shell');
  const loginForm = document.getElementById('login-form');
  const logoutBtn = document.getElementById('logout-button');
  const wrap      = document.getElementById('garage-wrap');
  const car       = document.getElementById('login-car');

  const showApp = () => {
    if (landing)  landing.style.display  = 'none';
    if (appShell) appShell.classList.remove('app-hidden');
  };

  const showLanding = () => {
    if (appShell) appShell.classList.add('app-hidden');
    if (landing)  landing.style.display  = 'flex';
    if (wrap) {
      wrap.classList.remove('door-open', 'car-driving');
    }
  };

  // Bereits eingeloggt?
  if (localStorage.getItem(STORAGE_KEY_LOGGED_IN) === 'true') {
    showApp();
    renderAll();
    return;
  }

  if (loginForm) {
    const errorEl = document.getElementById('login-error');
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const pw    = document.getElementById('login-password').value.trim();

      if (!email || !pw) {
        if (errorEl) { errorEl.textContent = 'Bitte E-Mail und Passwort eingeben.'; errorEl.style.display = 'block'; }
        return;
      }
      if (errorEl) errorEl.style.display = 'none';

      localStorage.setItem(STORAGE_KEY_LOGGED_IN, 'true');

      // Tor öffnen + Auto einfahren
      if (wrap) wrap.classList.add('door-open', 'car-driving');

      setTimeout(() => {
        showApp();
        renderAll();
      }, 1600);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY_LOGGED_IN);
      showLanding();
    });
  }
}

/* ===== RENDER ===== */
function renderAll() {
  renderVehicles();
  renderVehicleDetail();
  renderSelectedStats();
}

function renderVehicles() {
  const grid = document.getElementById('vehicle-grid');
  if (!grid) return;
  grid.innerHTML = '';
  vehicles.forEach(v => {
    const card = document.createElement('article');
    card.className = 'vehicle-card' + (v.id === selectedVehicleId ? ' vehicle-card-selected' : '');
    card.innerHTML = `
      <div class="vehicle-card-header">
        <div class="vehicle-thumb"></div>
        <div>
          <div class="vehicle-title">${v.make} ${v.model}</div>
          <div class="vehicle-subtitle">${v.year} • ${v.plate}</div>
        </div>
      </div>
      <div class="badge-row">
        <span class="badge">TÜV: ${v.nextInspectionDate || '—'}</span>
        <span class="badge">Service: ${v.nextServiceDate || '—'}</span>
        <span class="badge">${formatKm(v.odometer)}</span>
      </div>`;
    card.addEventListener('click', () => {
      selectedVehicleId = v.id;
      renderAll();
    });
    grid.appendChild(card);
  });
}

function renderVehicleDetail() {
  const el = document.getElementById('vehicle-detail');
  if (!el) return;
  const v = vehicles.find(x => x.id === selectedVehicleId);
  if (!v) { el.innerHTML = '<p>Wähle oben ein Fahrzeug aus.</p>'; return; }

  const totalCost = (v.history || []).reduce((s, e) => s + (e.cost || 0), 0);

  el.innerHTML = `
    <div class="detail-grid">
      <div>
        <div class="detail-card-title">Basisdaten</div>
        <ul class="detail-list">
          <li>${v.make} ${v.model} (${v.year})</li>
          <li>Kennzeichen: ${v.plate}</li>
          <li>Kilometerstand: ${formatKm(v.odometer)}</li>
          <li>Anschaffung: ${v.purchasePrice?.toLocaleString('de-DE') ?? '—'} €</li>
          <li>Kosten gesamt: ${totalCost.toLocaleString('de-DE')} €</li>
        </ul>
      </div>
      <div>
        <div class="detail-card-title">Wunschliste</div>
        <ul class="detail-list">${(v.todos || []).map(t => `<li>• ${t}</li>`).join('') || '<li>Leer</li>'}</ul>
      </div>
      <div>
        <div class="detail-card-title">Historie</div>
        <ul class="detail-list">
          ${(v.history || []).map(e =>
            `<li>${e.date} – [${labelType(e.type)}] ${e.description}${e.odo != null ? ' • ' + formatKm(e.odo) : ''}${e.cost != null ? ' • ' + e.cost.toLocaleString('de-DE') + ' €' : ''}</li>`
          ).join('') || '<li>Keine Einträge</li>'}
        </ul>
      </div>
    </div>`;
}

function renderSelectedStats() {
  const v = vehicles.find(x => x.id === selectedVehicleId);
  const totalCost = v ? (v.history || []).reduce((s, e) => s + (e.cost || 0), 0) : null;
  setText('stat-selected-price', v?.purchasePrice != null ? v.purchasePrice.toLocaleString('de-DE') + ' €' : '— €');
  setText('stat-selected-odo',   v ? formatKm(v.odometer) : '— km');
  setText('stat-selected-costs', totalCost != null ? totalCost.toLocaleString('de-DE') + ' €' : '— €');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function formatKm(v) {
  return v != null ? v.toLocaleString('de-DE') + ' km' : '— km';
}

function labelType(t) {
  return { maintenance: 'Wartung', repair: 'Reparatur', upgrade: 'Upgrade' }[t] || 'Eintrag';
}

/* ===== ENTRY FORM ===== */
function setupEntryForm() {
  const form = document.getElementById('entry-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = vehicles.find(x => x.id === selectedVehicleId);
    if (!v) return;
    const date = document.getElementById('entry-date').value;
    const desc = document.getElementById('entry-desc').value.trim();
    if (!date || !desc) return;
    const entry = {
      type:        document.getElementById('entry-type').value,
      date,
      odo:         +document.getElementById('entry-odo').value  || null,
      description: desc,
      cost:        +document.getElementById('entry-cost').value || null,
    };
    v.history = v.history || [];
    v.history.push(entry);
    if (entry.odo && entry.odo > (v.odometer || 0)) v.odometer = entry.odo;
    saveVehicles();
    form.reset();
    renderAll();
  });
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  // Theme-Buttons mit einheitlicher Klasse versehen
  document.getElementById('theme-toggle-landing')?.classList.add('theme-btn');
  document.getElementById('theme-toggle-app')?.classList.add('theme-btn');

  initTheme();
  initDoorToggle();
  initAuth();
  setupEntryForm();
});
