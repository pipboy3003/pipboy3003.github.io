auth.onAuthStateChanged(function(user){
  if(user){
    window.location.href = "admin.html";
  }
});

document.getElementById('loginForm').addEventListener('submit', function(e){
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const note = document.getElementById('loginNote');
  note.textContent = '';
  note.className = 'form-note';

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "admin.html";
    })
    .catch((error) => {
      note.textContent = 'Login fehlgeschlagen: E-Mail oder Passwort falsch.';
      note.classList.add('error');
      console.error(error);
    });
});
