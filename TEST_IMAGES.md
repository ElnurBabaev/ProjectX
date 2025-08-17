# Тест изображений

## Как протестировать селектор изображений:

### 1. Тестирование селектора аватаров:
1. Откройте http://localhost:3000
2. Войдите в систему (логин: student1, пароль: 123456)
3. Перейдите в "Профиль" 
4. Нажмите "Изменить аватар"
5. Должна открыться галерея с 15 аватарами (01.jpg - 15.jpg)

### 2. Тестирование селектора иконок достижений:
1. Войдите под админом (логин: admin, пароль: admin123)
2. Перейдите в "Панель администратора"
3. Нажмите "Создать достижение"
4. Нажмите "Выбрать иконку"
5. Должна открыться галерея с 30+ иконками достижений

### 3. Проверка загрузки изображений:
- Все аватары: http://localhost:3000/images/user-avatars/01.jpg (до 15.jpg)
- Пример иконки: http://localhost:3000/images/achievement-icons/CROWN.svg

## Если изображения не загружаются:

1. **Проверьте путь к файлам**: 
   ```
   frontend/public/images/user-avatars/01.jpg
   frontend/public/images/achievement-icons/CROWN.svg
   ```

2. **Убедитесь что файлы существуют**:
   ```powershell
   ls "c:\Users\Spark\Downloads\ProjectX\frontend\public\images\user-avatars"
   ls "c:\Users\Spark\Downloads\ProjectX\frontend\public\images\achievement-icons"
   ```

3. **Перезагрузите страницу** после обновления конфигурации

4. **Проверьте консоль браузера** на наличие 404 ошибок

## Добавление новых изображений:

1. Скопируйте файлы в соответствующие папки
2. Обновите `frontend/src/config/simple-images.ts`
3. Добавьте записи в массивы `USER_AVATARS` и `USER_ACHIEVEMENT_ICONS`
4. Перезагрузите страницу

## Быстрые ссылки для тестирования:
- Вход студента: http://localhost:3000/login (student1 / 123456)
- Вход админа: http://localhost:3000/login (admin / admin123)
- Профиль: http://localhost:3000/profile
- Админ панель: http://localhost:3000/admin