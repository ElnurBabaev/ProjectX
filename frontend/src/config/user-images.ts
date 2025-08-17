// Автоматический сканер изображений
// Этот файл автоматически создает конфигурацию на основе загруженных изображений

const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'];

// Функция для автоматического поиска аватаров
export const scanAvatarImages = () => {
  const avatars = [];
  
  // Добавим default аватар
  avatars.push({
    id: 'default',
    name: 'По умолчанию',
    path: '/images/avatars/default.svg'
  });
  
  // Автоматически добавляем все изображения из папки user-avatars
  const avatarContext = import.meta.glob('/public/images/user-avatars/*', { eager: true });
  
  Object.keys(avatarContext).forEach((path, index) => {
    const fileName = path.split('/').pop();
    if (!fileName) return;
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension || !SUPPORTED_FORMATS.includes(extension)) return;
    
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    avatars.push({
      id: `user-avatar-${index + 1}`,
      name: nameWithoutExt.replace(/[-_]/g, ' '), // Заменяем дефисы и подчеркивания пробелами
      path: `/images/user-avatars/${fileName}`
    });
  });
  
  return avatars;
};

// Функция для автоматического поиска иконок достижений
export const scanAchievementIcons = () => {
  const icons = [];
  
  // Добавим default иконку
  icons.push({
    id: 'default',
    name: 'По умолчанию',
    path: '/images/achievements/trophy-gold.svg'
  });
  
  // Автоматически добавляем все изображения из папки achievement-icons
  const iconContext = import.meta.glob('/public/images/achievement-icons/*', { eager: true });
  
  Object.keys(iconContext).forEach((path, index) => {
    const fileName = path.split('/').pop();
    if (!fileName) return;
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension || !SUPPORTED_FORMATS.includes(extension)) return;
    
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    icons.push({
      id: `achievement-icon-${index + 1}`,
      name: nameWithoutExt.replace(/[-_]/g, ' '), // Заменяем дефисы и подчеркивания пробелами
      path: `/images/achievement-icons/${fileName}`
    });
  });
  
  return icons;
};

// Резервный вариант для статических изображений
export const FALLBACK_AVATARS = [
  { id: 'default', name: 'По умолчанию', path: '/images/avatars/default.svg' }
];

export const FALLBACK_ACHIEVEMENT_ICONS = [
  { id: 'default', name: 'По умолчанию', path: '/images/achievements/trophy-gold.svg' }
];

export const getAvatarPath = (avatarId?: string | null): string => {
  if (!avatarId || avatarId === 'default') {
    return '/images/avatars/default.svg';
  }
  
  // Пытаемся найти в пользовательских аватарах
  const userAvatars = scanAvatarImages();
  const avatar = userAvatars.find(a => a.id === avatarId);
  
  return avatar ? avatar.path : '/images/avatars/default.svg';
};

export const getAchievementIconPath = (iconId?: string | null): string => {
  if (!iconId || iconId === 'default') {
    return '/images/achievements/trophy-gold.svg';
  }
  
  // Пытаемся найти в пользовательских иконках
  const userIcons = scanAchievementIcons();
  const icon = userIcons.find(i => i.id === iconId);
  
  return icon ? icon.path : '/images/achievements/trophy-gold.svg';
};