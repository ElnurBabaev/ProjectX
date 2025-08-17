// Конфигурация доступных изображений

export const AVATAR_OPTIONS = [
  { id: 'avatar-default', name: 'По умолчанию', path: '/images/avatars/default.svg' },
  { id: 'avatar-1', name: 'Студент 1', path: '/images/avatars/student-1.svg' },
  { id: 'avatar-2', name: 'Студент 2', path: '/images/avatars/student-2.svg' },
  { id: 'avatar-3', name: 'Студент 3', path: '/images/avatars/student-3.svg' },
  { id: 'avatar-4', name: 'Студент 4', path: '/images/avatars/student-4.svg' },
  { id: 'avatar-5', name: 'Студент 5', path: '/images/avatars/student-5.svg' },
  { id: 'avatar-6', name: 'Студент 6', path: '/images/avatars/student-6.svg' },
  { id: 'avatar-7', name: 'Учитель 1', path: '/images/avatars/teacher-1.svg' },
  { id: 'avatar-8', name: 'Учитель 2', path: '/images/avatars/teacher-2.svg' }
];

export const ACHIEVEMENT_ICON_OPTIONS = [
  { id: 'trophy-gold', name: 'Золотой кубок', path: '/images/achievements/trophy-gold.svg' },
  { id: 'trophy-silver', name: 'Серебряный кубок', path: '/images/achievements/trophy-silver.svg' },
  { id: 'trophy-bronze', name: 'Бронзовый кубок', path: '/images/achievements/trophy-bronze.svg' },
  { id: 'medal-star', name: 'Звездная медаль', path: '/images/achievements/medal-star.svg' },
  { id: 'medal-honor', name: 'Медаль чести', path: '/images/achievements/medal-honor.svg' },
  { id: 'certificate', name: 'Сертификат', path: '/images/achievements/certificate.svg' },
  { id: 'book', name: 'Книга знаний', path: '/images/achievements/book.svg' },
  { id: 'lightning', name: 'Молния', path: '/images/achievements/lightning.svg' },
  { id: 'crown', name: 'Корона', path: '/images/achievements/crown.svg' },
  { id: 'shield', name: 'Щит', path: '/images/achievements/shield.svg' }
];

export const DEFAULT_AVATAR = '/images/avatars/default.svg';
export const DEFAULT_ACHIEVEMENT_ICON = '/images/achievements/trophy-gold.svg';

export const getAvatarPath = (avatarId?: string | null): string => {
  if (!avatarId) return DEFAULT_AVATAR;
  const avatar = AVATAR_OPTIONS.find(a => a.id === avatarId);
  return avatar ? avatar.path : DEFAULT_AVATAR;
};

export const getAchievementIconPath = (iconId?: string | null): string => {
  if (!iconId) return DEFAULT_ACHIEVEMENT_ICON;
  const icon = ACHIEVEMENT_ICON_OPTIONS.find(i => i.id === iconId);
  return icon ? icon.path : DEFAULT_ACHIEVEMENT_ICON;
};