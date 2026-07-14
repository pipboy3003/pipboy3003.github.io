if(sessionStorage.getItem('at_admin_auth') === 'true'){
  window.location.href = "admin.html";
}

document.getElementById('loginForm').addEventListener('submit', function(e){
  e.preventDefault();
  const password = document.getElementById('password').value;
  const note = document.getElementById('loginNote');

  if(password === ADMIN_PASSWORD){
    sessionStorage.setItem('at_admin_auth', 'true');
    window.location.href = "admin.html";
  } else {
    note.textContent = 'Falsches Passwort. Bitte erneut versuchen.';
    note.className = 'form-note error';
  }
});
