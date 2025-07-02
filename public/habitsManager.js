import * as DataLoader from './dataLoader.js';
import * as UI from './ui.js';
import * as Utils from './utils.js';
import { state } from './state.js';

export function addNewHabit() {
    const name = document.getElementById('habit-name').value.trim();
    if (!name) {
        Utils.showNotification('Ошибка', 'Введите название привычки', 'error');
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
    console.log("Отработано")
    state.habits.push(newHabit);
    DataLoader.saveUserHabits();

    if (newHabit.reminder) {
        state.reminders.push({
            habitId: newHabit.id,
            time: newHabit.reminder,
            enabled: true
        });
        DataLoader.saveReminders();
        Utils.showNotification('Напоминание', `Напоминание для "${name}" установлено на ${newHabit.reminder}`);
    }

    document.getElementById('habit-name').value = '';
    document.getElementById('habit-motivation').value = '';
    document.getElementById('habit-reminder').value = '';

    UI.elements.addHabitForm.style.display = 'none';
    UI.elements.habitsSection.style.display = 'block';

    Utils.showNotification('Привычка добавлена!', `Вы добавили привычку "${name}"`);
}

export function deleteHabit(id) {
    if (confirm('Удалить эту привычку?')) {
        state.habits = state.habits.filter(habit => habit.id !== id);
        DataLoader.saveUserHabits();
        UI.renderHabits();
        Utils.showNotification('Привычка удалена', 'Привычка была успешно удалена');
    }
}

export function archiveHabit(id) {
    const habit = state.habits.find(h => h.id === id);
    if (habit) {
        habit.archived = true;
        habit.active = false;
        DataLoader.saveUserHabits();
        UI.renderHabits();
        Utils.showNotification('Привычка архивирована', 'Вы можете восстановить её из архива');
    }
}

export function restoreHabit(id) {
    const habit = state.habits.find(h => h.id === id);
    if (habit) {
        habit.archived = false;
        habit.active = true;
        DataLoader.saveUserHabits();
        UI.renderHabits();
        Utils.showNotification('Привычка восстановлена', 'Привычка снова активна');
    }
}

export function toggleHabitDate(habitId, date) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit || habit.archived) return;

    const dateIndex = habit.completedDates.indexOf(date);

    if (dateIndex === -1) {
        habit.completedDates.push(date);
        Utils.showNotification('Отличная работа!', `Привычка "${habit.name}" отмечена на ${Utils.formatDate(new Date(date))}`);
    } else {
        habit.completedDates.splice(dateIndex, 1);
    }

    DataLoader.saveUserHabits();
    UI.renderHabits();
}