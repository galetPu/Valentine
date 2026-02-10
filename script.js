// ===== Firebase config =====
// Вставь сюда свои данные Firebase
// ===== Firebase config =====
const firebaseConfig = {
  apiKey: "AIzaSyAtrDJ5YNdDp4_2n4VEHCDqSmopntV_yh4",
  authDomain: "valentinkisite.firebaseapp.com",
  databaseURL: "https://valentinkisite-default-rtdb.firebaseio.com", // <== добавляем URL базы данных
  projectId: "valentinkisite",
  storageBucket: "valentinkisite.firebasestorage.app",
  messagingSenderId: "382865099092",
  appId: "1:382865099092:web:876a58b62ffabce63160c1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();


const nameInput = document.getElementById('name');
const messageInput = document.getElementById('message');
const sendBtn = document.getElementById('sendBtn');
const wall = document.getElementById('wall');

// ===== Модальное окно =====
function showModal() {
    const modal = document.getElementById('thanksModal');
    modal.style.display = 'block';
    setTimeout(() => modal.style.display = 'none', 2000);
}


// ===== Падающие сердечки =====
function createHeart() {
    const heart = document.createElement('div');
    heart.classList.add('heart');
    heart.innerText = '❤️';
    heart.style.left = Math.random() * window.innerWidth + 'px';
    heart.style.fontSize = (Math.random() * 25 + 15) + 'px';
    const duration = Math.random() * 3 + 4; // 4-7 сек
    heart.style.animation = `fall ${duration}s linear forwards`;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), duration * 1000);
}
setInterval(createHeart, 400);


// ===== Отправка валентинки =====
sendBtn.addEventListener('click', () => {
    const name = nameInput.value || "Аноним";
    const message = messageInput.value.trim();

    // Проверка на пустое сообщение
    if(message.length === 0) {
        alert("Введите сообщение!");
        return;
    }

    db.ref('valentines').push({
        name: name,
        message: message,
        likes: 0,
        timestamp: Date.now()
    });

    messageInput.value = "";
    showModal();
    createConfetti();
});

// ===== Получение валентинок и отображение =====
db.ref('valentines').on('value', snapshot => {
    wall.innerHTML = "";
    const data = snapshot.val();
    if (!data) return;

    Object.keys(data).sort((a,b) => data[b].timestamp - data[a].timestamp)
        .forEach(key => {
            const card = document.createElement('div');
            card.classList.add('card');

            const likes = data[key].likes || 0;

            // Форматируем дату
            const ts = data[key].timestamp || Date.now();
            const date = new Date(ts);
            const timeString = date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            card.innerHTML = `
                <strong>${data[key].name}</strong>
                <span class="time">${timeString}</span>
                <p>${data[key].message}</p>
                <div class="like" onclick="likePost('${key}', this)">❤️ ${likes}</div>
            `;

            wall.appendChild(card);
        });
});

// ===== Лайки с анимацией сердечка =====
function likePost(id, el) {
    const likeRef = db.ref('valentines/' + id + '/likes');
    likeRef.transaction(currentLikes => (currentLikes || 0) + 1);

    // маленькое сердечко при клике
    const heart = document.createElement('div');
    heart.classList.add('like-heart');
    heart.innerText = '❤️';
    document.body.appendChild(heart);
    const rect = el.getBoundingClientRect();
    heart.style.left = rect.left + rect.width/2 + 'px';
    heart.style.top = rect.top + 'px';
    setTimeout(()=> heart.remove(), 600);
}

Object.keys(data).forEach(key => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
        <strong>${data[key].name}</strong>
        <span class="time">${timeString}</span>
        <p>${data[key].message}</p>
        <div class="like" onclick="likePost('${key}', this)">❤️ ${likes}</div>
    `;
    wall.appendChild(card);

    // добавляем кнопку удаления только для тебя
    addDeleteButton(card, key);
});
