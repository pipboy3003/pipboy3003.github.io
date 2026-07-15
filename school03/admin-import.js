// Massen-Import von Terminen per Copy-Paste (Semikolon-getrennte Zeilen) in eine ausgewählte Klasse.
auth.onAuthStateChanged(async function(user){
  if(!user){ window.location.href = 'login.html'; return; }
  const userDoc = await db.collection('users').doc(user.uid).get();
  if(!userDoc.exists || userDoc.data().role !== 'admin'){ window.location.href = 'login.html'; return; }
  ladeKlassenDropdown();
});

async function ladeKlassenDropdown(){
  const snap = await db.collection('klassen').get();
  const select = document.getElementById('importKlasse');
  select.innerHTML = '<option value="" disabled selected>Klasse auswählen…</option>';
  snap.forEach(doc => {
    const opt = document.createElement('option');
    opt.value = doc.id;
    opt.textContent = doc.data().name || doc.id;
    select.appendChild(opt);
  });
}

function parseZeilen(text){
  return text.split('\n').map(z => z.trim()).filter(z => z.length > 0).map(zeile => {
    const teile = zeile.split(';').map(t => t.trim());
    return {
      datum: teile[0] || '',
      zeit: teile[1] || '',
      thema: teile[2] || '',
      dozent: teile[3] || '',
      raum: teile[4] || '',
      abgesagt: false
    };
  });
}

document.getElementById('previewBtn').addEventListener('click', function(){
  const termine = parseZeilen(document.getElementById('importText').value);
  const preview = document.getElementById('importPreview');
  if(termine.length === 0){ preview.innerHTML = '<p class="loading-note">Keine gültigen Zeilen erkannt.</p>'; return; }

  let rows = termine.map(t => `<tr>
    <td>${t.datum}</td><td>${t.zeit}</td><td>${t.thema}</td><td>${t.dozent}</td><td>${t.raum}</td>
  </tr>`).join('');

  preview.innerHTML = `
    <h3>Vorschau: ${termine.length} Termine erkannt</h3>
    <table class="schueler-liste-table">
      <thead><tr><th>Datum</th><th>Zeit</th><th>Thema</th><th>Dozent</th><th>Raum</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
});

document.getElementById('importBtn').addEventListener('click', async function(){
  const note = document.getElementById('importNote');
  const klasseId = document.getElementById('importKlasse').value;
  if(!klasseId){ note.textContent = 'Bitte zuerst eine Klasse auswählen.'; note.className = 'form-note error'; return; }

  const termine = parseZeilen(document.getElementById('importText').value);
  if(termine.length === 0){ note.textContent = 'Keine gültigen Zeilen zum Importieren gefunden.'; note.className = 'form-note error'; return; }

  const fehlerhafte = termine.filter(t => !t.datum || !t.thema);
  if(fehlerhafte.length > 0){
    note.textContent = `${fehlerhafte.length} Zeile(n) haben kein Datum oder Thema und wurden ignoriert.`;
    note.className = 'form-note error';
  }
  const gueltigeTermine = termine.filter(t => t.datum && t.thema);

  note.textContent = `Importiere ${gueltigeTermine.length} Termine…`;
  note.className = 'form-note';

  const ref = db.collection('klassen').doc(klasseId).collection('termine');
  const batchSize = 400;
  for(let i = 0; i < gueltigeTermine.length; i += batchSize){
    const batch = db.batch();
    gueltigeTermine.slice(i, i + batchSize).forEach(termin => {
      batch.set(ref.doc(), termin);
    });
    await batch.commit();
  }

  note.textContent = `Fertig! ${gueltigeTermine.length} Termine wurden importiert. Betroffene Schüler und Dozenten erhalten automatisch eine Sammel-E-Mail.`;
  note.className = 'form-note success';
});
