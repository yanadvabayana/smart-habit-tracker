import * as HabitsManager from './habitsManager.js';
import * as DataLoader from './dataLoader.js';
import * as Stats from './stats.js';
import * as Utils from './utils.js';
import { state } from './state.js';

export const elements = {
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
};

export function showAuth() {
    elements.authScreen.style.display = 'block';
    elements.appContainer.style.display = 'none';

    elements.authTabs.forEach(t => t.classList.remove('active'));
    elements.authTabs[0].classList.add('active');
    elements.loginForm.style.display = 'block';
    elements.registerForm.style.display = 'none';

    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-name').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('register-confirm').value = '';
}

export function showApp() {
    if (!state.currentUser) return;

    elements.authScreen.style.display = 'none';
    elements.appContainer.style.display = 'block';

    elements.userName.textContent = state.currentUser.name;
    elements.userAvatar.textContent = state.currentUser.name.charAt(0).toUpperCase();

    elements.habitsSection.style.display = 'block';
    elements.addHabitForm.style.display = 'none';
}

export function renderHabits() {
    if (!elements.habitsContainer) return;
    elements.habitsContainer.innerHTML = '';

    if (state.habits.length === 0) {
        elements.habitsContainer.innerHTML = `
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
            elements.habitsSection.style.display = 'none';
            elements.addHabitForm.style.display = 'block';
        });
        return;
    }

    let filteredHabits = App.state.habits;
    switch (state.activeSection) {
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
        elements.habitsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>Нет привычек в этом разделе</h3>
                <p>${state.activeSection === 'archive' ? 
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
                     title="${Utils.formatDate(date)}">
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

        elements.habitsContainer.appendChild(habitCard);
    });

    addHabitEventListeners();
}

function addHabitEventListeners() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            HabitsManager.deleteHabit(id);
        });
    });

    document.querySelectorAll('.archive-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            HabitsManager.archiveHabit(id);
        });
    });

    document.querySelectorAll('.restore-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            HabitsManager.restoreHabit(id);
        });
    });

    document.querySelectorAll('.day').forEach(day => {
        day.addEventListener('click', (e) => {
            const date = e.target.dataset.date;
            const habitId = e.target.dataset.habitId;
            HabitsManager.toggleHabitDate(habitId, date);
        });
    });
}

export function renderAchievements() {
    if (!elements.achievementsContainer) return;
    elements.achievementsContainer.innerHTML = '';

    const achievementData = [
        { id: 'first_habit', title: 'Первая привычка', icon: 'fas fa-star', class: 'badge-gold' },
        { id: 'week_streak', title: 'Неделя подряд', icon: 'fas fa-fire', class: 'badge-silver' },
        { id: 'month_activity', title: 'Месяц активности', icon: 'fas fa-calendar', class: 'badge-bronze' }
    ];

    achievementData.forEach(ach => {
        if (state.achievements.includes(ach.id)) {
            const el = document.createElement('div');
            el.className = 'filter-option';
            el.innerHTML = `
                <i class="${ach.icon}" style="color: gold"></i>
                <span class="${ach.class}">${ach.title}</span>
            `;
            elements.achievementsContainer.appendChild(el);
        }
    });
}

export function renderProgressChart() {
    if (!elements.progressChart) return;
    elements.progressChart.innerHTML = '';

    const data = [];
    const labels = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        let count = 0;
        state.habits.forEach(habit => {
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
        elements.progressChart.appendChild(bar);
    });
}