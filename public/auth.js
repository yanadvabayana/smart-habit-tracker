import * as UI from './ui.js';
import * as DataLoader from './dataLoader.js';
import * as Utils from './utils.js';
import { state } from './state.js';
import { API_URL } from './config.js';

export async function registerUser(name, email, password) {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            App.state.currentUser = data.user;
            Utils.showNotification('Успешно', 'Аккаунт успешно создан!');
            UI.showApp();
        } else {
            Utils.showNotification('Ошибка', data.error || 'Ошибка регистрации', 'error');
        }
    } catch (error) {
        Utils.showNotification('Ошибка', 'Сервер недоступен', 'error');
    }
}

export async function loginUser(email, password) {
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
            await DataLoader.loadUserData();
            UI.showApp();
            Utils.showNotification('Добро пожаловать!', `Рады снова видеть вас, ${App.state.currentUser.name}`);
        } else {
            Utils.showNotification('Ошибка', data.error || 'Неверный email или пароль', 'error');
        }
    } catch (error) {
        Utils.showNotification('Ошибка', 'Сервер недоступен', 'error');
    }
}

export function logoutUser() {
    localStorage.removeItem('currentUser');
    App.state.currentUser = null;
    App.state.habits = [];
    UI.showAuth();
}