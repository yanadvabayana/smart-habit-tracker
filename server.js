const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// Обслуживание статических файлов из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Инициализация базы данных
function initDB() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      users: [],
      habits: []
    }));
  }
}

// API Endpoints
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  const db = JSON.parse(fs.readFileSync(DATA_FILE));
  
  if (db.users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Пользователь уже существует' });
  }
  
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
    joinDate: new Date().toISOString()
  };
  
  db.users.push(newUser);
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  
  res.json({ 
    message: 'Регистрация успешна!',
    user: { id: newUser.id, name: newUser.name, email: newUser.email }
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const db = JSON.parse(fs.readFileSync(DATA_FILE));
  
  console.log('Login attempt:', email); // Добавьте логирование
  console.log('Users in DB:', db.users); // Отладка
  
  const user = db.users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    console.log('Login failed for:', email);
    return res.status(401).json({ error: 'Неверные учетные данные' });
  }
  
  // Возвращаем пользователя без пароля в целях безопасности
  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    joinDate: user.joinDate
  };
  
  res.json({ 
    message: 'Вход выполнен успешно',
    user: userData
  });
});

app.get('/api/habits/:userId', (req, res) => {
  const { userId } = req.params;
  const db = JSON.parse(fs.readFileSync(DATA_FILE));
  
  const userHabits = db.habits.filter(h => h.userId === userId);
  res.json(userHabits);
});

app.post('/api/habits', (req, res) => {
  const habits = req.body;
  const db = JSON.parse(fs.readFileSync(DATA_FILE));
  
  // Удаляем старые привычки пользователя
  if (habits.length > 0) {
    db.habits = db.habits.filter(h => h.userId !== habits[0].userId);
  }
  
  // Добавляем новые
  habits.forEach(habit => {
    habit.userId = habits[0].userId; // Добавляем ID пользователя
    db.habits.push(habit);
  });
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  
  res.json({ message: 'Привычки сохранены успешно!' });
});

// Все остальные запросы перенаправляем на index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  initDB();
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});