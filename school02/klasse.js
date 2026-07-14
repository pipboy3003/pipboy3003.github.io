// Lädt die Daten der eingeloggten Klasse aus data/klassen.json
// und rendert Stundenplan + Trainingsmaterial.

const klasseId = sessionStorage.getItem('at_klasse_auth');
if(!klasseId){
  window.location.href = 'login.html';
}

document.getElementById('klasseLogoutBtn').addEventListener('click', function(){
  sessionStorage.removeItem('at_klasse_auth');
  window.location.href = 'login.html';
});

document.getElementById('burger').addEventListener('click', function(){
  document.getElementById('klasseNav').classList.toggle('open');
});

function formatDateDe(dateStr){
  if(!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE');
}

function materialIcon(typ){
  switch(typ){
    case 'trainer': return '🧠';
    case 'pdf': return '📄';
    case 'video': return '🎬';
    default: return '🔗';
  }
}

fetch('data/klassen.json')
  .then(res => res.json())
  .then(klassenListe => {
    const klasse = klassenListe.find(k => k.id === klasseId);
    if(!klasse){
      sessionStorage.removeItem('at_klasse_auth');
      window.location.href = 'login.html';
      return;
    }

    document.getElementById('klasseName').textContent = klasse.name;
    document.getElementById('klasseZeitraum').textContent =
      'Kurszeitraum: ' + formatDateDe(klasse.start) + ' – ' + formatDateDe(klasse.end);

    const planList = document.getElementById('stundenplanList');
    planList.innerHTML = '';
    if(!klasse.stundenplan || klasse.stundenplan.length === 0){
      planList.innerHTML = '<p class="loading-note">Noch keine Termine hinterlegt.</p>';
    } else {
      klasse.stundenplan
        .sort((a,b) => (a.datum || '').localeCompare(b.datum || ''))
        .forEach(termin => {
          const card = document.createElement('div');
          card.className = 'admin-course-card';
          card.innerHTML = `
            <div>
              <span class="card-tag">${termin.tag || ''} · ${formatDateDe(termin.datum)}</span>
              <h3>${termin.thema || ''}</h3>
              <ul class="card-meta">
                <li><strong>Uhrzeit:</strong> ${termin.zeit || '-'}</li>
                <li><strong>Dozent:</strong> ${termin.dozent || '-'}</li>
                <li><strong>Raum:</strong> ${termin.raum || '-'}</li>
              </ul>
            </div>
          `;
          planList.appendChild(card);
        });
    }

    const materialGrid = document.getElementById('materialGrid');
    materialGrid.innerHTML = '';
    if(!klasse.material || klasse.material.length === 0){
      materialGrid.innerHTML = '<p class="loading-note">Noch kein Material hinterlegt.</p>';
    } else {
      klasse.material.forEach(m => {
        const card = document.createElement('a');
        card.href = m.link || '#';
        card.target = '_blank';
        card.className = 'card';
        card.innerHTML = `
          <span class="card-tag">${materialIcon(m.typ)} ${m.typ || 'Material'}</span>
          <h3>${m.titel || ''}</h3>
          <span class="card-link">Öffnen →</span>
        `;
        materialGrid.appendChild(card);
      });
    }
  })
  .catch(err => {
    console.error('Klassendaten konnten nicht geladen werden:', err);
  });
