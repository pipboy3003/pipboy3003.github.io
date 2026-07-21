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

/* ===== Theme-Toggle (Hell/Dunkel, orange) ===== */
function initTheme() {
  const stored = localStorage.getItem('garageTheme');
  let theme = stored;

  if (!theme) {
    const prefersDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
  }

  applyTheme(theme);

  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  btn.textContent = theme === 'dark' ? 'Hell' : 'Dunkel';

  btn.addEventListener('click', () => {
    const current = document.body.dataset.theme || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('garageTheme', next);
    btn.textContent = next === 'dark' ? 'Hell' : 'Dunkel';
  });
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
}

/* ===== Screen-Handling: Intro -> Login -> Garage ===== */
function showScreen(name) {
  const intro = document.getElementById('intro-screen');
  const login = document.getElementById('login-screen');
  const garage = document.getElementById('garage-screen');

  if (!intro || !login || !garage) return;

  intro.classList.add('screen-hidden');
  login.classList.add('screen-hidden');
  garage.style.display = 'none';

  if (name === 'intro') {
    intro.classList.remove('screen-hidden');
  } else if (name === 'login') {
    login.classList.remove('screen-hidden');
  } else if (name === 'garage') {
    garage.style.display = 'block';
  }
}

function initScreens() {
  const loggedIn = localStorage.getItem('garageLoggedIn') === 'true';
  const introSkip = document.getElementById('intro-skip');
  const loginForm = document.getElementById('login-form');
  const logoutButton = document.getElementById('logout-button');

  showScreen('intro');

  const proceedFromIntro = () => {
    if (localStorage.getItem('garageLoggedIn') === 'true') {
      showScreen('garage');
    } else {
      showScreen('login');
    }
  };

  // Intro läuft kurz, dann weiter
  setTimeout(proceedFromIntro, 2500);

  if (introSkip) {
    introSkip.addEventListener('click', proceedFromIntro);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value.trim();
      if (!email || !password) return;

      // Platzhalter-Login: später durch Firebase ersetzen
      localStorage.setItem('garageLoggedIn', 'true');
      showScreen('garage');
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('garageLoggedIn');
      showScreen('login');
    });
  }

  if (loggedIn) {
    // bleibt beim gleichen Ablauf: Intro -> Garage
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

/* ===== Kennzahlen für ausgewähltes Fahrzeug ===== */
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
  initTheme();      // Hell/Dunkel + Button
  initScreens();    // Intro, Login, Garage
  setupEntryForm(); // Eintrags-Formular
  renderVehicles();
  renderVehicleDetail();
  renderSelectedStats();
});
