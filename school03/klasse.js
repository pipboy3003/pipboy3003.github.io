// Klassenbereich: eigener Kalender inkl. Abmeldefunktion (jederzeit bis Unterrichtsbeginn, zurücknehmbar).
auth.onAuthStateChanged(async function(user){
  if(!user){ window.location.href = 'login.html'; return; }
  const userDoc = await db.collection('users').doc(user.uid).get();
  if(!userDoc.exists || userDoc.data().role !== 'schueler'){ window.location.href = 'login.html'; return; }

  const profil = userDoc.data();
  const klasseId = profil.klasseId;

  document.getElementById('klasseLogoutBtn').addEventListener('click', () => auth.signOut().then(() => window.location.href='login.html'));

  const klasseDoc = await db.collection('klassen').doc(klasseId).get();
  const klasse = klasseDoc.data();
  document.getElementById('klasseName').textContent = klasse.name;
  document.getElementById('klasseZeitraum').textContent = 'Kurszeitraum: ' + formatDateDe(klasse.start) + ' – ' + formatDateDe(klasse.end);

  const termineSnap = await db.collection('klassen').doc(klasseId).collection('termine').get();
  let termine = termineSnap.docs.map(d => ({id: d.id, ...d.data()}));

  const anwesenheitSnap = await db.collection('klassen').doc(klasseId).collection('anwesenheit').doc(user.uid).get();
  const eigeneAbmeldungen = anwesenheitSnap.exists ? (anwesenheitSnap.data().abgemeldeteTermine || []) : [];
  termine = termine.map(t => ({...t, abgemeldet: eigeneAbmeldungen.includes(t.id)}));

  new MonatsKalender({
    containerId: 'kalenderContainer',
    klassen: [{id: klasseId, name: klasse.name}],
    termineProKlasse: {[klasseId]: termine},
    aktiveKlassenIds: [klasseId],
    onEventClick: (kId, terminId) => oeffneModal(terminId, termine)
  });

  function oeffneModal(terminId, alleTermine){
    const termin = alleTermine.find(t => t.id === terminId);
    if(!termin) return;
    document.getElementById('modalThema').textContent = termin.thema || 'Termin';
    document.getElementById('modalMeta').innerHTML = `
      <li><strong>Datum:</strong> ${formatDateDe(termin.datum)}</li>
      <li><strong>Uhrzeit:</strong> ${termin.zeit || '-'}</li>
      <li><strong>Dozent:</strong> ${termin.dozent || '-'}</li>
      <li><strong>Raum:</strong> ${termin.raum || '-'}</li>`;

    const statusEl = document.getElementById('modalAbmeldeStatus');
    const abmeldenBtn = document.getElementById('modalAbmeldenBtn');
    const zuruecknehmenBtn = document.getElementById('modalZuruecknehmenBtn');

    if(termin.abgemeldet){
      statusEl.innerHTML = '<span class="abmelde-status ab">Sie sind abgemeldet</span>';
      abmeldenBtn.classList.add('hidden'); zuruecknehmenBtn.classList.remove('hidden');
    } else {
      statusEl.innerHTML = '<span class="abmelde-status an">Sie sind angemeldet</span>';
      abmeldenBtn.classList.remove('hidden'); zuruecknehmenBtn.classList.add('hidden');
    }
    abmeldenBtn.onclick = () => setAbmeldung(terminId, true);
    zuruecknehmenBtn.onclick = () => setAbmeldung(terminId, false);
    document.getElementById('eventModalOverlay').classList.remove('hidden');
  }

  async function setAbmeldung(terminId, abmelden){
    const ref = db.collection('klassen').doc(klasseId).collection('anwesenheit').doc(user.uid);
    const snap = await ref.get();
    let liste = snap.exists ? (snap.data().abgemeldeteTermine || []) : [];
    if(abmelden){ if(!liste.includes(terminId)) liste.push(terminId); }
    else { liste = liste.filter(id => id !== terminId); }
    await ref.set({ name: profil.name||'', email: profil.email||user.email, abgemeldeteTermine: liste,
      aktualisiertAm: firebase.firestore.FieldValue.serverTimestamp() }, {merge:true});
    document.getElementById('eventModalOverlay').classList.add('hidden');
    location.reload();
  }

  document.getElementById('eventModalClose').addEventListener('click', () => document.getElementById('eventModalOverlay').classList.add('hidden'));

  const materialGrid = document.getElementById('materialGrid');
  materialGrid.innerHTML = '';
  (klasse.material || []).forEach(m => {
    const card = document.createElement('a');
    card.href = m.link || '#'; card.target = '_blank'; card.className = 'card';
    card.innerHTML = `<span class="card-tag">${materialIcon(m.typ)} ${m.typ||'Material'}</span><h3>${m.titel||''}</h3><span class="card-link">Öffnen →</span>`;
    materialGrid.appendChild(card);
  });
});

document.getElementById('burger').addEventListener('click', () => document.getElementById('klasseNav').classList.toggle('open'));
function formatDateDe(dateStr){ if(!dateStr) return '-'; return new Date(dateStr).toLocaleDateString('de-DE'); }
function materialIcon(typ){ return typ==='trainer'?'🧠':typ==='pdf'?'📄':typ==='video'?'🎬':'🔗'; }
