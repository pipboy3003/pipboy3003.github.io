// Zentrale Anmeldung über Firebase Auth. Rolle wird aus Firestore "users" gelesen.
auth.onAuthStateChanged(function(user){ if(user) pruefeRolleUndLeiteWeiter(user); });

document.getElementById('loginForm').addEventListener('submit', function(e){
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const note = document.getElementById('loginNote');
  auth.signInWithEmailAndPassword(email, password)
    .then(cred => pruefeRolleUndLeiteWeiter(cred.user))
    .catch(err => {
      note.textContent = 'Anmeldung fehlgeschlagen: E-Mail oder Passwort falsch.';
      note.className = 'form-note error';
      console.error(err);
    });
});

async function pruefeRolleUndLeiteWeiter(user){
  const userDoc = await db.collection('users').doc(user.uid).get();
  if(!userDoc.exists){
    document.getElementById('loginNote').textContent = 'Kein Benutzerprofil gefunden. Bitte Admin kontaktieren.';
    document.getElementById('loginNote').className = 'form-note error';
    return;
  }
  const role = userDoc.data().role;
  if(role === 'admin') window.location.href = 'admin.html';
  else if(role === 'lehrer') window.location.href = 'lehrer.html';
  else if(role === 'schueler') window.location.href = 'klasse.html';
  else {
    document.getElementById('loginNote').textContent = 'Unbekannte Rolle. Bitte Admin kontaktieren.';
    document.getElementById('loginNote').className = 'form-note error';
  }
}
