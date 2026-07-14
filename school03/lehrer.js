// Lehrerbereich: zeigt nur zugeordnete Klassen. Push-Hinweis bei neuen Abmeldungen seit letztem Login.
auth.onAuthStateChanged(async function(user){
  if(!user){ window.location.href = 'login.html'; return; }
  const userDoc = await db.collection('users').doc(user.uid).get();
  if(!userDoc.exists || userDoc.data().role !== 'lehrer'){ window.location.href = 'login.html'; return; }

  const profil = userDoc.data();
  document.getElementById('lehrerName').textContent = 'Willkommen, ' + (profil.name || 'Dozent/in');
  document.getElementById('lehrerLogoutBtn').addEventListener('click', () => auth.signOut().then(() => window.location.href='login.html'));
  document.getElementById('burger').addEventListener('click', () => document.getElementById('lehrerNav').classList.toggle('open'));

  const klassenIds = profil.klassenIds || [];
  const klassen = []; const termineProKlasse = {}; let neueAbmeldungenGesamt = 0;
  const letzterLoginLehrer = profil.letzterLogin ? profil.letzterLogin.toDate() : new Date(0);

  for(const klasseId of klassenIds){
    const klasseDoc = await db.collection('klassen').doc(klasseId).get();
    if(!klasseDoc.exists) continue;
    const klasse = {id: klasseId, ...klasseDoc.data()};
    klassen.push(klasse);
    const termineSnap = await db.collection('klassen').doc(klasseId).collection('termine').get();
    termineProKlasse[klasseId] = termineSnap.docs.map(d => ({id: d.id, ...d.data()}));

    const anwesenheitSnap = await db.collection('klassen').doc(klasseId).collection('anwesenheit').get();
    anwesenheitSnap.forEach(doc => {
      const data = doc.data();
      const aktualisiertAm = data.aktualisiertAm ? data.aktualisiertAm.toDate() : null;
      if(aktualisiertAm && aktualisiertAm > letzterLoginLehrer && (data.abgemeldeteTermine||[]).length > 0) neueAbmeldungenGesamt++;
    });
  }

  if(neueAbmeldungenGesamt > 0){
    document.getElementById('benachrichtigungText').textContent = `Es gibt ${neueAbmeldungenGesamt} neue Abmeldung(en) seit Ihrem letzten Login.`;
    document.getElementById('benachrichtigungBox').classList.remove('hidden');
  }
  document.getElementById('benachrichtigungSchliessen').addEventListener('click', () => document.getElementById('benachrichtigungBox').classList.add('hidden'));

  await db.collection('users').doc(user.uid).set({ letzterLogin: firebase.firestore.FieldValue.serverTimestamp() }, {merge:true});

  const listeContainer = document.getElementById('lehrerKlassenListe');
  listeContainer.innerHTML = '';
  klassen.forEach(k => {
    const card = document.createElement('div'); card.className = 'lehrer-klasse-card';
    card.innerHTML = `<div><h3>${k.name}</h3><p style="color:var(--text-dim);font-size:.88rem;">${formatDateDe(k.start)} – ${formatDateDe(k.end)}</p></div><span class="card-link">Details ansehen →</span>`;
    card.addEventListener('click', () => zeigeKlasseDetail(k));
    listeContainer.appendChild(card);
  });

  new MonatsKalender({ containerId: 'lehrerKalenderContainer', klassen: klassen.map(k => ({id:k.id,name:k.name})), termineProKlasse, onEventClick: () => {} });

  async function zeigeKlasseDetail(klasse){
    document.getElementById('klasseDetailSection').classList.remove('hidden');
    document.getElementById('klasseDetailTitel').textContent = klasse.name;
    document.getElementById('klasseDetailSection').scrollIntoView({behavior:'smooth'});

    new MonatsKalender({ containerId: 'klasseDetailKalender', klassen: [{id:klasse.id,name:klasse.name}],
      termineProKlasse: {[klasse.id]: termineProKlasse[klasse.id]||[]}, onEventClick: () => {} });

    const anwesenheitSnap = await db.collection('klassen').doc(klasse.id).collection('anwesenheit').get();
    const tbody = document.getElementById('anwesenheitTableBody');
    tbody.innerHTML = '';
    if(anwesenheitSnap.empty){ tbody.innerHTML = '<tr><td colspan="2">Noch keine Anwesenheitsdaten.</td></tr>'; }
    else {
      anwesenheitSnap.forEach(doc => {
        const data = doc.data();
        const abgemeldet = (data.abgemeldeteTermine||[]).length > 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${data.name||'Unbekannt'}</td><td><span class="abmelde-status ${abgemeldet?'ab':'an'}">${abgemeldet?'Teilweise abgemeldet':'Anwesend'}</span></td>`;
        tbody.appendChild(tr);
      });
    }
  }
  document.getElementById('zurueckZurUebersicht').addEventListener('click', () => document.getElementById('klasseDetailSection').classList.add('hidden'));
});
function formatDateDe(dateStr){ if(!dateStr) return '-'; return new Date(dateStr).toLocaleDateString('de-DE'); }
