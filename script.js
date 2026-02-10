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

// TODO: Consider moving firebaseConfig out of source (or provide an env-based replacement)
//       These client-side keys are expected for browser apps but avoid committing secrets you
//       don't want public. `databaseURL` must match your Realtime DB instance.

// Пароль для удаления (клиентская проверка).
// TODO: Это небезопасно для публичного проекта — лучше реализовать удаление через
//       серверную валидацию или задать правила доступа в Realtime Database.
const DELETE_PASSWORD = "Аня Кокорина";


const nameInput = document.getElementById('name');
const directionInput = document.getElementById('direction');
const messageInput = document.getElementById('message');
const sendBtn = document.getElementById('sendBtn');
const wall = document.getElementById('wall');
const tabs = document.getElementById('tabs');
const tabsSelect = document.getElementById('tabsSelect');

// Контакт/админ элементы
const copyEmailBtn = document.getElementById('copyEmailBtn');
const reportBtn = document.getElementById('reportBtn');
const ADMIN_EMAIL = 'galetpy@gmail.com';

// current filter for direction tabs. 'Все' means no filter.
let currentFilter = 'Все';

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

// Минимальная реализация конфетти — чтобы убрать ошибку createConfetti() в консоли.
// Если нужен более красивый эффект, можно заменить на библиотеку или улучшить визуал.
function createConfetti() {
    // Улучшенная реализация: разноцветные квадратики/круги с различной скоростью и поворотом.
    const colors = ['#ff4d6d', '#ff7a9c', '#ffd1dc', '#fff3f6', '#ffd37a', '#fff38a'];
    const count = 28;
    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'confetti';
        // случайная стартовая позиция по ширине
        el.style.left = (Math.random() * window.innerWidth) + 'px';
        el.style.top = (-20 - Math.random() * 40) + 'px';
        const size = 6 + Math.random() * 10;
        el.style.width = size + 'px';
        el.style.height = size + 'px';
        el.style.background = colors[Math.floor(Math.random() * colors.length)];
        el.style.borderRadius = (Math.random() > 0.5 ? '50%' : '3px');
        el.style.zIndex = 60;
        el.style.pointerEvents = 'none';
        const duration = 1000 + Math.random() * 1800; // ms
        // random horizontal drift and rotation
        const drift = (Math.random() - 0.5) * 400;
        const endY = window.innerHeight + 80 + Math.random() * 120;
        const rotate = (Math.random() - 0.5) * 720;
        // use CSS transitions for smoother animation
        el.style.transition = `transform ${duration}ms cubic-bezier(.2,.7,.2,1), opacity ${duration}ms linear`;
        document.body.appendChild(el);
        // trigger animation
        requestAnimationFrame(() => {
            el.style.transform = `translate(${drift}px, ${endY}px) rotate(${rotate}deg)`;
            el.style.opacity = '0';
        });
        setTimeout(() => el.remove(), duration + 50);
    }
}


// ===== Отправка валентинки =====
sendBtn.addEventListener('click', () => {
    const name = nameInput.value || "Аноним";
    const message = messageInput.value.trim();
    const direction = (directionInput && directionInput.value.trim()) || 'Не указано';

    // Проверка на пустое сообщение
    if(message.length === 0) {
        alert("Введите сообщение!");
        return;
    }

    db.ref('valentines').push({
        name: name,
        message: message,
        direction: direction,
        likes: 0,
        timestamp: Date.now()
    });

    messageInput.value = "";
    if(directionInput) directionInput.value = '';
    showModal();
    createConfetti(); // implemented above
});

// ===== Получение валентинок и отображение =====
db.ref('valentines').on('value', snapshot => {
    const data = snapshot.val();
    // build map of direction -> count (normalize empty/undefined to 'Не указано')
    const dirCounts = new Map();
    let totalCount = 0;
    if (data) {
        Object.keys(data).forEach(k => {
            const d = (data[k].direction || '').trim() || 'Не указано';
            dirCounts.set(d, (dirCounts.get(d) || 0) + 1);
            totalCount++;
        });
    }
    // create sorted directions (alphabetical, ru). Keep 'Не указано' at the end.
    let directions = Array.from(dirCounts.keys()).sort((a,b) => a.localeCompare(b, 'ru'));
    const unspecifiedIndex = directions.indexOf('Не указано');
    if (unspecifiedIndex !== -1) {
        directions.splice(unspecifiedIndex, 1);
        directions.push('Не указано');
    }

    // render tabs
    function renderTabs() {
        if (!tabs) return;
        tabs.innerHTML = '';
        const allBtn = document.createElement('button');
        allBtn.className = 'tab' + (currentFilter === 'Все' ? ' active' : '');
        allBtn.innerText = `Все (${totalCount})`;
        allBtn.onclick = () => { currentFilter = 'Все'; renderPosts(); renderTabs(); };
        tabs.appendChild(allBtn);

        // add each direction with counts
        directions.forEach(dir => {
            const count = dirCounts.get(dir) || 0;
            const b = document.createElement('button');
            b.className = 'tab' + (currentFilter === dir ? ' active' : '');
            b.innerText = `${dir} (${count})`;
            b.onclick = () => { currentFilter = dir; renderPosts(); renderTabs(); };
            tabs.appendChild(b);
        });
        // populate mobile select if present
        if (tabsSelect) {
            tabsSelect.innerHTML = '';
            const optAll = document.createElement('option');
            optAll.value = 'Все';
            optAll.text = `Все (${totalCount})`;
            tabsSelect.appendChild(optAll);
            directions.forEach(dir => {
                const o = document.createElement('option');
                o.value = dir;
                o.text = `${dir} (${dirCounts.get(dir) || 0})`;
                tabsSelect.appendChild(o);
            });
            // ensure selected value exists
            if (currentFilter !== 'Все' && !dirCounts.has(currentFilter)) {
                currentFilter = 'Все';
            }
            tabsSelect.value = currentFilter;
            tabsSelect.onchange = () => {
                currentFilter = tabsSelect.value;
                renderPosts();
                renderTabs();
            };
        }
    }

    // render posts respecting currentFilter
    function renderPosts() {
        wall.innerHTML = '';
        if (!data) return;
        // if currentFilter is no longer present in directions, fallback to 'Все'
        if (currentFilter !== 'Все' && !dirCounts.has(currentFilter)) {
            currentFilter = 'Все';
        }
        Object.keys(data)
            .sort((a,b) => data[b].timestamp - data[a].timestamp)
            .forEach(key => {
                const item = data[key];
                const dir = (item.direction || '').trim() || 'Не указано';
                if (currentFilter !== 'Все' && dir !== currentFilter) return;

                const card = document.createElement('div');
                card.classList.add('card');

                // Header: name and direction
                const header = document.createElement('div');
                header.style.display = 'flex';
                header.style.justifyContent = 'space-between';
                header.style.alignItems = 'center';

                const nameEl = document.createElement('strong');
                nameEl.innerText = item.name;
                header.appendChild(nameEl);

                const dirEl = document.createElement('span');
                dirEl.classList.add('direction');
                dirEl.innerText = dir;
                header.appendChild(dirEl);

                card.appendChild(header);

                // Time
                const ts = item.timestamp || Date.now();
                const date = new Date(ts);
                const timeString = date.toLocaleString('ru-RU', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                });
                const timeEl = document.createElement('span');
                timeEl.classList.add('time');
                timeEl.innerText = timeString;
                card.appendChild(timeEl);

                // Message
                const msgEl = document.createElement('p');
                msgEl.innerText = item.message;
                card.appendChild(msgEl);

                // Likes
                const likes = item.likes || 0;
                const likeEl = document.createElement('div');
                likeEl.classList.add('like');
                likeEl.innerText = `❤️ ${likes}`;
                likeEl.onclick = () => likePost(key, likeEl);
                card.appendChild(likeEl);

                // Delete button
                const delBtn = document.createElement('button');
                delBtn.innerText = '❌';
                delBtn.style.marginTop = '5px';
                delBtn.style.cursor = 'pointer';
                delBtn.onclick = () => {
                    const password = prompt("Введите пароль для удаления:");
                    if(password === DELETE_PASSWORD) {
                        db.ref('valentines/' + key).remove();
                    } else {
                        alert("Неверный пароль!");
                    }
                };
                card.appendChild(delBtn);

                wall.appendChild(card);
            });
    }

    renderTabs();
    renderPosts();
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

// TODO: removed duplicated/stale rendering block that referenced undefined variables
//       If you need server-side rendering or an alternative render path, implement it
//       explicitly. Current live rendering is done in the `db.ref('valentines').on('value', ...)` listener above.

// Обработчики панели контактов
if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(ADMIN_EMAIL);
            alert('Email скопирован в буфер обмена: ' + ADMIN_EMAIL);
        } catch (e) {
            // fallback: показать prompt с email
            window.prompt('Скопируйте email администратора:', ADMIN_EMAIL);
        }
    });
}

if (reportBtn) {
    // Open modal instead of prompt
    const reportModal = document.getElementById('reportModal');
    const reportText = document.getElementById('reportText');
    const reportSubmitBtn = document.getElementById('reportSubmitBtn');
    const reportCancelBtn = document.getElementById('reportCancelBtn');

    function openReportModal() {
        if (!reportModal) return;
        reportModal.style.display = 'block';
        if (reportText) {
            reportText.value = '';
            reportText.focus();
        }
        // simple escape handler
        function onKey(e) {
            if (e.key === 'Escape') closeReportModal();
        }
        reportModal._onKey = onKey;
        document.addEventListener('keydown', onKey);
    }

    function closeReportModal() {
        if (!reportModal) return;
        reportModal.style.display = 'none';
        if (reportModal._onKey) {
            document.removeEventListener('keydown', reportModal._onKey);
            delete reportModal._onKey;
        }
    }

    reportBtn.addEventListener('click', openReportModal);

    if (reportCancelBtn) reportCancelBtn.addEventListener('click', closeReportModal);

    if (reportSubmitBtn) reportSubmitBtn.addEventListener('click', () => {
        const desc = (reportText && reportText.value.trim()) || '[не указано]';
        const subject = encodeURIComponent('Ошибка на сайте Валентинки Онлайн');
        const bodyParts = [];
        bodyParts.push('Описание: ' + desc);
        bodyParts.push('URL: ' + window.location.href);
        bodyParts.push('Время: ' + new Date().toLocaleString());
        bodyParts.push('UA: ' + navigator.userAgent);
        const body = encodeURIComponent(bodyParts.join('\n'));
        // open mail client
        window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
        closeReportModal();
    });
}
