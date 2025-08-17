# Диагностика проблемы входа

## 🧪 Тест в консоли браузера

После выхода из системы и перед входом, выполните в консоли:

```javascript
// 1. Очищаем localStorage
localStorage.clear();

// 2. Тестируем прямой API запрос
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    login: 'admin',
    password: 'admin123'
  })
})
.then(response => response.json())
.then(data => {
  console.log('🔍 Прямой API ответ:', data);
  console.log('🎯 Avatar URL в ответе:', data.user?.avatar_url);
})
.catch(error => {
  console.error('❌ Ошибка API:', error);
});
```

## 📋 Что проверять:

### 1. В Network tab (DevTools):
- Найдите запрос `POST /auth/login`
- В Response должно быть: `"avatar_url": "avatar-01"`

### 2. В Console:
- **"📦 Данные от сервера при логине"** - должно показать avatar_url
- **"💾 Данные сохранены в localStorage"** - должно показать avatar_url
- **"getAvatarPath"** - должно получать "avatar-01" вместо undefined

### 3. Возможные проблемы:

**A) Сервер не отправляет avatar_url:**
```json
// BAD - нет avatar_url
{"user": {"login": "admin", "role": "admin"}}

// GOOD - есть avatar_url  
{"user": {"login": "admin", "avatar_url": "avatar-01"}}
```

**B) Клиент не сохраняет avatar_url:**
- Проверить что axios не обрезает поля
- Проверить что JSON.stringify работает правильно

**C) Асинхронная проблема:**
- checkAuth() выполняется после login() и перезаписывает данные

## ⚡ Временное решение:

Если проблема в checkAuth(), можно добавить задержку:

```javascript
// В AuthContext после успешного логина:
setTimeout(() => {
  const savedUser = JSON.parse(localStorage.getItem('user'));
  if (!savedUser.avatar_url) {
    savedUser.avatar_url = 'avatar-01';
    localStorage.setItem('user', JSON.stringify(savedUser));
    setUser(savedUser);
  }
}, 1000);
```