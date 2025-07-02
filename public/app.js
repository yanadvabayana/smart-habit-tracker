import * as UI from './ui.js';
import * as DataLoader from './dataLoader.js';
import * as EventHandlers from './eventHandlers.js';
import * as Chat from './chat.js';
import { state } from './state.js';
import { API_URL } from './config.js';

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

        EventHandlers.setup();
        Chat.init();
    }
};

document.addEventListener('DOMContentLoaded', App.init);