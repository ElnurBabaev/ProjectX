# Быстрое исправление аватарки

## 🔧 Шаг 1: Принудительное исправление в консоли браузера

Откройте консоль браузера (F12 → Console) и выполните:

```javascript
// Проверяем текущие данные
const user = JSON.parse(localStorage.getItem('user'));
console.log('Текущий пользователь:', user);
console.log('Текущий avatar_url:', user?.avatar_url);

// Исправляем avatar_url
user.avatar_url = 'avatar-01';
localStorage.setItem('user', JSON.stringify(user));

console.log('Исправленный пользователь:', user);

// Перезагружаем страницу
location.reload();
```

## 🧪 Шаг 2: Проверка API сервера

После исправления, откройте Network tab в DevTools и перезагрузите страницу. 

Найдите запрос к `/api/auth/profile` и проверьте ответ:
- Должен содержать `"avatar_url": "avatar-01"`
- Если содержит `"avatar_url": null` или нет этого поля - проблема на сервере

## ⚡ Шаг 3: Постоянное исправление

Если временное исправление помогло, то нужно исправить одну из этих проблем:

### A) Сервер не возвращает avatar_url
```javascript
// В backend/routes/auth.js, GET /profile должен возвращать:
{
  "user": {
    "avatar_url": "avatar-01"  // ← это поле должно быть
  }
}
```

### B) AuthContext перезаписывает данные
```javascript
// Проблема в AuthContext.tsx - при синхронизации с сервером
// localStorage данные заменяются серверными (которые могут быть неполными)
```

## 🎯 Ожидаемый результат:

После выполнения Шага 1:
- ✅ Аватарка должна появиться сразу
- ✅ После перезагрузки должна остаться
- ✅ В консоли должно появиться: "✅ getAvatarPath: Avatar found for avatar-01"