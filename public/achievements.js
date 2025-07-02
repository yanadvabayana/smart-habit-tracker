import * as DataLoader from './dataLoader.js';
import * as Utils from './utils.js';
import { state } from './state.js';

export function checkAchievements() {
    if (state.habits.length > 0 && !state.achievements.includes('first_habit')) {
        state.achievements.push('first_habit');
        Utils.showNotification('Достижение!', 'Первая привычка добавлена', 'success');
        DataLoader.saveAchievements();
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

    if (weekStreak >= 7 && !state.achievements.includes('week_streak')) {
        state.achievements.push('week_streak');
        Utils.showNotification('Достижение!', 'Неделя подряд выполнения привычек', 'success');
        DataLoader.saveAchievements();
    }

    if (state.habits.length >= 5 && !state.achievements.includes('month_activity')) {
        state.achievements.push('month_activity');
        Utils.showNotification('Достижение!', '5 активных привычек в месяц', 'success');
        DataLoader.saveAchievements();
    }
}