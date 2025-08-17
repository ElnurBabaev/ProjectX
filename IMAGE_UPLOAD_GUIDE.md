# Инструкция по добавлению собственных изображений

## Шаг 1: Загрузка изображений

### Для аватаров:
1. Поместите ваши изображения аватаров в папку:
   ```
   frontend/public/images/user-avatars/
   ```

### Для иконок достижений:
1. Поместите ваши иконки достижений в папку:
   ```
   frontend/public/images/achievement-icons/
   ```

## Шаг 2: Обновление конфигурации

1. Откройте файл: `frontend/src/config/simple-images.ts`

2. **Для аватаров** - добавьте записи в массив `USER_AVATARS`:
```typescript
export const USER_AVATARS = [
  { id: 'my-avatar-1', name: 'Название аватара', path: '/images/user-avatars/имя-файла.png' },
  { id: 'my-avatar-2', name: 'Другой аватар', path: '/images/user-avatars/другой-файл.jpg' },
  // добавьте больше...
];
```

3. **Для иконок достижений** - добавьте записи в массив `USER_ACHIEVEMENT_ICONS`:
```typescript
export const USER_ACHIEVEMENT_ICONS = [
  { id: 'my-icon-1', name: 'Золотая медаль', path: '/images/achievement-icons/gold-medal.png' },
  { id: 'my-icon-2', name: 'Серебряная звезда', path: '/images/achievement-icons/silver-star.svg' },
  // добавьте больше...
];
```

## Поддерживаемые форматы:
- PNG (.png)
- JPEG (.jpg, .jpeg)
- SVG (.svg)
- WebP (.webp)
- GIF (.gif)

## Рекомендуемые размеры:
- **Аватары**: 100x100px или больше (квадратные)
- **Иконки достижений**: 64x64px или 128x128px

## Пример структуры файлов:

```
frontend/
├── public/
│   └── images/
│       ├── user-avatars/
│       │   ├── student-boy.png
│       │   ├── student-girl.png
│       │   ├── teacher-male.jpg
│       │   └── teacher-female.svg
│       └── achievement-icons/
│           ├── gold-trophy.png
│           ├── silver-medal.png
│           ├── certificate.svg
│           └── lightning-bolt.png
└── src/
    └── config/
        └── simple-images.ts  ← Обновляйте этот файл
```

## После добавления изображений:

1. Обновите конфигурацию в `simple-images.ts`
2. Перезапустите frontend сервер:
   ```bash
   npm run dev
   ```
3. Изображения будут доступны в селекторах аватаров и иконок

## Советы:
- Используйте понятные имена файлов (например: `student-happy.png`, `gold-star.svg`)
- ID должны быть уникальными
- Имена будут показываться пользователям в селекторах