import * as UI from './ui.js';
import * as Stats from './stats.js';
import * as Achievements from './achievements.js';
import * as Utils from './utils.js';
import { state } from './state.js';
import { API_URL } from './config.js';

export async function loadUserData() {
    loadUserHabits();
    loadAchievements();
    loadReminders();
}

export async function loadUserHabits() {
    if (!state.currentUser) return;
    
    try {
        const response = await fetch(`${API_URL}/habits/${state.currentUser.id}`);
        state.habits = await response.json();
        UI.renderHabits();
        Stats.updateStats();
        UI.renderProgressChart();
    } catch (error) {
        state.habits = [];
    }
}

export function loadAchievements() {
    if (!state.currentUser) return;
    const userAchievements = localStorage.getItem(`achievements_${state.currentUser.id}`);
    state.achievements = userAchievements ? JSON.parse(userAchievements) : [];
    UI.renderAchievements();
}

export function loadReminders() {
    if (!state.currentUser) return;
    const userReminders = localStorage.getItem(`reminders_${state.currentUser.id}`);
    state.reminders = userReminders ? JSON.parse(userReminders) : [];
}

export async function saveUserHabits() {
    if (!state.currentUser) return;
    
    try {
        const habitsWithUserId = state.habits.map(habit => ({
            ...habit,
            userId: state.currentUser.id
        }));

        await fetch(`${API_URL}/habits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(habitsWithUserId)
        });
        
        Stats.updateStats();
        UI.renderProgressChart();
        Achievements.checkAchievements();
    } catch (error) {
        Utils.showNotification('Ошибка', 'Не удалось сохранить привычки', 'error');
    }
}

export function saveAchievements() {
    if (!state.currentUser) return;
    localStorage.setItem(`achievements_${state.currentUser.id}`, JSON.stringify(state.achievements));
    UI.renderAchievements();
}

export function saveReminders() {
    if (!state.currentUser) return;
    localStorage.setItem(`reminders_${state.currentUser.id}`, JSON.stringify(state.reminders));
}