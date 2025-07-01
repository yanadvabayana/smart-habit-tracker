import * as Auth from './auth.js';
import * as UI from './ui.js';
import * as HabitsManager from './habitsManager.js';
import * as Utils from './utils.js';
import { state } from './state.js';

export function setup() {
    UI.elements.authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            UI.elements.authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (tab.dataset.tab === 'login') {
                UI.elements.loginForm.style.display = 'block';
                UI.elements.registerForm.style.display = 'none';
            } else {
                UI.elements.loginForm.style.display = 'none';
                UI.elements.registerForm.style.display = 'block';
            }
        });
    });

    // Форма входа
    UI.elements.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        Auth.loginUser(email, password);
    });

    // Форма регистрации
    UI.elements.registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;

        if (password !== confirm) {
            Utils.showNotification('Ошибка', 'Пароли не совпадают', 'error');
            return;
        }

        if (password.length < 6) {
            Utils.showNotification('Ошибка', 'Пароль должен содержать не менее 6 символов', 'error');
            return;
        }

        Auth.registerUser(name, email, password);
    });

    UI.elements.logoutBtn.addEventListener('click', Auth.logoutUser);

    UI.elements.addHabitBtn.addEventListener('click', () => {
        UI.elements.habitsSection.style.display = 'none';
        UI.elements.addHabitForm.style.display = 'block';
    });

    UI.elements.cancelAddBtn.addEventListener('click', () => {
        UI.elements.addHabitForm.style.display = 'none';
        UI.elements.habitsSection.style.display = 'block';
    });

    UI.elements.saveHabitBtn.addEventListener('click', HabitsManager.addNewHabit);

    // Фильтры
    UI.elements.filterOptions.forEach(option => {
        option.addEventListener('click', () => {
            UI.elements.filterOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            state.activeSection = option.dataset.section;
            UI.renderHabits();
        });
    });
}