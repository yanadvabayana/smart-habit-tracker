import * as UI from './ui.js';
import * as DataLoader from './dataLoader.js';
import * as EventHandlers from './eventHandlers.js';
import * as Chat from './chat.js';
import { state } from './state.js';
import { API_URL } from './config.js';
import * as Profile from './profile.js';

// Управление темой
function setupTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    function applyDarkTheme() {
        document.body.classList.add('dark-theme');
        if (themeToggle) {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i> <span class="theme-text">Светлая</span>';
        }
        localStorage.setItem('theme', 'dark');
    }

    function applyLightTheme() {
        document.body.classList.remove('dark-theme');
        if (themeToggle) {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i> <span class="theme-text">Темная</span>';
        }
        localStorage.setItem('theme', 'light');
    }

    // Проверка сохраненной темы или системных настроек
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark' || (!currentTheme && prefersDarkScheme.matches)) {
        applyDarkTheme();
    } else {
        applyLightTheme();
    }

    // Обработчик переключения темы
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            if (document.body.classList.contains('dark-theme')) {
                applyLightTheme();
            } else {
                applyDarkTheme();
            }
        });
    }

    // Отслеживание изменений системной темы
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                applyDarkTheme();
            } else {
                applyLightTheme();
            }
        }
    });
}

export const App = {
    API_URL: API_URL,
    state: state,
    init: function() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                state.currentUser = JSON.parse(savedUser);
                DataLoader.loadUserData();
                UI.showApp();
            } catch (e) {
                console.error("Ошибка загрузки пользователя:", e);
                localStorage.removeItem('currentUser');
                UI.showAuth();
            }
        } else {
            UI.showAuth();
        }

        setupTheme(); // Добавляем вызов функции настройки темы
        EventHandlers.setup();
        UI.setupProfileHandlers();
        Chat.init();
    }
};

document.addEventListener('DOMContentLoaded', App.init);