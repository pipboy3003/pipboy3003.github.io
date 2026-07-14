document.getElementById('burger').addEventListener('click', function(){
  document.getElementById('nav').classList.toggle('open');
});

const form = document.getElementById('anmeldung');
if(form){
  form.addEventListener('submit', function(e){
    e.preventDefault();
    const note = document.getElementById('formNote');
    const btn = form.querySelector('button[type="submit"]');
    const data = new FormData(form);

    btn.disabled = true;
    btn.textContent = 'Wird gesendet...';
    note.textContent = '';
    note.className = 'form-note';

    fetch('https://formsubmit.co/ajax/info@at-learning.de', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: data
    })
    .then(res => res.json())
    .then(() => {
      note.textContent = 'Vielen Dank! Ihre Nachricht wurde erfolgreich versendet.';
      note.classList.add('success');
      form.reset();
    })
    .catch(() => {
      note.textContent = 'Da ist leider etwas schiefgelaufen. Bitte kontaktieren Sie uns direkt per E-Mail: info@at-learning.de';
      note.classList.add('error');
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = 'Absenden';
    });
  });
}

document.querySelectorAll('a[href^="#"]').forEach(link=>{
  link.addEventListener('click', function(e){
    const target = document.querySelector(this.getAttribute('href'));
    if(target){
      e.preventDefault();
      target.scrollIntoView({behavior:'smooth'});
      document.getElementById('nav').classList.remove('open');
    }
  });
});
