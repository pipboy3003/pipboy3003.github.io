// Lädt Kurse und Einstellungen aus lokalen JSON-Dateien (data/courses.json, data/settings.json)
// statt aus einer Datenbank. Perfekt für eine Website ohne eigenes Backend:
// der Admin-Bereich exportiert diese JSON-Dateien, du lädst sie einfach ins data/-Verzeichnis.

function formatDateDe(dateStr){
  if(!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE');
}

fetch('data/courses.json')
  .then(res => {
    if(!res.ok) throw new Error('Keine courses.json gefunden');
    return res.json();
  })
  .then(courses => {
    if(!courses || courses.length === 0) return;
    const grid = document.getElementById('courseGrid');
    if(!grid) return;
    grid.innerHTML = '';

    courses.sort((a,b) => (a.start || '').localeCompare(b.start || ''));
    courses.forEach(c => {
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
        <a href="tel:+49${(c.phone || '').replace(/\D/g,'').replace(/^49/,'')}" class="card-link">Beratung: ${c.phone || ''} →</a>
      `;
      grid.appendChild(card);
    });
  })
  .catch(err => {
    console.warn('Kurse konnten nicht aus data/courses.json geladen werden, zeige statische Fallback-Daten:', err);
  });

fetch('data/settings.json')
  .then(res => {
    if(!res.ok) throw new Error('Keine settings.json gefunden');
    return res.json();
  })
  .then(s => {
    const table = document.querySelector('.hours-table');
    if(!table) return;

    if(s.address){
      const addrCell = table.querySelector('tr:nth-child(1) td:nth-child(2)');
      if(addrCell) addrCell.textContent = s.address;
    }
    if(s.phone1){
      const phoneCell = table.querySelector('tr:nth-child(2) td:nth-child(2)');
      const tel1 = 'tel:+49' + s.phone1.replace(/\D/g,'').replace(/^49/,'');
      let html = `<a href="${tel1}">${s.phone1}</a>`;
      if(s.phone2){
        const tel2 = 'tel:+49' + s.phone2.replace(/\D/g,'').replace(/^49/,'');
        html += ` oder <a href="${tel2}">${s.phone2}</a>`;
      }
      if(phoneCell) phoneCell.innerHTML = html;
    }
    if(s.email){
      const emailCell = table.querySelector('tr:nth-child(3) td:nth-child(2)');
      if(emailCell) emailCell.innerHTML = `<a href="mailto:${s.email}">${s.email}</a>`;
    }
  })
  .catch(err => {
    console.warn('Einstellungen konnten nicht aus data/settings.json geladen werden:', err);
  });
