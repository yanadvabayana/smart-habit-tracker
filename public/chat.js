import * as UI from './ui.js';
import { state } from './state.js';

export function init() {
    UI.elements.chatToggle.addEventListener('click', () => {
        UI.elements.chatContainer.classList.toggle('open');
    });

    UI.elements.closeChat.addEventListener('click', () => {
        UI.elements.chatContainer.classList.remove('open');
    });

    UI.elements.sendBtn.addEventListener('click', sendMessage);
    UI.elements.userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    setTimeout(() => {
        addBotMessage("Привет! Я твой помощник по формированию привычек. Могу помочь советом, поддержать или просто поболтать. Что тебя интересует?");
    }, 1000);
}

export function sendMessage() {
    const message = UI.elements.userInput.value.trim();
    if (!message) return;

    addUserMessage(message);
    UI.elements.userInput.value = '';

    setTimeout(() => {
        const response = generateResponse(message);
        addBotMessage(response);
    }, 500);
}

function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'user-message');
    messageDiv.textContent = text;
    UI.elements.chatMessages.appendChild(messageDiv);
    UI.elements.chatMessages.scrollTop = UI.elements.chatMessages.scrollHeight;
}

function addBotMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'bot-message');
    messageDiv.textContent = text;
    UI.elements.chatMessages.appendChild(messageDiv);
    UI.elements.chatMessages.scrollTop = UI.elements.chatMessages.scrollHeight;
}

function generateResponse(message) {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('привет') || lowerMsg.includes('здравств') || lowerMsg.includes('добр')) {
        return "Привет! Как твои дела? Какие привычки сегодня планируешь?";
    }

    if (lowerMsg.includes('помоги') || lowerMsg.includes('совет') || lowerMsg.includes('как')) {
        return getHabitAdvice(lowerMsg);
    }

    if (lowerMsg.includes('прогресс') || lowerMsg.includes('статистика') || lowerMsg.includes('серия')) {
        return getProgressSummary();
    }

    if (lowerMsg.includes('мотивац') || lowerMsg.includes('устал') || lowerMsg.includes('лень') ||
        lowerMsg.includes('не хочу') || lowerMsg.includes('не могу')) {
        return getMotivation();
    }

    if (lowerMsg.includes('спасибо') || lowerMsg.includes('благодар')) {
        return "Пожалуйста! Всегда рад помочь. Ты делаешь отличную работу!";
    }

    if (lowerMsg.includes('пока') || lowerMsg.includes('до свидан') || lowerMsg.includes('выход')) {
        return "До скорой встречи! Помни, маленькие шаги каждый день приводят к большим результатам.";
    }

    return getGeneralResponse();
}

function getHabitAdvice(message) {
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
}

function getMotivation() {
    const motivations = [
        "Ты можешь больше, чем думаешь! Один пропущенный день - не повод сдаваться.",
        "Помни, почему ты начал. Твоя цель стоит этих усилий!",
        "Успех - это сумма небольших усилий, повторяемых изо дня в день.",
        "Сегодняшний ты лучше вчерашнего, а завтрашний будет лучше сегодняшнего!",
        "Трудности временны, а результаты останутся с тобой навсегда. Продолжай!",
        "Каждый раз, когда ты делаешь это, ты становишься на шаг ближе к лучшей версии себя."
    ];
    return motivations[Math.floor(Math.random() * motivations.length)];
}

function getProgressSummary() {
    if (state.habits.length === 0) {
        return "У тебя пока нет активных привычек. Давай добавим первую?";
    }

    const activeHabits = state.habits.filter(h => !h.archived);
    const completedToday = state.habits.reduce((count, habit) => {
        const today = new Date().toISOString().split('T')[0];
        return habit.completedDates.includes(today) ? count + 1 : count;
    }, 0);

    return `У тебя ${activeHabits.length} активных привычек. 
Сегодня выполнено: ${completedToday}/${activeHabits.length}. 
Продолжай в том же духе!`;
}

function getGeneralResponse() {
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