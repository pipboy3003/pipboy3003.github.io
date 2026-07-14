// Kombinierter Login: Klassen aus data/klassen.json + Admin-Zugang aus admin-config.js
// Klassen und Admin laufen über dieselbe Login-Maske, landen aber auf getrennten Seiten.

let klassenListe = [];

fetch('data/klassen.json')
  .then(res => res.json())
  .then(data => {
    klassenListe = data;
    const select = document.getElementById('klasseSelect');
    data.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k.id;
      opt.textContent = k.name;
      select.insertBefore(opt, select.querySelector('option[value="__admin__"]'));
    });
  })
  .catch(err => console.error('Klassen konnten nicht geladen werden:', err));

// Automatische Weiterleitung, falls bereits eingeloggt
if(sessionStorage.getItem('at_admin_auth') === 'true'){
  window.location.href = 'admin.html';
}
const savedKlasse = sessionStorage.getItem('at_klasse_auth');
if(savedKlasse){
  window.location.href = 'klasse.html';
}

document.getElementById('loginForm').addEventListener('submit', function(e){
  e.preventDefault();
  const selection = document.getElementById('klasseSelect').value;
  const password = document.getElementById('loginPassword').value;
  const note = document.getElementById('loginNote');

  if(selection === '__admin__'){
    if(password === ADMIN_PASSWORD){
      sessionStorage.setItem('at_admin_auth', 'true');
      window.location.href = 'admin.html';
    } else {
      note.textContent = 'Falsches Administrator-Passwort.';
      note.className = 'form-note error';
    }
    return;
  }

  const klasse = klassenListe.find(k => k.id === selection);
  if(klasse && password === klasse.password){
    sessionStorage.setItem('at_klasse_auth', klasse.id);
    window.location.href = 'klasse.html';
  } else {
    note.textContent = 'Falsche Klasse oder falsches Passwort.';
    note.className = 'form-note error';
  }
});
