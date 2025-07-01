// === Глобальный объект приложения ===
const App = {
    // === Константы и DOM элементы ===
    API_URL: 'http://localhost:3001/api',
    
    elements: {
        authScreen: document.getElementById('auth-screen'),
        appContainer: document.getElementById('app-container'),
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        authTabs: document.querySelectorAll('.auth-tab'),
        logoutBtn: document.getElementById('logout-btn'),
        addHabitBtn: document.getElementById('add-habit-btn'),
        cancelAddBtn: document.getElementById('cancel-add-btn'),
        saveHabitBtn: document.getElementById('save-habit-btn'),
        habitsSection: document.getElementById('habits-section'),
        addHabitForm: document.getElementById('add-habit-form'),
        habitsContainer: document.getElementById('habits-container'),
        notification: document.getElementById('notification'),
        filterOptions: document.querySelectorAll('.filter-option'),
        userName: document.getElementById('user-name'),
        userAvatar: document.getElementById('user-avatar'),
        chatToggle: document.getElementById('chat-toggle'),
        chatContainer: document.getElementById('chat-bot-container'),
        closeChat: document.getElementById('close-chat'),
        chatMessages: document.getElementById('chat-messages'),
        userInput: document.getElementById('user-input'),
        sendBtn: document.getElementById('send-btn'),
        totalHabits: document.getElementById('total-habits'),
        streakCount: document.getElementById('streak-count'),
        completionRate: document.getElementById('completion-rate'),
        weeklyProgress: document.getElementById('weekly-progress'),
        weeklyBar: document.getElementById('weekly-bar'),
        currentStreak: document.getElementById('current-streak'),
        achievementsContainer: document.getElementById('achievements-container'),
        progressChart: document.getElementById('progress-chart')
    },

    // === Состояние приложения ===
    state: {
        currentUser: null,
        habits: [],
        activeSection: 'all',
        achievements: [],
        reminders: []
    },

    // === Утилиты ===
    utils: {
        formatDate: function(date) {
            return date.toLocaleDateString('ru-RU', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
        },

        showNotification: function(title, message, type = 'success') {
            const icon = App.elements.notification.querySelector('.notification-icon');
            const content = App.elements.notification.querySelector('.notification-content');
            
            content.innerHTML = `<h4>${title}</h4><p>${message}</p>`;
            
            icon.className = 'notification-icon ' + 
                (type === 'success' ? 'notification-success' : 'notification-error');
            icon.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check' : 'fa-exclamation'}"></i>`;
            
            App.elements.notification.classList.add('show');
            
            setTimeout(() => {
                App.elements.notification.classList.remove('show');
            }, 3000);
        }
    },

    // === Аутентификация ===
    auth: {
        registerUser: async function(name, email, password) {
            try {
                const response = await fetch(`${App.API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    App.state.currentUser = data.user;
                    App.utils.showNotification('Успешно', 'Аккаунт успешно создан!');
                    App.ui.showApp();
                } else {
                    App.utils.showNotification('Ошибка', data.error || 'Ошибка регистрации', 'error');
                }
            } catch (error) {
                App.utils.showNotification('Ошибка', 'Сервер недоступен', 'error');
            }
        },

        loginUser: async function(email, password) {
            try {
                const response = await fetch(`${App.API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    App.state.currentUser = data.user;
                    localStorage.setItem('currentUser', JSON.stringify(App.state.currentUser));
                    await App.dataLoader.loadUserData();
                    App.ui.showApp();
                    App.utils.showNotification('Добро пожаловать!', `Рады снова видеть вас, ${App.state.currentUser.name}`);
                } else {
                    App.utils.showNotification('Ошибка', data.error || 'Неверный email или пароль', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                App.utils.showNotification('Ошибка', 'Сервер недоступен', 'error');
            }
        },

        logoutUser: function() {
            localStorage.removeItem('currentUser');
            App.state.currentUser = null;
            App.state.habits = [];
            App.ui.showAuth();
        }
    },

    // === Работа с данными ===
    dataLoader: {
        loadUserData: function() {
            this.loadUserHabits();
            this.loadAchievements();
            this.loadReminders();
        },

        loadUserHabits: async function() {
            if (!App.state.currentUser) return;
            
            try {
                const response = await fetch(`${App.API_URL}/habits/${App.state.currentUser.id}`);
                App.state.habits = await response.json();
                App.ui.renderHabits();
                App.stats.updateStats();
                App.ui.renderProgressChart();
            } catch (error) {
                console.error('Ошибка загрузки привычек:', error);
                App.state.habits = [];
            }
        },

        loadAchievements: function() {
            if (!App.state.currentUser) return;
            const userAchievements = localStorage.getItem(`achievements_${App.state.currentUser.id}`);
            App.state.achievements = userAchievements ? JSON.parse(userAchievements) : [];
            App.ui.renderAchievements();
        },

        loadReminders: function() {
            if (!App.state.currentUser) return;
            const userReminders = localStorage.getItem(`reminders_${App.state.currentUser.id}`);
            App.state.reminders = userReminders ? JSON.parse(userReminders) : [];
        },

        saveUserHabits: async function() {
            if (!App.state.currentUser) return;
            
            try {
                const habitsWithUserId = App.state.habits.map(habit => ({
                    ...habit,
                    userId: App.state.currentUser.id
                }));

                await fetch(`${App.API_URL}/habits`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(habitsWithUserId)
                });
                
                App.stats.updateStats();
                App.ui.renderProgressChart();
                App.achievements.checkAchievements();
            } catch (error) {
                console.error('Ошибка сохранения привычек:', error);
                App.utils.showNotification('Ошибка', 'Не удалось сохранить привычки', 'error');
            }
        },

        saveAchievements: function() {
            if (!App.state.currentUser) return;
            localStorage.setItem(`achievements_${App.state.currentUser.id}`, JSON.stringify(App.state.achievements));
            App.ui.renderAchievements();
        },

        saveReminders: function() {
            if (!App.state.currentUser) return;
            localStorage.setItem(`reminders_${App.state.currentUser.id}`, JSON.stringify(App.state.reminders));
        }
    },

    // === Управление привычками ===
    habitsManager: {
        addNewHabit: function() {
            const name = document.getElementById('habit-name').value.trim();
            if (!name) {
                App.utils.showNotification('Ошибка', 'Введите название привычки', 'error');
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

            App.state.habits.push(newHabit);
            App.dataLoader.saveUserHabits();

            if (newHabit.reminder) {
                App.state.reminders.push({
                    habitId: newHabit.id,
                    time: newHabit.reminder,
                    enabled: true
                });
                App.dataLoader.saveReminders();
                App.utils.showNotification('Напоминание', `Напоминание для "${name}" установлено на ${newHabit.reminder}`);
            }

            document.getElementById('habit-name').value = '';
            document.getElementById('habit-motivation').value = '';
            document.getElementById('habit-reminder').value = '';

            App.elements.addHabitForm.style.display = 'none';
            App.elements.habitsSection.style.display = 'block';

            App.utils.showNotification('Привычка добавлена!', `Вы добавили привычку "${name}"`);
        },

        deleteHabit: function(id) {
            if (confirm('Удалить эту привычку?')) {
                App.state.habits = App.state.habits.filter(habit => habit.id !== id);
                App.dataLoader.saveUserHabits();
                App.ui.renderHabits();
                App.utils.showNotification('Привычка удалена', 'Привычка была успешно удалена');
            }
        },

        archiveHabit: function(id) {
            const habit = App.state.habits.find(h => h.id === id);
            if (habit) {
                habit.archived = true;
                habit.active = false;
                App.dataLoader.saveUserHabits();
                App.ui.renderHabits();
                App.utils.showNotification('Привычка архивирована', 'Вы можете восстановить её из архива');
            }
        },

        restoreHabit: function(id) {
            const habit = App.state.habits.find(h => h.id === id);
            if (habit) {
                habit.archived = false;
                habit.active = true;
                App.dataLoader.saveUserHabits();
                App.ui.renderHabits();
                App.utils.showNotification('Привычка восстановлена', 'Привычка снова активна');
            }
        },

        toggleHabitDate: function(habitId, date) {
            const habit = App.state.habits.find(h => h.id === habitId);
            if (!habit || habit.archived) return;

            const dateIndex = habit.completedDates.indexOf(date);

            if (dateIndex === -1) {
                habit.completedDates.push(date);
                App.utils.showNotification('Отличная работа!', `Привычка "${habit.name}" отмечена на ${App.utils.formatDate(new Date(date))}`);
            } else {
                habit.completedDates.splice(dateIndex, 1);
            }

            App.dataLoader.saveUserHabits();
            App.ui.renderHabits();
        }
    },

    // === Статистика и аналитика ===
    stats: {
        updateStats: function() {
            if (!App.state.currentUser) return;

            const activeHabits = App.state.habits.filter(h => !h.archived);
            App.elements.totalHabits.textContent = activeHabits.length;

            let totalChecks = 0;
            App.state.habits.forEach(habit => {
                totalChecks += habit.completedDates.length;
            });

            const totalPossible = App.state.habits.length * 30;
            const completionRate = totalPossible > 0
                ? Math.round((totalChecks / totalPossible) * 100)
                : 0;

            App.elements.completionRate.textContent = `${completionRate}%`;

            let longestStreak = 0;
            App.state.habits.forEach(habit => {
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

            App.elements.streakCount.textContent = longestStreak;
            App.elements.currentStreak.textContent = longestStreak;

            // Еженедельный прогресс
            const weeklyCompleted = App.state.habits.reduce((count, habit) => {
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
            App.elements.weeklyProgress.textContent = `${weeklyProgress}/${weeklyGoal} дней`;
            App.elements.weeklyBar.style.width = `${(weeklyProgress / weeklyGoal) * 100}%`;
        }
    },

    // === Достижения ===
    achievements: {
        checkAchievements: function() {
            if (App.state.habits.length > 0 && !App.state.achievements.includes('first_habit')) {
                App.state.achievements.push('first_habit');
                App.utils.showNotification('Достижение!', 'Первая привычка добавлена', 'success');
                App.dataLoader.saveAchievements();
            }

            let weekStreak = 0;
            const today = new Date();
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                const hasCompleted = App.state.habits.some(habit =>
                    habit.completedDates.includes(dateStr)
                );

                if (hasCompleted) {
                    weekStreak++;
                } else {
                    break;
                }
            }

            if (weekStreak >= 7 && !App.state.achievements.includes('week_streak')) {
                App.state.achievements.push('week_streak');
                App.utils.showNotification('Достижение!', 'Неделя подряд выполнения привычек', 'success');
                App.dataLoader.saveAchievements();
            }

            if (App.state.habits.length >= 5 && !App.state.achievements.includes('month_activity')) {
                App.state.achievements.push('month_activity');
                App.utils.showNotification('Достижение!', '5 активных привычек в месяц', 'success');
                App.dataLoader.saveAchievements();
            }
        }
    },

    // === Чат-бот ===
    chat: {
        init: function() {
            App.elements.chatToggle.addEventListener('click', () => {
                App.elements.chatContainer.classList.toggle('open');
            });

            App.elements.closeChat.addEventListener('click', () => {
                App.elements.chatContainer.classList.remove('open');
            });

            App.elements.sendBtn.addEventListener('click', this.sendMessage);
            App.elements.userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });

            setTimeout(() => {
                this.addBotMessage("Привет! Я твой помощник по формированию привычек. Могу помочь советом, поддержать или просто поболтать. Что тебя интересует?");
            }, 1000);
        },

        sendMessage: function() {
            const message = App.elements.userInput.value.trim();
            if (!message) return;

            App.chat.addUserMessage(message);
            App.elements.userInput.value = '';

            setTimeout(() => {
                const response = App.chat.generateResponse(message);
                App.chat.addBotMessage(response);
            }, 500);
        },

        addUserMessage: function(text) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', 'user-message');
            messageDiv.textContent = text;
            App.elements.chatMessages.appendChild(messageDiv);
            App.elements.chatMessages.scrollTop = App.elements.chatMessages.scrollHeight;
        },

        addBotMessage: function(text) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', 'bot-message');
            messageDiv.textContent = text;
            App.elements.chatMessages.appendChild(messageDiv);
            App.elements.chatMessages.scrollTop = App.elements.chatMessages.scrollHeight;
        },

        generateResponse: function(message) {
            const lowerMsg = message.toLowerCase();

            if (lowerMsg.includes('привет') || lowerMsg.includes('здравств') || lowerMsg.includes('добр')) {
                return "Привет! Как твои дела? Какие привычки сегодня планируешь?";
            }

            if (lowerMsg.includes('помоги') || lowerMsg.includes('совет') || lowerMsg.includes('как')) {
                return this.getHabitAdvice(lowerMsg);
            }

            if (lowerMsg.includes('прогресс') || lowerMsg.includes('статистика') || lowerMsg.includes('серия')) {
                return this.getProgressSummary();
            }

            if (lowerMsg.includes('мотивац') || lowerMsg.includes('устал') || lowerMsg.includes('лень') ||
                lowerMsg.includes('не хочу') || lowerMsg.includes('не могу')) {
                return this.getMotivation();
            }

            if (lowerMsg.includes('спасибо') || lowerMsg.includes('благодар')) {
                return "Пожалуйста! Всегда рад помочь. Ты делаешь отличную работу!";
            }

            if (lowerMsg.includes('пока') || lowerMsg.includes('до свидан') || lowerMsg.includes('выход')) {
                return "До скорой встречи! Помни, маленькие шаги каждый день приводят к большим результатам.";
            }

            return this.getGeneralResponse();
        },

        getHabitAdvice: function(message) {
            const adviceList = [
                "Начни с малого - 5-10 минут в день достаточно для новой привычки.",
                "Свяжи новую привычку с существующей рутиной для лучшего запоминания.",
                "Отслеживай прогресс в приложении - визуализация помогает сохранять мотивацию.",
                "Не ругай себя за пропущенные дни. Важнее последовательность в долгосрочной перспективе.",
                "Попробуй технику 'не разрывать цепь' - отмечай выполнение каждый день в календаре.",
                "Найди партнера для подотчетности - это увеличивает шансы на успех на 95%.",
                "Фокусируйся на процессе, а не на результате. Маленькие ежедневные действия важнее."
            ];

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
        },

        getMotivation: function() {
            const motivations = [
                "Ты можешь больше, чем думаешь! Один пропущенный день - не повод сдаваться.",
                "Помни, почему ты начал. Твоя цель стоит этих усилий!",
                "Успех - это сумма небольших усилий, повторяемых изо дня в день.",
                "Сегодняшний ты лучше вчерашнего, а завтрашний будет лучше сегодняшнего!",
                "Трудности временны, а результаты останутся с тобой навсегда. Продолжай!",
                "Каждый раз, когда ты делаешь это, ты становишься на шаг ближе к лучшей версии себя."
            ];
            return motivations[Math.floor(Math.random() * motivations.length)];
        },

        getProgressSummary: function() {
            if (App.state.habits.length === 0) {
                return "У тебя пока нет активных привычек. Давай добавим первую?";
            }

            const activeHabits = App.state.habits.filter(h => !h.archived);
            const completedToday = App.state.habits.reduce((count, habit) => {
                const today = new Date().toISOString().split('T')[0];
                return habit.completedDates.includes(today) ? count + 1 : count;
            }, 0);

            return `У тебя ${activeHabits.length} активных привычек. 
Сегодня выполнено: ${completedToday}/${activeHabits.length}. 
Продолжай в том же духе!`;
        },

        getGeneralResponse: function() {
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
    },

    // === Пользовательский интерфейс ===
    ui: {
        showAuth: function() {
            App.elements.authScreen.style.display = 'block';
            App.elements.appContainer.style.display = 'none';

            App.elements.authTabs.forEach(t => t.classList.remove('active'));
            App.elements.authTabs[0].classList.add('active');
            App.elements.loginForm.style.display = 'block';
            App.elements.registerForm.style.display = 'none';

            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            document.getElementById('register-name').value = '';
            document.getElementById('register-email').value = '';
            document.getElementById('register-password').value = '';
            document.getElementById('register-confirm').value = '';
        },

        showApp: function() {
            if (!App.state.currentUser) return;

            App.elements.authScreen.style.display = 'none';
            App.elements.appContainer.style.display = 'block';

            App.elements.userName.textContent = App.state.currentUser.name;
            App.elements.userAvatar.textContent = App.state.currentUser.name.charAt(0).toUpperCase();

            App.elements.habitsSection.style.display = 'block';
            App.elements.addHabitForm.style.display = 'none';

            App.dataLoader.loadUserData();
        },

        renderHabits: function() {
            if (!App.elements.habitsContainer) return;
            App.elements.habitsContainer.innerHTML = '';

            if (App.state.habits.length === 0) {
                App.elements.habitsContainer.innerHTML = `
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
                    App.elements.habitsSection.style.display = 'none';
                    App.elements.addHabitForm.style.display = 'block';
                });
                return;
            }

            let filteredHabits = App.state.habits;
            switch (App.state.activeSection) {
                case 'active':
                    filteredHabits = App.state.habits.filter(h => h.active && !h.archived);
                    break;
                case 'completed':
                    const today = new Date().toISOString().split('T')[0];
                    filteredHabits = App.state.habits.filter(h => h.completedDates.includes(today));
                    break;
                case 'archive':
                    filteredHabits = App.state.habits.filter(h => h.archived);
                    break;
                default:
                    filteredHabits = App.state.habits.filter(h => !h.archived);
            }

            if (filteredHabits.length === 0) {
                App.elements.habitsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <h3>Нет привычек в этом разделе</h3>
                        <p>${App.state.activeSection === 'archive' ? 
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
                             title="${App.utils.formatDate(date)}">
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

                App.elements.habitsContainer.appendChild(habitCard);
            });

            this.addHabitEventListeners();
        },

        addHabitEventListeners: function() {
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    App.habitsManager.deleteHabit(id);
                });
            });

            document.querySelectorAll('.archive-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    App.habitsManager.archiveHabit(id);
                });
            });

            document.querySelectorAll('.restore-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    App.habitsManager.restoreHabit(id);
                });
            });

            document.querySelectorAll('.day').forEach(day => {
                day.addEventListener('click', (e) => {
                    const date = e.target.dataset.date;
                    const habitId = e.target.dataset.habitId;
                    App.habitsManager.toggleHabitDate(habitId, date);
                });
            });
        },

        renderAchievements: function() {
            if (!App.elements.achievementsContainer) return;
            App.elements.achievementsContainer.innerHTML = '';

            const achievementData = [
                { id: 'first_habit', title: 'Первая привычка', icon: 'fas fa-star', class: 'badge-gold' },
                { id: 'week_streak', title: 'Неделя подряд', icon: 'fas fa-fire', class: 'badge-silver' },
                { id: 'month_activity', title: 'Месяц активности', icon: 'fas fa-calendar', class: 'badge-bronze' }
            ];

            achievementData.forEach(ach => {
                if (App.state.achievements.includes(ach.id)) {
                    const el = document.createElement('div');
                    el.className = 'filter-option';
                    el.innerHTML = `
                        <i class="${ach.icon}" style="color: gold"></i>
                        <span class="${ach.class}">${ach.title}</span>
                    `;
                    App.elements.achievementsContainer.appendChild(el);
                }
            });
        },

        renderProgressChart: function() {
            if (!App.elements.progressChart) return;
            App.elements.progressChart.innerHTML = '';

            const data = [];
            const labels = [];
            const today = new Date();

            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                let count = 0;
                App.state.habits.forEach(habit => {
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
                App.elements.progressChart.appendChild(bar);
            });
        }
    },

    // === Обработчики событий ===
    eventHandlers: {
        setup: function() {
            App.elements.authTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    App.elements.authTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');

                    if (tab.dataset.tab === 'login') {
                        App.elements.loginForm.style.display = 'block';
                        App.elements.registerForm.style.display = 'none';
                    } else {
                        App.elements.loginForm.style.display = 'none';
                        App.elements.registerForm.style.display = 'block';
                    }
                });
            });

            // Форма входа
            App.elements.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                App.auth.loginUser(email, password);
            });

            // Форма регистрации
            App.elements.registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('register-name').value;
                const email = document.getElementById('register-email').value;
                const password = document.getElementById('register-password').value;
                const confirm = document.getElementById('register-confirm').value;

                if (password !== confirm) {
                    App.utils.showNotification('Ошибка', 'Пароли не совпадают', 'error');
                    return;
                }

                if (password.length < 6) {
                    App.utils.showNotification('Ошибка', 'Пароль должен содержать не менее 6 символов', 'error');
                    return;
                }

                App.auth.registerUser(name, email, password);
            });

            App.elements.logoutBtn.addEventListener('click', App.auth.logoutUser);

            App.elements.addHabitBtn.addEventListener('click', () => {
                App.elements.habitsSection.style.display = 'none';
                App.elements.addHabitForm.style.display = 'block';
            });

            App.elements.cancelAddBtn.addEventListener('click', () => {
                App.elements.addHabitForm.style.display = 'none';
                App.elements.habitsSection.style.display = 'block';
            });

            App.elements.saveHabitBtn.addEventListener('click', App.habitsManager.addNewHabit);

            // Фильтры
            App.elements.filterOptions.forEach(option => {
                option.addEventListener('click', () => {
                    App.elements.filterOptions.forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    App.state.activeSection = option.dataset.section;
                    App.ui.renderHabits();
                });
            });
        }
    },

    // ====================== Инициализация приложения ======================
    init: function() {
        // Загрузка пользователя
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                App.state.currentUser = JSON.parse(savedUser);
                App.dataLoader.loadUserData();
                App.ui.showApp();
            } catch (e) {
                console.error("Ошибка при загрузке пользователя", e);
                localStorage.removeItem('currentUser');
                App.ui.showAuth();
            }
        } else {
            App.ui.showAuth();
        }

     
        App.eventHandlers.setup();
        App.chat.init();
    }
};

document.addEventListener('DOMContentLoaded', App.init);