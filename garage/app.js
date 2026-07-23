// app.js

const STORAGE_KEY_VEHICLES = 'garageVehicles';
const STORAGE_KEY_LOGGED_IN = 'garageLoggedIn';
const STORAGE_KEY_THEME = 'garageTheme';

const defaultVehicles = [
  {
    id: 'v1',
    make: 'BMW',
    model: '330d Touring',
    year: 2013,
    plate: 'S-KF 330',
    odometer: 210000,
    purchasePrice: 15000,
    nextInspectionDate: '2027-03-15',
    nextServiceDate: '2026-11-01',
    lastFuelingSummary: 'Zuletzt getankt vor 3 Tagen',
    todos: ['Bremsflüssigkeit wechseln', 'Software-Update Motorsteuerung'],
    history: [
      { type: 'maintenance', date: '2026-04-10', odo: 208000, description: 'Ölwechsel + Filter', cost: 180 },
      { type: 'upgrade', date: '2025-12-05', odo: 205000, description: 'Winterreifen montiert', cost: 60 },
    ],
  },
  {
    id: 'v2',
    make: 'Mercedes',
    model: 'C 200',
    year: 2016,
    plate: 'S-MB 200',
    odometer: 145000,
    purchasePrice: 18500,
    nextInspectionDate: '2026-09-30',
    nextServiceDate: '2026-08-20',
    lastFuelingSummary: 'Zuletzt getankt vor 10 Tagen',
    todos: ['Lackpolitur komplett', 'Innenraumfilter tauschen'],
    history: [
      { type: 'maintenance', date: '2026-03-01', odo: 143500, description: 'Große Inspektion', cost: 650 },
    ],
  },
];

function loadVehicles() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_VEHICLES);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return JSON.parse(JSON.stringify(defaultVehicles));
}

function saveVehicles() {
  try {
    localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(vehicles));
  } catch (_) {}
}

let vehicles = loadVehicles();
let selectedVehicleId = vehicles[0]?.id ?? null;

/* ===== Theme-Toggle ===== */
function initTheme() {
  const stored = localStorage.getItem(STORAGE_KEY_THEME);
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const theme = stored ?? (prefersDark ? 'dark' : 'light');
  applyTheme(theme);

  const btnLanding = document.getElementById('theme-toggle-landing');
  const btnApp = document.getElementById('theme-toggle-app');

  const updateLabels = () => {
    const current = document.body.dataset.theme || 'light';
    const label = current === 'dark' ? 'Hell' : 'Dunkel';
    if (btnLanding) btnLanding.textContent = label;
    if (btnApp) btnApp.textContent = label;
  };

  const toggle = () => {
    const current = document.body.dataset.theme || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY_THEME, next);
    updateLabels();
  };

  if (btnLanding) btnLanding.addEventListener('click', toggle);
  if (btnApp) btnApp.addEventListener('click', toggle);

  // Label sofort korrekt setzen – kein Flackern
  updateLabels();
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
}

/* ===== Rolltor: Touch/Click-Toggle für Mobile ===== */
function initRolldoorToggle() {
  const garageContainer = document.getElementById('garage-container');
  if (!garageContainer) return;

  // Touch-Geräte: Tap öffnet/schließt Tor
  garageContainer.addEventListener('click', (e) => {
    // Nur wenn Klick direkt aufs Tor oder Container (nicht aufs Login-Formular)
    const loginCard = garageContainer.querySelector('.login-card');
    if (loginCard && loginCard.contains(e.target)) return;

    garageContainer.classList.toggle('rolldoor-open');
  });
}

/* ===== Auth & Screens ===== */
function initAuthAndScreens() {
  const landing = document.getElementById('landing');
  const appShell = document.getElementById('app-shell');
  const loginForm = document.getElementById('login-form');
  const logoutButton = document.getElementById('logout-button');
  const garageContainer = document.getElementById('garage-container');

  const loggedIn = localStorage.getItem(STORAGE_KEY_LOGGED_IN) === 'true';

  if (loggedIn) {
    if (landing) landing.style.display = 'none';
    if (appShell) appShell.classList.remove('app-hidden');
  } else {
    if (landing) landing.style.display = 'flex';
    if (appShell) appShell.classList.add('app-hidden');
  }

  if (loginForm) {
    const errorEl = document.getElementById('login-error');

    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value.trim();

      if (!email || !password) {
        if (errorEl) {
          errorEl.textContent = 'Bitte E-Mail und Passwort eingeben.';
          errorEl.style.display = 'block';
        }
        return;
      }

      if (errorEl) errorEl.style.display = 'none';

      localStorage.setItem(STORAGE_KEY_LOGGED_IN, 'true');

      if (garageContainer) {
        garageContainer.classList.add('garage-logged-in');
      }

      setTimeout(() => {
        if (landing) landing.style.display = 'none';
        if (appShell) appShell.classList.remove('app-hidden');
        renderVehicles();
        renderVehicleDetail();
        renderSelectedStats();
      }, 1700);
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY_LOGGED_IN);
      if (appShell) appShell.classList.add('app-hidden');
      if (landing) landing.style.display = 'flex';
      if (garageContainer) {
        garageContainer.classList.remove('garage-logged-in');
        garageContainer.classList.remove('rolldoor-open');
      }
    });
  }
}

/* ===== Garage-Rendering ===== */
function renderVehicles() {
  const grid = document.getElementById('vehicle-grid');
  if (!grid) return;

  grid.innerHTML = '';

  vehicles.forEach((v) => {
    const card = document.createElement('article');
    card.className = 'vehicle-card';
    if (v.id === selectedVehicleId) {
      card.classList.add('vehicle-card-selected');
    }

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
        <span class="badge">KM: ${formatKm(v.odometer)}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      selectedVehicleId = v.id;
      renderVehicles();
      renderVehicleDetail();
      renderSelectedStats();
    });

    grid.appendChild(card);
  });
}

function renderVehicleDetail() {
  const container = document.getElementById('vehicle-detail');
  if (!container) return;

  const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
  if (!vehicle) {
    container.innerHTML = '<p>Wähle oben ein Fahrzeug aus.</p>';
    return;
  }

  const priceText = vehicle.purchasePrice != null
    ? `${vehicle.purchasePrice.toLocaleString('de-DE')} €`
    : '—';

  const odoText = formatKm(vehicle.odometer);

  const totalHistoryCost = vehicle.history?.length
    ? vehicle.history.reduce((sum, e) => sum + (e.cost || 0), 0)
    : 0;

  container.innerHTML = `
    <div class="detail-grid">
      <div>
        <div class="detail-card-title">Basisdaten</div>
        <ul class="detail-list">
          <li>${vehicle.make} ${vehicle.model} (${vehicle.year})</li>
          <li>Kennzeichen: ${vehicle.plate}</li>
          <li>Kilometerstand: ${odoText}</li>
          <li>Anschaffungspreis: ${priceText}</li>
          <li>Summe Eintrags-Kosten: ${totalHistoryCost.toLocaleString('de-DE')} €</li>
        </ul>
      </div>
      <div>
        <div class="detail-card-title">Wünsche / Upgrades</div>
        <ul class="detail-list">
          ${
            vehicle.todos?.length
              ? vehicle.todos.map((t) => `<li>• ${t}</li>`).join('')
              : '<li>Keine offenen Punkte.</li>'
          }
        </ul>
      </div>
      <div>
        <div class="detail-card-title">Historie</div>
        <ul class="detail-list">
          ${
            vehicle.history?.length
              ? vehicle.history
                  .map(
                    (e) =>
                      `<li>${e.date}: [${labelForType(e.type)}] ${e.description}` +
                      `${e.odo != null ? ' • ' + formatKm(e.odo) : ''}` +
                      `${e.cost != null ? ' • ' + e.cost.toLocaleString('de-DE') + ' €' : ''}</li>`,
                  )
                  .join('')
              : '<li>Noch keine Einträge.</li>'
          }
        </ul>
      </div>
    </div>
  `;
}

function formatKm(value) {
  return value != null ? `${value.toLocaleString('de-DE')} km` : '— km';
}

function labelForType(type) {
  switch (type) {
    case 'maintenance': return 'Wartung';
    case 'repair': return 'Reparatur';
    case 'upgrade': return 'Upgrade';
    default: return 'Eintrag';
  }
}

/* ===== Eintrags-Formular ===== */
function setupEntryForm() {
  const form = document.getElementById('entry-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
    if (!vehicle) return;

    const type = document.getElementById('entry-type').value;
    const date = document.getElementById('entry-date').value;
    const odoRaw = document.getElementById('entry-odo').value;
    const desc = document.getElementById('entry-desc').value.trim();
    const costRaw = document.getElementById('entry-cost').value;

    if (!date || !desc) return;

    const entry = {
      type,
      date,
      odo: odoRaw ? Number(odoRaw) : null,
      description: desc,
      cost: costRaw ? Number(costRaw) : null,
    };

    vehicle.history = vehicle.history || [];
    vehicle.history.push(entry);

    if (entry.odo && (!vehicle.odometer || entry.odo > vehicle.odometer)) {
      vehicle.odometer = entry.odo;
    }

    // Persistenz: nach jedem neuen Eintrag speichern
    saveVehicles();

    form.reset();
    renderVehicleDetail();
    renderSelectedStats();
  });
}

/* ===== Stats ===== */
function renderSelectedStats() {
  const priceEl = document.getElementById('stat-selected-price');
  const odoEl = document.getElementById('stat-selected-odo');
  const costsEl = document.getElementById('stat-selected-costs');
  if (!priceEl || !odoEl || !costsEl) return;

  const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
  if (!vehicle) {
    priceEl.textContent = '— €';
    odoEl.textContent = '— km';
    costsEl.textContent = '— €';
    return;
  }

  priceEl.textContent = vehicle.purchasePrice != null
    ? `${vehicle.purchasePrice.toLocaleString('de-DE')} €`
    : '— €';

  odoEl.textContent = formatKm(vehicle.odometer);

  const totalHistoryCost = vehicle.history?.length
    ? vehicle.history.reduce((sum, e) => sum + (e.cost || 0), 0)
    : 0;

  costsEl.textContent = `${totalHistoryCost.toLocaleString('de-DE')} €`;
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initRolldoorToggle();
  initAuthAndScreens();
  setupEntryForm();

  // App-Inhalte nur rendern wenn eingeloggt
  if (localStorage.getItem(STORAGE_KEY_LOGGED_IN) === 'true') {
    renderVehicles();
    renderVehicleDetail();
    renderSelectedStats();
  }
});
