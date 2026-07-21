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
    todos: [
      'Bremsflüssigkeit wechseln',
      'Software-Update Motorsteuerung',
      'Felgen aufbereiten',
    ],
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
    todos: [
      'Lackpolitur komplett',
      'Innenraumfilter tauschen',
    ],
    history: [
      { type: 'maintenance', date: '2024-03-01', odo: 143500, description: 'Große Inspektion', cost: 650 },
    ],
  },
];

let selectedVehicleId = vehicles[0]?.id ?? null;

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
        <span class="badge">KM: ${v.odometer?.toLocaleString?.('de-DE') ?? '—'}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      selectedVehicleId = v.id;
      renderVehicles();
      renderVehicleDetail();
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

  const odoText = vehicle.odometer != null
    ? `${vehicle.odometer.toLocaleString('de-DE')} km`
    : '—';

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
          <li>Summe Historie-Kosten: ${totalHistoryCost.toLocaleString('de-DE')} €</li>
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
                      `${e.odo != null ? ' • ' + e.odo.toLocaleString('de-DE') + ' km' : ''}` +
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

function setupVehicleForm() {
  const form = document.getElementById('vehicle-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const make = document.getElementById('make').value.trim();
    const model = document.getElementById('model').value.trim();
    const plate = document.getElementById('plate').value.trim();
    const year = Number(document.getElementById('year').value);
    const odometerRaw = document.getElementById('odometer').value;
    const priceRaw = document.getElementById('price').value;
    const nextInspectionDate = document.getElementById('nextInspection').value;
    const nextServiceDate = document.getElementById('nextService').value;

    if (!make || !model || !plate || !year) {
      return;
    }

    const newVehicle = {
      id: `v-${Date.now()}`,
      make,
      model,
      year,
      plate,
      odometer: odometerRaw ? Number(odometerRaw) : null,
      purchasePrice: priceRaw ? Number(priceRaw) : null,
      nextInspectionDate,
      nextServiceDate,
      lastFuelingSummary: 'Tankbuch folgt',
      todos: [],
      history: [],
    };

    vehicles.push(newVehicle);
    selectedVehicleId = newVehicle.id;
    form.reset();
    renderVehicles();
    renderVehicleDetail();
    renderStats();
  });
}

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

    if (!date || !desc) {
      return;
    }

    const entry = {
      type,
      date,
      odo: odoRaw ? Number(odoRaw) : null,
      description: desc,
      cost: costRaw ? Number(costRaw) : null,
    };

    vehicle.history = vehicle.history || [];
    vehicle.history.push(entry);

    // ggf. Fahrzeug-Kilometerstand aktualisieren
    if (entry.odo && (!vehicle.odometer || entry.odo > vehicle.odometer)) {
      vehicle.odometer = entry.odo;
    }

    form.reset();
    renderVehicleDetail();
    renderStats();
  });
}

function renderStats() {
  const totalPriceEl = document.getElementById('stat-total-price');
  const avgOdoEl = document.getElementById('stat-average-odo');
  const countEl = document.getElementById('stat-vehicle-count');

  if (!totalPriceEl || !avgOdoEl || !countEl) return;

  const count = vehicles.length;
  countEl.textContent = count.toString();

  const prices = vehicles
    .map((v) => v.purchasePrice)
    .filter((p) => typeof p === 'number' && !Number.isNaN(p));
  const totalPrice =
    prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) : null;

  totalPriceEl.textContent =
    totalPrice != null ? `${totalPrice.toLocaleString('de-DE')} €` : '— €';

  const odos = vehicles
    .map((v) => v.odometer)
    .filter((o) => typeof o === 'number' && !Number.isNaN(o));
  const avgOdo =
    odos.length > 0 ? Math.round(odos.reduce((sum, o) => sum + o, 0) / odos.length) : null;

  avgOdoEl.textContent =
    avgOdo != null ? `${avgOdo.toLocaleString('de-DE')} km` : '— km';
}

document.addEventListener('DOMContentLoaded', () => {
  setupVehicleForm();
  setupEntryForm();
  renderVehicles();
  renderVehicleDetail();
  renderStats();
});
