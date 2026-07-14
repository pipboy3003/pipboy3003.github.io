// Lädt Kurse dynamisch aus Firestore und ersetzt die statischen Beispiel-Karten.
// Falls Firestore noch leer ist (z. B. beim ersten Setup), bleiben die vorhandenen
// statischen Karten aus dem HTML als Fallback sichtbar.

function formatDateDe(dateStr){
  if(!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE');
}

db.collection('courses').orderBy('start').get().then(snapshot => {
  if(snapshot.empty) return; // Fallback: statische Karten im HTML bleiben stehen

  const grid = document.getElementById('courseGrid');
  if(!grid) return;
  grid.innerHTML = '';

  snapshot.forEach(doc => {
    const c = doc.data();
    const card = document.createElement('div');
    card.className = 'card' + (c.highlight ? ' card-highlight' : '');
    card.innerHTML = `
      <span class="card-tag">${c.tag || ''}</span>
      <h3>${c.title || ''}</h3>
      <p>${c.description || ''}</p>
      <ul class="card-meta">
        <li><strong>Beginn:</strong> ${formatDateDe(c.start)}</li>
        <li><strong>Ende:</strong> ${formatDateDe(c.end)}</li>
        <li><strong>Zeiten:</strong> ${c.ue || ''}</li>
      </ul>
      <a href="tel:${(c.phone || '').replace(/\s|\//g,'')}" class="card-link">Beratung: ${c.phone || ''} →</a>
    `;
    grid.appendChild(card);
  });
}).catch(err => {
  console.warn('Kurse konnten nicht aus Firestore geladen werden, zeige statische Fallback-Daten:', err);
});

// Öffnungszeiten & Kontakt dynamisch aus den Settings laden, falls vorhanden
db.collection('settings').doc('general').get().then(doc => {
  if(!doc.exists) return;
  const s = doc.data();
  const table = document.querySelector('.hours-table');
  if(!table) return;

  if(s.address){
    const addrCell = table.querySelector('tr:nth-child(1) td:nth-child(2)');
    if(addrCell) addrCell.textContent = s.address;
  }
  if(s.phone1){
    const phoneCell = table.querySelector('tr:nth-child(2) td:nth-child(2)');
    if(phoneCell) phoneCell.innerHTML = `<a href="tel:${s.phone1.replace(/\s|\//g,'')}">${s.phone1}</a>` + (s.phone2 ? ` oder <a href="tel:${s.phone2.replace(/\s|\//g,'')}">${s.phone2}</a>` : '');
  }
  if(s.email){
    const emailCell = table.querySelector('tr:nth-child(3) td:nth-child(2)');
    if(emailCell) emailCell.innerHTML = `<a href="mailto:${s.email}">${s.email}</a>`;
  }
}).catch(err => console.warn('Einstellungen konnten nicht geladen werden:', err));
