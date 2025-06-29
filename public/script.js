const API_URL = 'http://localhost:3001/api';

let currentUser = null;
let habits = [];
let activeSection = 'all';
let achievements = [];
let reminders = [];

// DOM элементы
const authScreen = document.getElementById('auth-screen');
const appContainer = document.getElementById('app-container');
const appHeader = document.getElementById('app-header');
const appContent = document.getElementById('app-content');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authTabs = document.querySelectorAll('.auth-tab');
const logoutBtn = document.getElementById('logout-btn');
const addHabitBtn = document.getElementById('add-habit-btn');
const cancelAddBtn = document.getElementById('cancel-add-btn');
const saveHabitBtn = document.getElementById('save-habit-btn');
const habitsSection = document.getElementById('habits-section');
const addHabitForm = document.getElementById('add-habit-form');
const habitsContainer = document.getElementById('habits-container');
const notification = document.getElementById('notification');
const filterOptions = document.querySelectorAll('.filter-option');
const userName = document.getElementById('user-name');
const userAvatar = document.getElementById('user-avatar');
const chatToggle = document.getElementById('chat-toggle');
const chatContainer = document.getElementById('chat-bot-container');
const closeChat = document.getElementById('close-chat');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, есть ли сохраненный пользователь
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            loadUserData();
            showApp();
        } catch (e) {
            console.error("Ошибка при загрузке пользователя", e);
            localStorage.removeItem('currentUser');
            showAuth();
        }
    } else {
        showAuth();
    }

    setupEventListeners();
    initChat();
});


function loadUserData() {
    loadUserHabits();
    loadAchievements();
    loadReminders();
}

// Настройка обработчиков событий
function setupEventListeners() {
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (tab.dataset.tab === 'login') {
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
            } else {
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
            }
        });
    });

    // Форма входа
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        loginUser(email, password);
    });

    // Форма регистрации
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;

        if (password !== confirm) {
            showNotification('Ошибка', 'Пароли не совпадают', 'error');
            return;
        }

        if (password.length < 6) {
            showNotification('Ошибка', 'Пароль должен содержать не менее 6 символов', 'error');
            return;
        }

        registerUser(name, email, password);
    });

    // Выход из системы
    logoutBtn.addEventListener('click', logoutUser);

    // Управление привычками
    addHabitBtn.addEventListener('click', () => {
        habitsSection.style.display = 'none';
        addHabitForm.style.display = 'block';
    });

    cancelAddBtn.addEventListener('click', () => {
        addHabitForm.style.display = 'none';
        habitsSection.style.display = 'block';
    });

    saveHabitBtn.addEventListener('click', addNewHabit);

    // Фильтрация привычек
    filterOptions.forEach(option => {
        option.addEventListener('click', () => {
            filterOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            activeSection = option.dataset.section;
            renderHabits();
        });
    });


}

// Инициализация чата
function initChat() {
    chatToggle.addEventListener('click', () => {
        chatContainer.classList.toggle('open');
    });

    closeChat.addEventListener('click', () => {
        chatContainer.classList.remove('open');
    });

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    setTimeout(() => {
        addBotMessage("Привет! Я твой помощник по формированию привычек. Могу помочь советом, поддержать или просто поболтать. Что тебя интересует?");
    }, 1000);
}

// Регистрация пользователя
async function registerUser(name, email, password) {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            showNotification('Успешно', 'Аккаунт успешно создан!');
            showApp();
        } else {
            showNotification('Ошибка', data.error || 'Ошибка регистрации', 'error');
        }
    } catch (error) {
        showNotification('Ошибка', 'Сервер недоступен', 'error');
    }
}


// Авторизация пользователя
async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentUser = data.user;
      

      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      
      await loadUserData();
      showApp();
      showNotification('Добро пожаловать!', `Рады снова видеть вас, ${currentUser.name}`);
    } else {

      showNotification('Ошибка', data.error || 'Неверный email или пароль', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showNotification('Ошибка', 'Сервер недоступен', 'error');
  }
}


function logoutUser() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    habits = [];
    showAuth();
}


async function loadUserHabits() {
  if (!currentUser) return;
  
  try {
    const response = await fetch(`${API_URL}/habits/${currentUser.id}`);
    habits = await response.json();
    renderHabits();
    updateStats();
    renderProgressChart();
  } catch (error) {
    console.error('Ошибка загрузки привычек:', error);
    habits = [];
  }
}


function loadAchievements() {
    if (!currentUser) return;

    const userAchievements = localStorage.getItem(`achievements_${currentUser.id}`);
    achievements = userAchievements ? JSON.parse(userAchievements) : [];
    renderAchievements();
}


function loadReminders() {
    if (!currentUser) return;

    const userReminders = localStorage.getItem(`reminders_${currentUser.id}`);
    reminders = userReminders ? JSON.parse(userReminders) : [];
}

async function saveUserHabits() {
  if (!currentUser) return;
  
  try {
    const habitsWithUserId = habits.map(habit => ({
      ...habit,
      userId: currentUser.id
    }));

    await fetch(`${API_URL}/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habitsWithUserId)
    });
    
    updateStats();
    renderProgressChart();
    checkAchievements();
  } catch (error) {
    console.error('Ошибка сохранения привычек:', error);
    showNotification('Ошибка', 'Не удалось сохранить привычки', 'error');
  }
}


function saveAchievements() {
    if (!currentUser) return;
    localStorage.setItem(`achievements_${currentUser.id}`, JSON.stringify(achievements));
    renderAchievements();
}


function saveReminders() {
    if (!currentUser) return;
    localStorage.setItem(`reminders_${currentUser.id}`, JSON.stringify(reminders));
}

function showAuth() {
    authScreen.style.display = 'block';
    appContainer.style.display = 'none';

 
    authTabs.forEach(t => t.classList.remove('active'));
    authTabs[0].classList.add('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';

    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-name').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('register-confirm').value = '';
}


function showApp() {
    if (!currentUser) return;

    authScreen.style.display = 'none';
    appContainer.style.display = 'block';


    userName.textContent = currentUser.name;
    userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();

    habitsSection.style.display = 'block';
    addHabitForm.style.display = 'none';

    loadUserData();
}

function addNewHabit() {
    const name = document.getElementById('habit-name').value.trim();
    if (!name) {
        showNotification('Ошибка', 'Введите название привычки', 'error');
        return;
    }

    const newHabit = {
        id: Date.now().toString(),
        name: name,
        category: document.getElementById('habit-category').value,
        frequency: document.getElementById('habit-frequency').value,
        reminder: document.getElementById('habit-reminder').value,
        motivation: document.getElementById('habit-motivation').value,
        completedDates: [],
        active: true,
        archived: false,
        createdAt: new Date().toISOString()
    };

    habits.push(newHabit);
    saveUserHabits();


    if (newHabit.reminder) {
        reminders.push({
            habitId: newHabit.id,
            time: newHabit.reminder,
            enabled: true
        });
        saveReminders();
        showNotification('Напоминание', `Напоминание для "${name}" установлено на ${newHabit.reminder}`);
    }


    document.getElementById('habit-name').value = '';
    document.getElementById('habit-motivation').value = '';
    document.getElementById('habit-reminder').value = '';


    addHabitForm.style.display = 'none';
    habitsSection.style.display = 'block';

    showNotification('Привычка добавлена!', `Вы добавили привычку "${name}"`);
}


function renderHabits() {
    if (!habitsContainer) return;
    habitsContainer.innerHTML = '';

    if (habits.length === 0) {
        habitsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <h3>Пока нет привычек</h3>
                        <p>Начните добавлять привычки, которые хотите развивать. Маленькие шаги приводят к большим изменениям!</p>
                        <button class="btn btn-primary" id="start-add-btn">
                            <i class="fas fa-plus"></i> Добавить первую привычку
                        </button>
                    </div>
                `;

        document.getElementById('start-add-btn')?.addEventListener('click', () => {
            habitsSection.style.display = 'none';
            addHabitForm.style.display = 'block';
        });

        return;
    }


    let filteredHabits = habits;

    switch (activeSection) {
        case 'active':
            filteredHabits = habits.filter(h => h.active && !h.archived);
            break;
        case 'completed':
            const today = new Date().toISOString().split('T')[0];
            filteredHabits = habits.filter(h => h.completedDates.includes(today));
            break;
        case 'archive':
            filteredHabits = habits.filter(h => h.archived);
            break;
        default:
            filteredHabits = habits.filter(h => !h.archived);
    }

    if (filteredHabits.length === 0) {
        habitsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <h3>Нет привычек в этом разделе</h3>
                        <p>${activeSection === 'archive' ?
                'У вас нет привычек в архиве' :
                'У вас нет активных привычек в этом разделе'}</p>
                    </div>
                `;
        return;
    }


    filteredHabits.forEach((habit, index) => {
        const today = new Date().toISOString().split('T')[0];
        const habitCard = document.createElement('div');
        habitCard.className = 'habit-card fade-in';
        habitCard.style.animationDelay = `${index * 0.1}s`;

        let categoryIcon = 'fas fa-heart';
        let categoryColor = '#4361ee';

        switch (habit.category) {
            case 'sport':
                categoryIcon = 'fas fa-running';
                categoryColor = '#4cc9f0';
                break;
            case 'study':
                categoryIcon = 'fas fa-book';
                categoryColor = '#7209b7';
                break;
            case 'work':
                categoryIcon = 'fas fa-briefcase';
                categoryColor = '#f8961e';
                break;
            case 'personal':
                categoryIcon = 'fas fa-brain';
                categoryColor = '#3a0ca3';
                break;
        }


        let calendarHTML = '';
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = dateStr === today;

            const isChecked = habit.completedDates.includes(dateStr);

            calendarHTML += `
                        <div class="day ${isChecked ? 'checked' : ''} ${isToday ? 'today' : ''}" 
                             data-date="${dateStr}" 
                             data-habit-id="${habit.id}"
                             title="${formatDate(date)}">
                            ${date.getDate()}
                        </div>
                    `;
        }


        const completedCount = habit.completedDates.length;
        const completionRate = Math.round((completedCount / 30) * 100);


        let currentStreak = 0;
        const todayDate = new Date();
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(todayDate);
            checkDate.setDate(todayDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];

            if (habit.completedDates.includes(dateStr)) {
                currentStreak++;
            } else {
                break;
            }
        }

        habitCard.innerHTML = `
                    <div class="habit-header">
                        <div class="habit-title">
                            <i class="${categoryIcon}" style="color: ${categoryColor};"></i>
                            ${habit.name}
                            ${habit.archived ? '<span class="archive-badge">Архив</span>' : ''}
                        </div>
                        <div class="habit-actions">
                            ${habit.archived ? `
                                <div class="action-btn restore-btn" data-id="${habit.id}" title="Восстановить">
                                    <i class="fas fa-undo"></i>
                                </div>
                            ` : `
                                <div class="action-btn archive-btn" data-id="${habit.id}" title="В архив">
                                    <i class="fas fa-archive"></i>
                                </div>
                            `}
                            <div class="action-btn delete-btn" data-id="${habit.id}" title="Удалить">
                                <i class="fas fa-trash"></i>
                            </div>
                        </div>
                    </div>
                    <div class="habit-content">
                        <div class="calendar">
                            ${calendarHTML}
                        </div>
                        
                        <div class="streak-container">
                            <i class="fas fa-fire streak-icon"></i>
                            <div>
                                <span class="streak-count">${currentStreak}</span> 
                                <span class="streak-label">дней подряд</span>
                            </div>
                        </div>
                        
                        <div class="progress-container">
                            <div class="progress-header">
                                <span>Прогресс за месяц</span>
                                <span>${completedCount}/30 дней</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${completionRate}%"></div>
                            </div>
                        </div>
                        
                        ${habit.motivation ? `
                            <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 10px;">
                                <strong>Мотивация:</strong> ${habit.motivation}
                            </div>
                        ` : ''}
                    </div>
                `;

        habitsContainer.appendChild(habitCard);
    });

    addHabitEventListeners();
}


function addHabitEventListeners() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            deleteHabit(id);
        });
    });


    document.querySelectorAll('.archive-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            archiveHabit(id);
        });
    });


    document.querySelectorAll('.restore-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            restoreHabit(id);
        });
    });

    document.querySelectorAll('.day').forEach(day => {
        day.addEventListener('click', (e) => {
            const date = e.target.dataset.date;
            const habitId = e.target.dataset.habitId;
            toggleHabitDate(habitId, date);
        });
    });
}


function formatDate(date) {
    return date.toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
}


function deleteHabit(id) {
    if (confirm('Удалить эту привычку?')) {
        habits = habits.filter(habit => habit.id !== id);
        saveUserHabits();
        renderHabits();
        showNotification('Привычка удалена', 'Привычка была успешно удалена');
    }
}


function archiveHabit(id) {
    const habit = habits.find(h => h.id === id);
    if (habit) {
        habit.archived = true;
        habit.active = false;
        saveUserHabits();
        renderHabits();
        showNotification('Привычка архивирована', 'Вы можете восстановить её из архива');
    }
}


function restoreHabit(id) {
    const habit = habits.find(h => h.id === id);
    if (habit) {
        habit.archived = false;
        habit.active = true;
        saveUserHabits();
        renderHabits();
        showNotification('Привычка восстановлена', 'Привычка снова активна');
    }
}


function toggleHabitDate(habitId, date) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || habit.archived) return;

    const dateIndex = habit.completedDates.indexOf(date);

    if (dateIndex === -1) {
        habit.completedDates.push(date);
        showNotification('Отличная работа!', `Привычка "${habit.name}" отмечена на ${formatDate(new Date(date))}`);
    } else {
        habit.completedDates.splice(dateIndex, 1);
    }

    saveUserHabits();
    renderHabits();
}


function updateStats() {
    if (!currentUser) return;

    const activeHabits = habits.filter(h => !h.archived);
    document.getElementById('total-habits').textContent = activeHabits.length;

    let totalChecks = 0;
    habits.forEach(habit => {
        totalChecks += habit.completedDates.length;
    });

    const totalPossible = habits.length * 30;
    const completionRate = totalPossible > 0
        ? Math.round((totalChecks / totalPossible) * 100)
        : 0;

    document.getElementById('completion-rate').textContent = `${completionRate}%`;


    let longestStreak = 0;
    habits.forEach(habit => {
        let currentStreak = 0;
        const todayDate = new Date();

        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(todayDate);
            checkDate.setDate(todayDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];

            if (habit.completedDates.includes(dateStr)) {
                currentStreak++;
            } else {
                if (currentStreak > longestStreak) {
                    longestStreak = currentStreak;
                }
                currentStreak = 0;
            }
        }

        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }
    });

    document.getElementById('streak-count').textContent = longestStreak;
    document.getElementById('current-streak').textContent = longestStreak;

    // Обновление еженедельного прогресса
    const weeklyCompleted = habits.reduce((count, habit) => {
        // Считаем выполнение за последние 7 дней
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            if (habit.completedDates.includes(dateStr)) {
                count++;
                break;
            }
        }
        return count;
    }, 0);

    const weeklyGoal = 5;
    const weeklyProgress = Math.min(weeklyCompleted, weeklyGoal);
    document.getElementById('weekly-progress').textContent = `${weeklyProgress}/${weeklyGoal} дней`;
    document.getElementById('weekly-bar').style.width = `${(weeklyProgress / weeklyGoal) * 100}%`;
}

// Проверка достижений
function checkAchievements() {
    if (habits.length > 0 && !achievements.includes('first_habit')) {
        achievements.push('first_habit');
        showNotification('Достижение!', 'Первая привычка добавлена', 'success');
        saveAchievements();
    }


    let weekStreak = 0;
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const hasCompleted = habits.some(habit =>
            habit.completedDates.includes(dateStr)
        );

        if (hasCompleted) {
            weekStreak++;
        } else {
            break;
        }
    }

    if (weekStreak >= 7 && !achievements.includes('week_streak')) {
        achievements.push('week_streak');
        showNotification('Достижение!', 'Неделя подряд выполнения привычек', 'success');
        saveAchievements();
    }

    if (habits.length >= 5 && !achievements.includes('month_activity')) {
        achievements.push('month_activity');
        showNotification('Достижение!', '5 активных привычек в месяц', 'success');
        saveAchievements();
    }
}

// Отображение достижений
function renderAchievements() {
    const container = document.getElementById('achievements-container');
    if (!container) return;
    container.innerHTML = '';

    const achievementData = [
        { id: 'first_habit', title: 'Первая привычка', icon: 'fas fa-star', class: 'badge-gold' },
        { id: 'week_streak', title: 'Неделя подряд', icon: 'fas fa-fire', class: 'badge-silver' },
        { id: 'month_activity', title: 'Месяц активности', icon: 'fas fa-calendar', class: 'badge-bronze' }
    ];

    achievementData.forEach(ach => {
        if (achievements.includes(ach.id)) {
            const el = document.createElement('div');
            el.className = 'filter-option';
            el.innerHTML = `
                        <i class="${ach.icon}" style="color: gold"></i>
                        <span class="${ach.class}">${ach.title}</span>
                    `;
            container.appendChild(el);
        }
    });
}

// Отображение графика прогресса
function renderProgressChart() {
    const container = document.getElementById('progress-chart');
    if (!container) return;
    container.innerHTML = '';


    const data = [];
    const labels = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        let count = 0;
        habits.forEach(habit => {
            if (habit.completedDates.includes(dateStr)) {
                count++;
            }
        });

        data.push(count);
        labels.push(date.toLocaleDateString('ru-RU', { weekday: 'short' }));
    }


    const maxValue = Math.max(...data, 5);
    const chartHeight = 150;

    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * (chartHeight - 30);
        const bar = document.createElement('div');
        bar.className = 'chart-bar-item';
        bar.style.height = `${barHeight}px`;
        bar.innerHTML = `<div class="chart-bar-label">${labels[index]}</div>`;
        container.appendChild(bar);
    });
}


// Показать уведомление
function showNotification(title, message, type = 'success') {
    const icon = notification.querySelector('.notification-icon');
    const content = notification.querySelector('.notification-content');


    content.innerHTML = `<h4>${title}</h4><p>${message}</p>`;


    icon.className = 'notification-icon ' +
        (type === 'success' ? 'notification-success' : 'notification-error');
    icon.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check' : 'fa-exclamation'}"></i>`;

    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Отправка сообщения
function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addUserMessage(message);
    userInput.value = '';

    // Имитация задержки ответа
    setTimeout(() => {
        const response = generateResponse(message);
        addBotMessage(response);
    }, 500);
}

// Добавление сообщения пользователя
function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'user-message');
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Добавление сообщения бота
function addBotMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'bot-message');
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Генерация ответов 
function generateResponse(message) {
    const lowerMsg = message.toLowerCase();

    // Приветствия
    if (lowerMsg.includes('привет') || lowerMsg.includes('здравств') || lowerMsg.includes('добр')) {
        return "Привет! Как твои дела? Какие привычки сегодня планируешь?";
    }

    // Помощь
    if (lowerMsg.includes('помоги') || lowerMsg.includes('совет') || lowerMsg.includes('как')) {
        return getHabitAdvice(lowerMsg);
    }

    // Прогресс
    if (lowerMsg.includes('прогресс') || lowerMsg.includes('статистика') || lowerMsg.includes('серия')) {
        return getProgressSummary();
    }

    // Мотивация
    if (lowerMsg.includes('мотивац') || lowerMsg.includes('устал') || lowerMsg.includes('лень') ||
        lowerMsg.includes('не хочу') || lowerMsg.includes('не могу')) {
        return getMotivation();
    }

    // Благодарность
    if (lowerMsg.includes('спасибо') || lowerMsg.includes('благодар')) {
        return "Пожалуйста! Всегда рад помочь. Ты делаешь отличную работу!";
    }

    // Прощание
    if (lowerMsg.includes('пока') || lowerMsg.includes('до свидан') || lowerMsg.includes('выход')) {
        return "До скорой встречи! Помни, маленькие шаги каждый день приводят к большим результатам.";
    }

    // Общие вопросы
    return getGeneralResponse();
}

// Советы по привычкам
function getHabitAdvice(message) {
    const adviceList = [
        "Начни с малого - 5-10 минут в день достаточно для новой привычки.",
        "Свяжи новую привычку с существующей рутиной для лучшего запоминания.",
        "Отслеживай прогресс в приложении - визуализация помогает сохранять мотивацию.",
        "Не ругай себя за пропущенные дни. Важнее последовательность в долгосрочной перспективе.",
        "Попробуй технику 'не разрывать цепь' - отмечай выполнение каждый день в календаре.",
        "Найди партнера для подотчетности - это увеличивает шансы на успех на 95%.",
        "Фокусируйся на процессе, а не на результате. Маленькие ежедневные действия важнее."
    ];

    // Конкретные советы
    if (message.includes('просн')) {
        return "Для утреннего пробуждения: 1) Не ставь будильник на повтор 2) Выпей стакан воды 3) Сделай легкую разминку";
    }

    if (message.includes('спорт') || message.includes('трен')) {
        return "Советы для тренировок: начни с 2-3 раз в неделю по 20 минут, используй приложения с готовыми программами, найди вид активности, который тебе нравится.";
    }

    if (message.includes('чита') || message.includes('книг')) {
        return "Чтение книг: выдели 15 минут перед сном, носи книгу всегда с собой, выбирай увлекательные произведения, веди список прочитанного.";
    }

    return adviceList[Math.floor(Math.random() * adviceList.length)];
}

// Мотивационные сообщения
function getMotivation() {
    const motivations = [
        "Ты можешь больше, чем думаешь! Один пропущенный день - не повод сдаваться.",
        "Помни, почему ты начал. Твоя цель стоит этих усилий!",
        "Успех - это сумма небольших усилий, повторяемых изо дня в день.",
        "Сегодняшний ты лучше вчерашнего, а завтрашний будет лучше сегодняшнего!",
        "Трудности временны, а результаты останутся с тобой навсегда. Продолжай!",
        "Каждый раз, когда ты делаешь это, ты становишься на шаг ближе к лучшей версии себя."
    ];
    return motivations[Math.floor(Math.random() * motivations.length)];
}

// Обобщение прогресса
function getProgressSummary() {
    if (habits.length === 0) {
        return "У тебя пока нет активных привычек. Давай добавим первую?";
    }

    const activeHabits = habits.filter(h => !h.archived);
    const completedToday = habits.reduce((count, habit) => {
        const today = new Date().toISOString().split('T')[0];
        return habit.completedDates.includes(today) ? count + 1 : count;
    }, 0);

    return `У тебя ${activeHabits.length} активных привычек. 
Сегодня выполнено: ${completedToday}/${activeHabits.length}. 
Продолжай в том же духе!`;
}

// Общие ответы
function getGeneralResponse() {
    const responses = [
        "Интересно! Расскажи больше о своих целях.",
        "Как я могу помочь тебе с твоими привычками?",
        "Помни, что последовательность важнее интенсивности.",
        "Какая привычка для тебя самая важная прямо сейчас?",
        "Какой маленький шаг ты можешь сделать сегодня?",
        "Отличный вопрос! Главное - начать и сохранять регулярность."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}