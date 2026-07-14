// Admin-Bereich mit Firebase: Kalenderverwaltung, Kurse, Nutzerverwaltung, Einstellungen.
auth.onAuthStateChanged(async function(user){
  if(!user){ window.location.href = 'login.html'; return; }
  const userDoc = await db.collection('users').doc(user.uid).get();
  if(!userDoc.exists || userDoc.data().role !== 'admin'){ window.location.href = 'login.html'; return; }
  initAdmin();
});
document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut().then(() => window.location.href='login.html'));
document.getElementById('burger').addEventListener('click', () => document.getElementById('adminNav').classList.toggle('open'));
function formatDateDe(dateStr){ if(!dateStr) return '-'; return new Date(dateStr).toLocaleDateString('de-DE'); }

let alleKlassen = []; let terminSelectKlassen = {};

async function initAdmin(){
  const klassenSnap = await db.collection('klassen').get();
  alleKlassen = klassenSnap.docs.map(d => ({id: d.id, ...d.data()}));

  const termineProKlasse = {};
  for(const k of alleKlassen){
    const termineSnap = await db.collection('klassen').doc(k.id).collection('termine').get();
    termineProKlasse[k.id] = termineSnap.docs.map(d => ({id: d.id, ...d.data()}));
  }
  terminSelectKlassen = termineProKlasse;

  new MonatsKalender({ containerId: 'adminKalenderContainer', klassen: alleKlassen.map(k => ({id:k.id,name:k.name})),
    termineProKlasse, onEventClick: (klasseId, terminId) => oeffneTerminZumBearbeiten(klasseId, terminId) });

  const klasseSelect = document.getElementById('terminKlasse');
  klasseSelect.innerHTML = '<option value="" disabled selected>Klasse auswählen…</option>';
  alleKlassen.forEach(k => { const o=document.createElement('option'); o.value=k.id; o.textContent=k.name; klasseSelect.appendChild(o); });

  const nutzerKlasseSelect = document.getElementById('nutzerKlasse');
  nutzerKlasseSelect.innerHTML = '<option value="" disabled selected>Klasse zuweisen…</option>';
  alleKlassen.forEach(k => { const o=document.createElement('option'); o.value=k.id; o.textContent=k.name; nutzerKlasseSelect.appendChild(o); });

  ladeNutzerListe(); ladeKurse(); ladeEinstellungen();
}

const terminForm = document.getElementById('terminForm');
const terminFormWrap = document.getElementById('terminFormWrap');
document.getElementById('newTerminBtn').addEventListener('click', () => {
  terminForm.reset(); document.getElementById('terminId').value=''; terminFormWrap.classList.remove('hidden'); terminFormWrap.scrollIntoView({behavior:'smooth'});
});
document.getElementById('cancelTerminBtn').addEventListener('click', () => terminFormWrap.classList.add('hidden'));
document.getElementById('terminWiederholen').addEventListener('change', function(){ document.getElementById('terminWiederholenBis').classList.toggle('hidden', !this.checked); });

function oeffneTerminZumBearbeiten(klasseId, terminId){
  const termin = (terminSelectKlassen[klasseId]||[]).find(t => t.id === terminId);
  if(!termin) return;
  document.getElementById('terminId').value = terminId;
  document.getElementById('terminKlasse').value = klasseId;
  document.getElementById('terminDatum').value = termin.datum||'';
  document.getElementById('terminZeit').value = termin.zeit||'';
  document.getElementById('terminRaum').value = termin.raum||'';
  document.getElementById('terminThema').value = termin.thema||'';
  document.getElementById('terminDozent').value = termin.dozent||'';
  document.getElementById('terminAbgesagt').checked = !!termin.abgesagt;
  terminFormWrap.classList.remove('hidden'); terminFormWrap.scrollIntoView({behavior:'smooth'});
}

terminForm.addEventListener('submit', async function(e){
  e.preventDefault();
  const note = document.getElementById('terminFormNote');
  const terminId = document.getElementById('terminId').value;
  const klasseId = document.getElementById('terminKlasse').value;
  const basisDaten = {
    datum: document.getElementById('terminDatum').value,
    zeit: document.getElementById('terminZeit').value,
    raum: document.getElementById('terminRaum').value,
    thema: document.getElementById('terminThema').value,
    dozent: document.getElementById('terminDozent').value,
    abgesagt: document.getElementById('terminAbgesagt').checked
  };
  const wiederholen = document.getElementById('terminWiederholen').checked;
  const wiederholenBis = document.getElementById('terminWiederholenBis').value;
  const ref = db.collection('klassen').doc(klasseId).collection('termine');

  if(terminId){ await ref.doc(terminId).set(basisDaten, {merge:true}); }
  else if(wiederholen && wiederholenBis){
    let aktuellesDatum = new Date(basisDaten.datum);
    const endDatum = new Date(wiederholenBis);
    const batch = db.batch();
    while(aktuellesDatum <= endDatum){
      const neuDoc = ref.doc();
      batch.set(neuDoc, {...basisDaten, datum: aktuellesDatum.toISOString().slice(0,10)});
      aktuellesDatum.setDate(aktuellesDatum.getDate()+7);
    }
    await batch.commit();
  } else { await ref.add(basisDaten); }

  note.textContent = 'Gespeichert! Betroffene Schüler und Dozenten werden automatisch per E-Mail informiert.';
  note.className = 'form-note success';
  setTimeout(() => { terminFormWrap.classList.add('hidden'); note.textContent=''; initAdmin(); }, 2000);
});

document.getElementById('nutzerRolle').addEventListener('change', function(){
  document.getElementById('nutzerKlasseWrap').style.display = (this.value==='schueler'||this.value==='lehrer') ? 'block':'none';
});
document.getElementById('newNutzerBtn').addEventListener('click', () => {
  document.getElementById('nutzerForm').reset();
  document.getElementById('nutzerFormWrap').classList.remove('hidden');
  document.getElementById('nutzerFormWrap').scrollIntoView({behavior:'smooth'});
});
document.getElementById('cancelNutzerBtn').addEventListener('click', () => document.getElementById('nutzerFormWrap').classList.add('hidden'));

document.getElementById('nutzerForm').addEventListener('submit', async function(e){
  e.preventDefault();
  const note = document.getElementById('nutzerFormNote');
  const name = document.getElementById('nutzerName').value;
  const email = document.getElementById('nutzerEmail').value;
  const passwort = document.getElementById('nutzerPasswort').value;
  const rolle = document.getElementById('nutzerRolle').value;
  const klasseId = document.getElementById('nutzerKlasse').value;
  try{
    const secondaryApp = firebase.apps.find(a => a.name==='Secondary') || firebase.initializeApp(firebase.app().options, 'Secondary');
    const cred = await secondaryApp.auth().createUserWithEmailAndPassword(email, passwort);
    const profil = {name, email, role: rolle};
    if(rolle==='schueler') profil.klasseId = klasseId;
    if(rolle==='lehrer') profil.klassenIds = [klasseId];
    await db.collection('users').doc(cred.user.uid).set(profil);
    await secondaryApp.auth().signOut();
    note.textContent = 'Nutzer erfolgreich angelegt!'; note.className = 'form-note success';
    setTimeout(() => { document.getElementById('nutzerFormWrap').classList.add('hidden'); note.textContent=''; ladeNutzerListe(); }, 1800);
  } catch(err){ note.textContent = 'Fehler: ' + err.message; note.className = 'form-note error'; }
});

async function ladeNutzerListe(){
  const snap = await db.collection('users').where('role','in',['lehrer','schueler']).get();
  const liste = document.getElementById('nutzerListe'); liste.innerHTML = '';
  if(snap.empty){ liste.innerHTML = '<p class="loading-note">Noch keine Nutzer angelegt.</p>'; return; }
  snap.forEach(doc => {
    const u = doc.data();
    const klasseName = alleKlassen.find(k => k.id===u.klasseId || (u.klassenIds||[]).includes(k.id))?.name || '-';
    const card = document.createElement('div'); card.className = 'admin-course-card';
    card.innerHTML = `<div><span class="card-tag">${u.role==='lehrer'?'👨‍🏫 Lehrer':'🎓 Schüler'}</span><h3>${u.name}</h3><p style="color:var(--text-dim);font-size:.88rem;">${u.email} · ${klasseName}</p></div>`;
    liste.appendChild(card);
  });
}

const courseForm = document.getElementById('courseForm');
const courseFormWrap = document.getElementById('courseFormWrap');
const courseList = document.getElementById('courseList');
document.getElementById('newCourseBtn').addEventListener('click', () => { courseForm.reset(); document.getElementById('courseId').value=''; courseFormWrap.classList.remove('hidden'); });
document.getElementById('cancelFormBtn').addEventListener('click', () => courseFormWrap.classList.add('hidden'));

courseForm.addEventListener('submit', async function(e){
  e.preventDefault();
  const id = document.getElementById('courseId').value;
  const data = {
    title: document.getElementById('courseTitle').value, tag: document.getElementById('courseTag').value,
    start: document.getElementById('courseStart').value, end: document.getElementById('courseEnd').value,
    ue: document.getElementById('courseUE').value, phone: document.getElementById('coursePhone').value,
    description: document.getElementById('courseDesc').value, highlight: document.getElementById('courseHighlight').checked
  };
  if(id){ await db.collection('courses').doc(id).set(data,{merge:true}); } else { await db.collection('courses').add(data); }
  courseFormWrap.classList.add('hidden'); ladeKurse();
});

async function ladeKurse(){
  const snap = await db.collection('courses').get();
  courseList.innerHTML = '';
  if(snap.empty){ courseList.innerHTML = '<p class="loading-note">Noch keine Kurse angelegt.</p>'; return; }
  snap.forEach(doc => {
    const c = doc.data();
    const card = document.createElement('div'); card.className = 'admin-course-card' + (c.highlight?' card-highlight':'');
    card.innerHTML = `<div><span class="card-tag">${c.tag||''}</span><h3>${c.title||''}</h3><p>${c.description||''}</p></div>
      <div class="admin-course-actions"><button class="btn btn-danger btn-small" data-id="${doc.id}">Löschen</button></div>`;
    card.querySelector('button').addEventListener('click', async () => { if(confirm('Kurs löschen?')){ await db.collection('courses').doc(doc.id).delete(); ladeKurse(); } });
    courseList.appendChild(card);
  });
}

document.getElementById('settingsForm').addEventListener('submit', async function(e){
  e.preventDefault();
  await db.collection('settings').doc('general').set({
    phone1: document.getElementById('setPhone1').value, phone2: document.getElementById('setPhone2').value,
    email: document.getElementById('setEmail').value, address: document.getElementById('setAddress').value,
    hours: document.getElementById('setHours').value
  }, {merge:true});
  const note = document.getElementById('settingsNote');
  note.textContent = 'Einstellungen gespeichert!'; note.className = 'form-note success';
});

async function ladeEinstellungen(){
  const doc = await db.collection('settings').doc('general').get();
  if(!doc.exists) return;
  const s = doc.data();
  document.getElementById('setPhone1').value = s.phone1||'';
  document.getElementById('setPhone2').value = s.phone2||'';
  document.getElementById('setEmail').value = s.email||'';
  document.getElementById('setAddress').value = s.address||'';
  document.getElementById('setHours').value = s.hours||'';
}
