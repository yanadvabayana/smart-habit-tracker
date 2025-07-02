import * as UI from './ui.js';
import { state } from './state.js';

export function updateStats() {
    if (!state.currentUser) return;

    const activeHabits = state.habits.filter(h => !h.archived);
    UI.elements.totalHabits.textContent = activeHabits.length;

    let totalChecks = 0;
    state.habits.forEach(habit => {
        totalChecks += habit.completedDates.length;
    });

    const totalPossible = state.habits.length * 30;
    const completionRate = totalPossible > 0
        ? Math.round((totalChecks / totalPossible) * 100)
        : 0;

    UI.elements.completionRate.textContent = `${completionRate}%`;

    let longestStreak = 0;
    state.habits.forEach(habit => {
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

    UI.elements.streakCount.textContent = longestStreak;
    UI.elements.currentStreak.textContent = longestStreak;

    // Еженедельный прогресс
    const weeklyCompleted = state.habits.reduce((count, habit) => {
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
    UI.elements.weeklyProgress.textContent = `${weeklyProgress}/${weeklyGoal} дней`;
    UI.elements.weeklyBar.style.width = `${(weeklyProgress / weeklyGoal) * 100}%`;
}