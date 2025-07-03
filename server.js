const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'db.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());
app.use(bodyParser.json());


app.use(express.static(path.join(__dirname, 'public')));


function initDB() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      users: [],
      habits: []
    }));
  }
}


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
  
  console.log('Login attempt:', email); 
  console.log('Users in DB:', db.users);
  
  const user = db.users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    console.log('Login failed for:', email);
    return res.status(401).json({ error: 'Неверные учетные данные' });
  }
  
 
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
  

  habits.forEach(habit => {
    habit.userId = habits[0].userId; 
    db.habits.push(habit);
  });
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  
  res.json({ message: 'Привычки сохранены успешно!' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



// Запуск сервера
app.listen(PORT, () => {
  initDB();
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});


app.put('/api/users/:userId', (req, res) => {
  const { userId } = req.params;
  const { name } = req.body;
  

  const db = JSON.parse(fs.readFileSync(DATA_FILE));
  

  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  

  db.users[userIndex].name = name;
  

  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  

  res.json({ 
    message: 'Имя успешно обновлено',
    user: {
      id: db.users[userIndex].id,
      name: db.users[userIndex].name,
      email: db.users[userIndex].email,
      joinDate: db.users[userIndex].joinDate
    }
  });
});

app.put('/api/users/:userId/avatar', (req, res) => {
  const { userId } = req.params;
  const { avatar } = req.body;
  
  if (!avatar || !avatar.startsWith('data:image')) {
      return res.status(400).json({ error: 'Некорректные данные аватара' });
  }

  const db = JSON.parse(fs.readFileSync(DATA_FILE));
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
      return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  // Обрезаем base64 строку если она слишком длинная (для безопасности)
  const cleanAvatar = avatar.length > 2 * 1024 * 1024 
      ? avatar.substring(0, 2 * 1024 * 1024)
      : avatar;
  
  db.users[userIndex].avatar = cleanAvatar;
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  
  res.json({ 
      message: 'Аватар успешно обновлен',
      user: {
          id: db.users[userIndex].id,
          name: db.users[userIndex].name,
          email: db.users[userIndex].email,
          avatar: db.users[userIndex].avatar,
          joinDate: db.users[userIndex].joinDate
      }
  });
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

