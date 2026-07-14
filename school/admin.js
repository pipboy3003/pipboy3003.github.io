// Auth-Schutz: nicht eingeloggte Nutzer werden zum Login geschickt
auth.onAuthStateChanged(function(user){
  if(!user){
    window.location.href = "admin-login.html";
  }
});

document.getElementById('logoutBtn').addEventListener('click', function(){
  auth.signOut().then(() => window.location.href = "admin-login.html");
});

document.getElementById('burger').addEventListener('click', function(){
  document.getElementById('adminNav').classList.toggle('open');
});

const coursesRef = db.collection('courses');
const settingsRef = db.collection('settings').doc('general');

const courseForm = document.getElementById('courseForm');
const courseFormWrap = document.getElementById('courseFormWrap');
const courseList = document.getElementById('courseList');
const courseFormNote = document.getElementById('courseFormNote');

document.getElementById('newCourseBtn').addEventListener('click', function(){
  courseForm.reset();
  document.getElementById('courseId').value = '';
  courseFormWrap.classList.remove('hidden');
  courseFormWrap.scrollIntoView({behavior:'smooth'});
});

document.getElementById('cancelFormBtn').addEventListener('click', function(){
  courseFormWrap.classList.add('hidden');
});

function renderCourses(snapshot){
  courseList.innerHTML = '';
  if(snapshot.empty){
    courseList.innerHTML = '<p class="loading-note">Noch keine Kurse angelegt.</p>';
    return;
  }
  snapshot.forEach(doc => {
    const c = doc.data();
    const card = document.createElement('div');
    card.className = 'admin-course-card' + (c.highlight ? ' card-highlight' : '');
    card.innerHTML = `
      <div>
        <span class="card-tag">${c.tag || ''}</span>
        <h3>${c.title || ''}</h3>
        <p>${c.description || ''}</p>
        <ul class="card-meta">
          <li><strong>Beginn:</strong> ${formatDate(c.start)}</li>
          <li><strong>Ende:</strong> ${formatDate(c.end)}</li>
          <li><strong>Umfang:</strong> ${c.ue || '-'}</li>
          <li><strong>Telefon:</strong> ${c.phone || '-'}</li>
        </ul>
      </div>
      <div class="admin-course-actions">
        <button class="btn btn-outline btn-small edit-btn" data-id="${doc.id}">Bearbeiten</button>
        <button class="btn btn-danger btn-small delete-btn" data-id="${doc.id}">Löschen</button>
      </div>
    `;
    courseList.appendChild(card);
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editCourse(btn.dataset.id));
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteCourse(btn.dataset.id));
  });
}

function formatDate(dateStr){
  if(!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE');
}

coursesRef.orderBy('start').onSnapshot(renderCourses, (err) => {
  courseList.innerHTML = '<p class="loading-note">Fehler beim Laden: ' + err.message + '</p>';
});

function editCourse(id){
  coursesRef.doc(id).get().then(doc => {
    if(!doc.exists) return;
    const c = doc.data();
    document.getElementById('courseId').value = id;
    document.getElementById('courseTitle').value = c.title || '';
    document.getElementById('courseTag').value = c.tag || '';
    document.getElementById('courseStart').value = c.start || '';
    document.getElementById('courseEnd').value = c.end || '';
    document.getElementById('courseUE').value = c.ue || '';
    document.getElementById('coursePhone').value = c.phone || '';
    document.getElementById('courseDesc').value = c.description || '';
    document.getElementById('courseHighlight').checked = !!c.highlight;
    courseFormWrap.classList.remove('hidden');
    courseFormWrap.scrollIntoView({behavior:'smooth'});
  });
}

function deleteCourse(id){
  if(confirm('Diesen Kurs wirklich löschen?')){
    coursesRef.doc(id).delete();
  }
}

courseForm.addEventListener('submit', function(e){
  e.preventDefault();
  const id = document.getElementById('courseId').value;
  const data = {
    title: document.getElementById('courseTitle').value,
    tag: document.getElementById('courseTag').value,
    start: document.getElementById('courseStart').value,
    end: document.getElementById('courseEnd').value,
    ue: document.getElementById('courseUE').value,
    phone: document.getElementById('coursePhone').value,
    description: document.getElementById('courseDesc').value,
    highlight: document.getElementById('courseHighlight').checked,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  courseFormNote.textContent = 'Speichern…';
  courseFormNote.className = 'form-note';

  const save = id ? coursesRef.doc(id).update(data) : coursesRef.add(data);

  save.then(() => {
    courseFormNote.textContent = 'Gespeichert!';
    courseFormNote.classList.add('success');
    courseForm.reset();
    setTimeout(() => {
      courseFormWrap.classList.add('hidden');
      courseFormNote.textContent = '';
    }, 1000);
  }).catch(err => {
    courseFormNote.textContent = 'Fehler: ' + err.message;
    courseFormNote.classList.add('error');
  });
});

// Einstellungen laden und speichern
settingsRef.get().then(doc => {
  if(doc.exists){
    const s = doc.data();
    document.getElementById('setPhone1').value = s.phone1 || '';
    document.getElementById('setPhone2').value = s.phone2 || '';
    document.getElementById('setEmail').value = s.email || '';
    document.getElementById('setAddress').value = s.address || '';
    document.getElementById('setHours').value = s.hours || '';
  }
});

document.getElementById('settingsForm').addEventListener('submit', function(e){
  e.preventDefault();
  const note = document.getElementById('settingsNote');
  const data = {
    phone1: document.getElementById('setPhone1').value,
    phone2: document.getElementById('setPhone2').value,
    email: document.getElementById('setEmail').value,
    address: document.getElementById('setAddress').value,
    hours: document.getElementById('setHours').value
  };
  note.textContent = 'Speichern…';
  note.className = 'form-note';

  settingsRef.set(data, { merge: true }).then(() => {
    note.textContent = 'Einstellungen gespeichert!';
    note.classList.add('success');
  }).catch(err => {
    note.textContent = 'Fehler: ' + err.message;
    note.classList.add('error');
  });
});
