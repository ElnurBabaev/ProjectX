# Быстрый тест аватарки

## 🧪 Тестируем функцию getAvatarPath:

Откройте консоль браузера (F12 → Console) на странице профиля и выполните:

```javascript
// Импортируем функцию getAvatarPath
import { getAvatarPath } from './config/simple-images.ts';

// Тестируем с существующим ID
console.log('Test 1 - avatar-01:', getAvatarPath('avatar-01'));

// Тестируем с null
console.log('Test 2 - null:', getAvatarPath(null));

// Тестируем с пустой строкой
console.log('Test 3 - empty:', getAvatarPath(''));

// Проверяем данные пользователя из localStorage
const user = JSON.parse(localStorage.getItem('user'));
console.log('User from localStorage:', user);
console.log('User avatar_url:', user?.avatar_url);
```

## 🔍 Прямая проверка URL:

Откройте в браузере:
- http://localhost:3000/images/user-avatars/01.jpg

Должна загрузиться картинка аватарки.

## 🐛 Диагностика:

1. **Если функция getAvatarPath возвращает default** - проблема в поиске ID
2. **Если картинка не загружается по URL** - проблема с файлом
3. **Если localStorage не содержит avatar_url** - проблема с сохранением

## ⚡ Быстрое исправление:

Если проблема в сравнении ID, можно временно изменить логику:

```typescript
export const getAvatarPath = (avatarId?: string | null): string => {
  if (!avatarId) return DEFAULT_AVATAR;
  
  // Прямое сопоставление для быстрого теста
  if (avatarId === 'avatar-01') return '/images/user-avatars/01.jpg';
  if (avatarId === 'avatar-02') return '/images/user-avatars/02.jpg';
  // ... и так далее
  
  return DEFAULT_AVATAR;
};
```