// app.js
// Вставлена ваша конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCwt_eO3DMUKDMv3RNg-_aYPuNAG5CUVSo",
  authDomain: "app-diary-b6d0e.firebaseapp.com",
  databaseURL: "https://app-diary-b6d0e-default-rtdb.firebaseio.com",
  projectId: "app-diary-b6d0e",
  storageBucket: "app-diary-b6d0e.firebasestorage.app",
  messagingSenderId: "886719248961",
  appId: "1:886719248961:web:cd26bf1ea28626a79124c0",
  measurementId: "G-P6JMJMB03L"
};

try {
  firebase.initializeApp(firebaseConfig);
} catch (error) {
  console.error('Ошибка инициализации Firebase:', error);
}

const db = firebase.database();
const storage = firebase.storage();
const subjectsRef = db.ref('subjects');

const PIN = '936';
let isAdmin = false;
let currentSubjectId = null;

// Локальное хранилище для оффлайн
let localSubjects = {};

// Дефолтное изображение (base64 placeholder для избежания сломанных ссылок)
const defaultImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

// Загрузка данных
function loadSubjects() {
  subjectsRef.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    localSubjects = data;
    saveToLocalStorage();
    renderSubjects();
    if (Notification.permission === 'granted') {
      new Notification('Данные обновлены');
    }
  }, (error) => {
    console.error('Ошибка загрузки данных из Firebase:', error);
  });
}

// Рендер предметов
function renderSubjects() {
  const list = document.getElementById('subjects-list');
  list.innerHTML = '';
  Object.entries(localSubjects).forEach(([id, subject]) => {
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.innerHTML = `
      <img src="${subject.preview || defaultImg}" alt="${subject.name}">
      <p>${subject.name}</p>
    `;
    card.onclick = () => showTask(id, subject);
    list.appendChild(card);
  });
}

// Показать задание
function showTask(id, subject) {
  currentSubjectId = id;
  document.getElementById('task-title').textContent = subject.name;
  document.getElementById('task-description').textContent = subject.task || 'Нет задания';
  const imagesDiv = document.getElementById('task-images');
  imagesDiv.innerHTML = '';
  (subject.images || []).forEach((url, index) => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = `Фото ${index + 1}`;
    img.onclick = () => showFullImage(url);
    imagesDiv.appendChild(img);
  });
  document.getElementById('last-updated').textContent = `Последнее обновление: ${subject.updated ? new Date(subject.updated).toLocaleString() : 'Неизвестно'}`;
  document.getElementById('task-detail').style.display = 'block';
  document.getElementById('admin-task-edit').style.display = isAdmin ? 'block' : 'none';
  if (isAdmin) {
    document.getElementById('task-text').value = subject.task || '';
  }
}

// Полноразмерное фото
function showFullImage(url) {
  const full = document.createElement('div');
  full.className = 'full-image';
  full.innerHTML = `<img src="${url}">`;
  full.onclick = () => full.remove();
  document.body.appendChild(full);
}

// Админ вход
document.getElementById('admin-btn').onclick = () => {
  document.getElementById('admin-panel').style.display = 'block';
};
document.getElementById('login-btn').onclick = () => {
  if (document.getElementById('pin-input').value === PIN) {
    isAdmin = true;
    document.getElementById('admin-controls').style.display = 'block';
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'block';
    document.getElementById('admin-task-edit').style.display = currentSubjectId ? 'block' : 'none';
  }
};
document.getElementById('logout-btn').onclick = () => {
  isAdmin = false;
  document.getElementById('admin-controls').style.display = 'none';
  document.getElementById('login-btn').style.display = 'block';
  document.getElementById('logout-btn').style.display = 'none';
  document.getElementById('admin-task-edit').style.display = 'none';
};

// Добавить предмет
document.getElementById('add-subject-btn').onclick = async () => {
  const name = document.getElementById('subject-name').value;
  const file = document.getElementById('subject-preview').files[0];
  if (!name) return;
  const id = Date.now().toString();
  let previewUrl = '';
  if (file) {
    try {
      previewUrl = await uploadFile(file, `previews/${id}`);
    } catch (error) {
      console.error('Ошибка загрузки превью:', error);
    }
  }
  subjectsRef.child(id).set({
    name,
    preview: previewUrl,
    updated: Date.now()
  });
};

// Сохранить задание
document.getElementById('save-task-btn').onclick = async () => {
  const task = document.getElementById('task-text').value;
  const files = [
    document.getElementById('task-photo1').files[0],
    document.getElementById('task-photo2').files[0],
    document.getElementById('task-photo3').files[0]
  ].filter(f => f);
  const images = [];
  for (let file of files) {
    try {
      const url = await uploadFile(file, `tasks/${currentSubjectId}/${file.name}`);
      images.push(url);
    } catch (error) {
      console.error('Ошибка загрузки фото:', error);
    }
  }
  subjectsRef.child(currentSubjectId).update({
    task,
    images,
    updated: Date.now()
  });
};

// Загрузка файла в Storage
async function uploadFile(file, path) {
  const ref = storage.ref(path);
  await ref.put(file);
  return await ref.getDownloadURL();
}

// Локальное хранилище
function saveToLocalStorage() {
  localStorage.setItem('subjects', JSON.stringify(localSubjects));
}
function loadFromLocalStorage() {
  const data = localStorage.getItem('subjects');
  if (data) {
    localSubjects = JSON.parse(data);
    renderSubjects();
  }
}

// Уведомления
if (Notification.permission !== 'granted') {
  Notification.requestPermission();
}

// Инициализация
loadFromLocalStorage();
loadSubjects();