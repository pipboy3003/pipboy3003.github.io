// app.js

const vehicles = [
  {
    id: 'v1',
    make: 'BMW',
    model: '330d Touring',
    year: 2013,
    plate: 'S-KF 330',
    odometer: 210000,
    purchasePrice: 15000,
    nextInspectionDate: '2025-03-15',
    nextServiceDate: '2024-11-01',
    lastFuelingSummary: 'Zuletzt getankt vor 3 Tagen',
    todos: ['Bremsflüssigkeit wechseln', 'Software-Update Motorsteuerung'],
    history: [
      { type: 'maintenance', date: '2024-04-10', odo: 208000, description: 'Ölwechsel + Filter', cost: 180 },
      { type: 'upgrade', date: '2023-12-05', odo: 205000, description: 'Winterreifen montiert', cost: 60 },
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
    nextInspectionDate: '2024-09-30',
    nextServiceDate: '2024-08-20',
    lastFuelingSummary: 'Zuletzt getankt vor 10 Tagen',
    todos: ['Lackpolitur komplett', 'Innenraumfilter tauschen'],
    history: [
      { type: 'maintenance', date: '2024-03-01', odo: 143500, description: 'Große Inspektion', cost: 650 },
    ],
  },
];

let selectedVehicleId = vehicles[0]?.id ?? null;

/* ===== Theme-Toggle (Hell/Dunkel) ===== */
function initTheme() {
  const stored = localStorage.getItem('garageTheme');
  let theme = stored;

  if (!theme) {
    const prefersDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches; // nutzt prefers-color-scheme[web:54]
    theme = prefersDark ? 'dark' : 'light';
  }

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
    localStorage.setItem('garageTheme', next);
    updateLabels();
  };

  if (btnLanding) btnLanding.addEventListener('click', toggle);
  if (btnApp) btnApp.addEventListener('click', toggle);

  updateLabels();
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
}

/* ===== Auth & Screens ===== */
function initAuthAndScreens() {
  const landing = document.getElementById('landing');
  const appShell = document.getElementById('app-shell');
  const loginForm = document.getElementById('login-form');
  const logoutButton = document.getElementById('logout-button');

  const loggedIn = localStorage.getItem('garageLoggedIn') === 'true';

  if (loggedIn) {
    if (landing) landing.style.display = 'none';
    if (appShell) appShell.classList.remove('app-hidden');
  } else {
    if (landing) landing.style.display = 'flex';
    if (appShell) appShell.classList.add('app-hidden');
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value.trim();
      if (!email || !password) return;

      localStorage.setItem('garageLoggedIn', 'true');

      // Auto fährt in die Garage
      const container = document.getElementById('garage-container');
      if (container) {
        container.classList.add('garage-logged-in');
      }

      // kurz warten, dann Garage-Screen anzeigen
      setTimeout(() => {
        if (landing) landing.style.display = 'none';
        if (appShell) appShell.classList.remove('app-hidden');
      }, 1700);
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('garageLoggedIn');
      if (appShell) appShell.classList.add('app-hidden');
      if (landing) landing.style.display = 'flex';
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
    case 'maintenance':
      return 'Wartung';
    case 'repair':
      return 'Reparatur';
    case 'upgrade':
      return 'Upgrade';
    default:
      return 'Eintrag';
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

    form.reset();
    renderVehicleDetail();
    renderSelectedStats();
  });
}

/* ===== Stats nur für ausgewähltes Fahrzeug ===== */
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

  const priceText = vehicle.purchasePrice != null
    ? `${vehicle.purchasePrice.toLocaleString('de-DE')} €`
    : '— €';

  const odoText = formatKm(vehicle.odometer);

  const totalHistoryCost = vehicle.history?.length
    ? vehicle.history.reduce((sum, e) => sum + (e.cost || 0), 0)
    : 0;

  priceEl.textContent = priceText;
  odoEl.textContent = odoText;
  costsEl.textContent = `${totalHistoryCost.toLocaleString('de-DE')} €`;
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAuthAndScreens();
  setupEntryForm();
  renderVehicles();
  renderVehicleDetail();
  renderSelectedStats();
});
