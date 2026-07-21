// app.js

const demoVehicles = [
  {
    id: 'v1',
    make: 'BMW',
    model: '330d Touring',
    year: 2013,
    plate: 'S-KF 330',
    nextInspectionDate: '2025-03-15',
    nextServiceDate: '2024-11-01',
    lastFuelingSummary: 'Zuletzt getankt vor 3 Tagen',
  },
  {
    id: 'v2',
    make: 'Mercedes',
    model: 'C 200',
    year: 2016,
    plate: 'S-MB 200',
    nextInspectionDate: '2024-09-30',
    nextServiceDate: '2024-08-20',
    lastFuelingSummary: 'Zuletzt getankt vor 10 Tagen',
  },
];

function renderVehicles() {
  const grid = document.getElementById('vehicle-grid');
  if (!grid) return;

  grid.innerHTML = '';

  demoVehicles.forEach((v) => {
    const card = document.createElement('article');
    card.className = 'vehicle-card';
    card.innerHTML = `
      <div class="vehicle-card-header">
        <div class="vehicle-thumb"></div>
        <div>
          <div class="vehicle-title">${v.make} ${v.model}</div>
          <div class="vehicle-subtitle">${v.year} • ${v.plate}</div>
        </div>
      </div>
      <div class="badge-row">
        <span class="badge">TÜV: ${v.nextInspectionDate}</span>
        <span class="badge">Service: ${v.nextServiceDate}</span>
        <span class="badge">${v.lastFuelingSummary}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', renderVehicles);
