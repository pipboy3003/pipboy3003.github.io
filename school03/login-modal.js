// Wiederverwendbares Login-Popup (Modal). Wird auf allen öffentlichen Seiten eingebunden.
// Erzeugt das Modal-HTML dynamisch, damit es nicht auf jeder Seite von Hand eingefügt werden muss.


function erzeugeLoginModal(){
  if(document.getElementById('loginModalOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'loginModalOverlay';
  overlay.className = 'login-modal-overlay hidden';
  overlay.innerHTML = `
    <div class="login-modal">
      <span class="login-modal-close" id="loginModalClose">&times;</span>
      <img src="logo-icon.png" alt="AT Learning" class="login-modal-logo">
      <h2>Mein Bereich</h2>
      <p class="login-modal-sub">Melden Sie sich mit Ihren Zugangsdaten an.</p>
      <form id="loginModalForm">
        <input type="email" id="loginModalEmail" placeholder="E-Mail-Adresse" required autocomplete="username">
        <input type="password" id="loginModalPassword" placeholder="Passwort" required autocomplete="current-password">
        <button type="submit" class="btn btn-primary">Anmelden</button>
        <p class="form-note" id="loginModalNote"></p>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', function(e){ if(e.target === overlay) schliesseLoginModal(); });
  document.getElementById('loginModalClose').addEventListener('click', schliesseLoginModal);
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') schliesseLoginModal(); });

  document.getElementById('loginModalForm').addEventListener('submit', function(e){
    e.preventDefault();
    const email = document.getElementById('loginModalEmail').value;
    const password = document.getElementById('loginModalPassword').value;
    const note = document.getElementById('loginModalNote');
    note.textContent = ''; note.className = 'form-note';

    auth.signInWithEmailAndPassword(email, password)
      .then(cred => pruefeRolleUndLeiteWeiter(cred.user))
      .catch(err => {
        note.textContent = 'Anmeldung fehlgeschlagen: E-Mail oder Passwort falsch.';
        note.className = 'form-note error';
        console.error(err);
      });
  });
}

function oeffneLoginModal(){
  erzeugeLoginModal();
  document.getElementById('loginModalOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('loginModalEmail')?.focus(), 100);
}

function schliesseLoginModal(){
  const overlay = document.getElementById('loginModalOverlay');
  if(overlay) overlay.classList.add('hidden');
  document.body.style.overflow = '';
}

async function pruefeRolleUndLeiteWeiter(user){
  const userDoc = await db.collection('users').doc(user.uid).get();
  const note = document.getElementById('loginModalNote');
  if(!userDoc.exists){
    if(note){ note.textContent = 'Kein Benutzerprofil gefunden. Bitte Admin kontaktieren.'; note.className = 'form-note error'; }
    return;
  }
  const role = userDoc.data().role;
  if(role === 'admin') window.location.href = 'admin.html';
  else if(role === 'lehrer') window.location.href = 'lehrer.html';
  else if(role === 'schueler') window.location.href = 'klasse.html';
  else if(note){ note.textContent = 'Unbekannte Rolle. Bitte Admin kontaktieren.'; note.className = 'form-note error'; }
}

document.addEventListener('DOMContentLoaded', function(){
  erzeugeLoginModal();
  document.querySelectorAll('[data-login-trigger]').forEach(el => {
    el.addEventListener('click', function(e){ e.preventDefault(); oeffneLoginModal(); });
  });
});
