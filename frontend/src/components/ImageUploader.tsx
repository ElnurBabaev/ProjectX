import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageUploaderProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  label?: string;
  accept?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImage,
  onImageChange,
  label = "Изображение",
  accept = "image/*"
}) => {
  // Функция для получения полного URL изображения
  const getFullImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url; // уже полный URL
    if (url.startsWith('/uploads/')) return `http://localhost:5000${url}`; // относительный путь от нашего сервера
    return url; // внешняя ссылка или что-то еще
  };

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(getFullImageUrl(currentImage || ''));
  const [inputUrl, setInputUrl] = useState(currentImage || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Синхронизация с пропом currentImage
  useEffect(() => {
    setPreviewUrl(getFullImageUrl(currentImage || ''));
    setInputUrl(currentImage || '');
  }, [currentImage]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите файл изображения');
      return;
    }

    // Проверка размера файла (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5MB');
      return;
    }

    setUploading(true);

    try {
      // Создаем превью сразу
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Загружаем файл на сервер
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/upload/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки файла');
      }

      const data = await response.json();
      
      // Обновляем preview с полным URL, но сохраняем относительный путь
      setPreviewUrl(`http://localhost:5000${data.imageUrl}`);
      setInputUrl(data.imageUrl); // показываем относительный путь в поле ввода
      onImageChange(data.imageUrl); // относительный путь для БД
      
      toast.success('Изображение успешно загружено');
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      toast.error('Ошибка загрузки изображения');
      // Возвращаем предыдущие значения
      setPreviewUrl(getFullImageUrl(currentImage || ''));
      setInputUrl(currentImage || '');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setInputUrl(url);
    setPreviewUrl(getFullImageUrl(url));
    onImageChange(url);
  };

  const clearImage = () => {
    setPreviewUrl('');
    setInputUrl('');
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Превью изображения */}
      {previewUrl && (
        <div className="relative inline-block">
          <img
            src={`${previewUrl}?t=${Date.now()}`}
            alt="Превью"
            className="max-w-full h-48 object-cover rounded-lg border-2 border-gray-200"
            crossOrigin="anonymous"
            onLoad={() => {
              console.log('✅ Изображение в превью загружено:', previewUrl);
            }}
            onError={() => {
              console.error('❌ Ошибка загрузки изображения в превью:', previewUrl);
              // Попробуем загрузить через fetch для диагностики
              fetch(previewUrl)
                .then(response => {
                  console.log('📡 Fetch результат для превью:', response.status, response.statusText);
                  console.log('📡 Fetch заголовки для превью:', [...response.headers.entries()]);
                })
                .catch(fetchError => {
                  console.error('📡 Fetch ошибка для превью:', fetchError);
                });
              setPreviewUrl('');
            }}
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Кнопки загрузки */}
      <div className="flex flex-col space-y-3">
        {/* Загрузка с компьютера */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={openFileDialog}
            disabled={uploading}
            className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Загружаем...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2 text-gray-500" />
                Загрузить с компьютера
              </>
            )}
          </button>
        </div>

        {/* Разделитель */}
        <div className="flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">или</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Ввод URL */}
        <div>
          <input
            type="url"
            placeholder="Вставьте ссылку на изображение"
            value={inputUrl}
            onChange={handleUrlChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Подсказка */}
      <p className="text-xs text-gray-500">
        Поддерживаемые форматы: JPG, PNG, GIF. Максимальный размер: 5MB
      </p>
    </div>
  );
};

export default ImageUploader;