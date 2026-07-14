document.getElementById('burger')?.addEventListener('click', function(){
  document.getElementById('nav').classList.toggle('open');
});
document.getElementById('anmeldung')?.addEventListener('submit', function(e){
  e.preventDefault();
  document.getElementById('formNote').textContent = 'Danke! Wir melden uns zeitnah bei Ihnen.';
  document.getElementById('formNote').className = 'form-note success';
  this.reset();
});
