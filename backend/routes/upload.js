const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
    // гарантируем, что папка существует
    fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Фильтр для проверки типа файла
const fileFilter = (req, file, cb) => {
  // Разрешаем только изображения
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Можно загружать только изображения!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Максимальный размер файла: 5MB
  }
});

// Загрузка одного изображения
router.post('/upload-image', adminAuth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не был загружен' });
    }

    console.log('✅ Файл загружен:', req.file.filename);

    // Возвращаем URL файла
    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      message: 'Файл успешно загружен',
      imageUrl: imageUrl,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    res.status(500).json({ message: 'Ошибка загрузки файла' });
  }
});

// Удаление изображения
router.delete('/delete-image', adminAuth, (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ message: 'URL изображения не указан' });
    }

    // Извлекаем имя файла из URL
  const filename = path.basename(imageUrl);
  const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
  const filePath = path.join(uploadsDir, filename);

    // Проверяем, существует ли файл
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ Файл удален:', filename);
      res.json({ message: 'Файл успешно удален' });
    } else {
      res.status(404).json({ message: 'Файл не найден' });
    }
  } catch (error) {
    console.error('Ошибка удаления файла:', error);
    res.status(500).json({ message: 'Ошибка удаления файла' });
  }
});

module.exports = router;