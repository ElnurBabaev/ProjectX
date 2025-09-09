export const getFullImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url; // уже полный URL
  
  if (url.startsWith('/uploads/')) {
    const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';
    const API_ORIGIN = import.meta.env.PROD 
      ? 'https://schoolactive.ru' 
      : (API_BASE_URL.replace(/\/api\/?$/, '') || '');
    
    // В продакшене используем относительный путь, в разработке - полный URL
    return import.meta.env.PROD ? url : `${API_ORIGIN}${url}`;
  }
  
  return url; // внешняя ссылка или что-то еще
};
