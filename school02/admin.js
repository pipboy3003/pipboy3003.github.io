// Admin-Bereich ohne Firebase: Daten werden im Browser (localStorage) gespeichert
// und lassen sich als JSON-Datei exportieren/importieren, um sie auf der Website
// (data/courses.json, data/settings.json) zu aktualisieren.

if(sessionStorage.getItem('at_admin_auth') !== 'true'){
  window.location.href = "login.html";
}

document.getElementById('logoutBtn').addEventListener('click', function(){
  sessionStorage.removeItem('at_admin_auth');
  window.location.href = "login.html";
});

document.getElementById('burger').addEventListener('click', function(){
  document.getElementById('adminNav').classList.toggle('open');
});

const COURSES_KEY = 'at_learning_courses';
const SETTINGS_KEY = 'at_learning_settings';

function loadCourses(){
  const raw = localStorage.getItem(COURSES_KEY);
  if(raw) return JSON.parse(raw);
  return [];
}
function saveCourses(courses){
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}
function loadSettings(){
  const raw = localStorage.getItem(SETTINGS_KEY);
  if(raw) return JSON.parse(raw);
  return {};
}
function saveSettings(settings){
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Beim allerersten Öffnen: bestehende data/courses.json als Startbestand laden
async function initCourses(){
  let courses = loadCourses();
  if(courses.length === 0){
    try{
      const res = await fetch('data/courses.json');
      if(res.ok){
        courses = await res.json();
        saveCourses(courses);
      }
    }catch(e){ console.warn('Konnte data/courses.json nicht laden:', e); }
  }
  renderCourses(courses);
}

async function initSettings(){
  let settings = loadSettings();
  if(Object.keys(settings).length === 0){
    try{
      const res = await fetch('data/settings.json');
      if(res.ok){
        settings = await res.json();
        saveSettings(settings);
      }
    }catch(e){ console.warn('Konnte data/settings.json nicht laden:', e); }
  }
  document.getElementById('setPhone1').value = settings.phone1 || '';
  document.getElementById('setPhone2').value = settings.phone2 || '';
  document.getElementById('setEmail').value = settings.email || '';
  document.getElementById('setAddress').value = settings.address || '';
  document.getElementById('setHours').value = settings.hours || '';
}

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

function formatDate(dateStr){
  if(!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE');
}

function renderCourses(courses){
  courseList.innerHTML = '';
  if(!courses || courses.length === 0){
    courseList.innerHTML = '<p class="loading-note">Noch keine Kurse angelegt.</p>';
    return;
  }
  courses.sort((a,b) => (a.start || '').localeCompare(b.start || ''));
  courses.forEach(c => {
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
        <button class="btn btn-outline btn-small edit-btn" data-id="${c.id}">Bearbeiten</button>
        <button class="btn btn-danger btn-small delete-btn" data-id="${c.id}">Löschen</button>
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

function editCourse(id){
  const courses = loadCourses();
  const c = courses.find(x => x.id === id);
  if(!c) return;
  document.getElementById('courseId').value = c.id;
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
}

function deleteCourse(id){
  if(!confirm('Diesen Kurs wirklich löschen?')) return;
  let courses = loadCourses();
  courses = courses.filter(c => c.id !== id);
  saveCourses(courses);
  renderCourses(courses);
}

courseForm.addEventListener('submit', function(e){
  e.preventDefault();
  const id = document.getElementById('courseId').value;
  let courses = loadCourses();

  const data = {
    id: id || 'c' + Date.now(),
    title: document.getElementById('courseTitle').value,
    tag: document.getElementById('courseTag').value,
    start: document.getElementById('courseStart').value,
    end: document.getElementById('courseEnd').value,
    ue: document.getElementById('courseUE').value,
    phone: document.getElementById('coursePhone').value,
    description: document.getElementById('courseDesc').value,
    highlight: document.getElementById('courseHighlight').checked
  };

  if(id){
    courses = courses.map(c => c.id === id ? data : c);
  } else {
    courses.push(data);
  }

  saveCourses(courses);
  renderCourses(courses);

  courseFormNote.textContent = 'Gespeichert! Nicht vergessen: unten auf "Als JSON exportieren" klicken, um die Website zu aktualisieren.';
  courseFormNote.className = 'form-note success';
  courseForm.reset();
  setTimeout(() => {
    courseFormWrap.classList.add('hidden');
    courseFormNote.textContent = '';
  }, 2500);
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
  saveSettings(data);
  note.textContent = 'Einstellungen gespeichert! Nicht vergessen: unten exportieren.';
  note.className = 'form-note success';
});

document.getElementById('exportCoursesBtn').addEventListener('click', function(){
  const courses = loadCourses();
  downloadJSON(courses, 'courses.json');
});

document.getElementById('exportSettingsBtn').addEventListener('click', function(){
  const settings = loadSettings();
  downloadJSON(settings, 'settings.json');
});

function downloadJSON(data, filename){
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.getElementById('importCoursesInput').addEventListener('change', function(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(evt){
    try{
      const imported = JSON.parse(evt.target.result);
      saveCourses(imported);
      renderCourses(imported);
      alert('Kurse erfolgreich importiert!');
    }catch(err){
      alert('Fehler beim Importieren: ' + err.message);
    }
  };
  reader.readAsText(file);
});

initCourses();
initSettings();
