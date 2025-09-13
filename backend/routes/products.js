const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, adminAuth } = require('../middleware/auth');
const AchievementChecker = require('../utils/achievementChecker');
const { recalculateUserPoints } = require('../utils/pointsCalculator');
const Notification = require('../models/Notification');

const router = express.Router();

// Получение всех товаров
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM products 
      WHERE is_active = 1 
      ORDER BY created_at DESC
    `);
    res.json({ products: result.rows });
  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение конкретного товара
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products WHERE id = ? AND is_active = 1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Товар не найден' });
    }
    res.json({ product: result.rows[0] });
  } catch (error) {
    console.error('Ошибка получения товара:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание заказа
router.post('/order', [
  auth,
  body('items').isArray({ min: 1 }).withMessage('Необходимо указать хотя бы один товар'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('Неверный ID товара'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Количество должно быть положительным числом'),
  body('shipping_address').notEmpty().withMessage('Адрес доставки обязателен')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, shipping_address, notes } = req.body;
    const userId = req.user.id;

    // Проверяем наличие товаров и рассчитываем общую стоимость
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const productResult = await db.query(
        'SELECT * FROM products WHERE id = ? AND is_active = 1',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        return res.status(404).json({ message: `Товар с ID ${item.product_id} не найден` });
      }

      const product = productResult.rows[0];

      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Недостаточно товара "${product.name}" на складе. Доступно: ${product.stock_quantity}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Проверяем достаточность баллов пользователя
    const userResult = await db.query('SELECT points FROM users WHERE id = ?', [userId]);
    const userPoints = userResult.rows[0]?.points || 0;

    if (userPoints < totalAmount) {
      return res.status(400).json({ 
        message: `Недостаточно баллов! У вас ${userPoints}, нужно ${totalAmount}` 
      });
    }

    // Создаем заказ
    const orderResult = await db.query(
      'INSERT INTO orders (user_id, total_amount, shipping_address, notes) VALUES (?, ?, ?, ?)',
      [userId, totalAmount, shipping_address, notes || null]
    );

    const orderId = orderResult.insertId;

    // Добавляем товары в заказ и обновляем склад
    for (const item of orderItems) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );

      // Уменьшаем количество на складе
      await db.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Проверяем достижения после покупки
    const earnedAchievements = await AchievementChecker.checkAfterPurchase(userId);

    // Пересчитываем баланс пользователя с учетом покупки
    await recalculateUserPoints(userId);

    // Создаем уведомление для всех админов
    try {
      // Получаем полную информацию о пользователе
      const userResult = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      const user = userResult.rows[0];

      if (user) {
        const adminResult = await db.query('SELECT id FROM users WHERE role = ?', ['admin']);
        const adminIds = adminResult.rows.map(admin => admin.id);

        for (const adminId of adminIds) {
          await Notification.create(
            adminId,
            'order_created',
            'Новый заказ',
            `Ученик ${user.first_name} ${user.last_name} (${user.class_grade}${user.class_letter}) создал заказ №${orderId} на сумму ${totalAmount} баллов`,
            orderId
          );
        }
      }
    } catch (notificationError) {
      console.error('Ошибка создания уведомления:', notificationError);
      // Не прерываем процесс создания заказа из-за ошибки уведомления
    }

    res.status(201).json({
      message: 'Заказ успешно создан',
      order: {
        id: orderId,
        total_amount: totalAmount,
        status: 'pending',
        items: orderItems
      },
      achievementsEarned: earnedAchievements.length,
      newAchievements: earnedAchievements.map(a => ({ id: a.id, title: a.title }))
    });
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение заказов пользователя
router.get('/orders/my', auth, async (req, res) => {
  try {
    const ordersResult = await db.query(`
      SELECT * FROM orders 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [req.user.id]);

    const orders = [];

    for (const order of ordersResult.rows) {
      const itemsResult = await db.query(`
        SELECT oi.*, p.name, p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);

      orders.push({
        ...order,
        items: itemsResult.rows
      });
    }

    res.json({ orders });
  } catch (error) {
    console.error('Ошибка получения заказов пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// АДМИНИСТРАТИВНЫЕ МАРШРУТЫ

// Создание товара
router.post('/', [
  adminAuth,
  body('name').notEmpty().withMessage('Название товара обязательно'),
  body('description').notEmpty().withMessage('Описание товара обязательно'),
  body('price').isNumeric().withMessage('Цена должна быть числом'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Количество на складе должно быть неотрицательным числом'),
  body('category').notEmpty().withMessage('Категория обязательна')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, stock_quantity, category, image_url } = req.body;

    const result = await db.query(`
      INSERT INTO products (name, description, price, stock_quantity, category, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, description, parseFloat(price), stock_quantity, category, image_url || null]);

    res.status(201).json({
      message: 'Товар создан',
      product: {
        id: result.insertId,
        name,
        description,
        price: parseFloat(price),
        stock_quantity,
        category,
        image_url
      }
    });
  } catch (error) {
    console.error('Ошибка создания товара:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление товара
router.put('/:id', [
  adminAuth,
  body('name').notEmpty().withMessage('Название товара обязательно'),
  body('description').notEmpty().withMessage('Описание товара обязательно'),
  body('price').isNumeric().withMessage('Цена должна быть числом'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Количество на складе должно быть неотрицательным числом'),
  body('category').notEmpty().withMessage('Категория обязательна')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, stock_quantity, category, image_url, is_active } = req.body;

    const result = await db.query(`
      UPDATE products 
      SET name = ?, description = ?, price = ?, stock_quantity = ?, category = ?, image_url = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, parseFloat(price), stock_quantity, category, image_url || null, is_active !== undefined ? is_active : 1, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Товар не найден' });
    }

    res.json({ message: 'Товар обновлен' });
  } catch (error) {
    console.error('Ошибка обновления товара:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление товара (мягкое удаление)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE products SET is_active = 0 WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Товар не найден' });
    }

    res.json({ message: 'Товар удален' });
  } catch (error) {
    console.error('Ошибка удаления товара:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение всех заказов (для админов)
router.get('/orders/all', adminAuth, async (req, res) => {
  try {
    const ordersResult = await db.query(`
      SELECT o.*, u.first_name, u.last_name, u.class_grade, u.class_letter
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    const orders = [];

    for (const order of ordersResult.rows) {
      const itemsResult = await db.query(`
        SELECT oi.*, p.name, p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);

      orders.push({
        ...order,
        items: itemsResult.rows
      });
    }

    res.json({ orders });
  } catch (error) {
    console.error('Ошибка получения всех заказов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление статуса заказа
router.put('/orders/:id/status', [
  adminAuth,
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Неверный статус заказа'),
  body('pickupLocation').optional().isString().withMessage('Место получения должно быть строкой')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, pickupLocation } = req.body;
    const orderId = req.params.id;

    // Получаем информацию о заказе и пользователе
    const orderResult = await db.query(`
      SELECT o.*, u.first_name, u.last_name, u.class_grade, u.class_letter
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    const order = orderResult.rows[0];

    // Обновляем статус заказа
    const updateData = { status };
    const updateFields = ['status = ?'];
    const updateValues = [status];

    if (pickupLocation) {
      updateFields.push('notes = ?');
      updateValues.push(`Место получения: ${pickupLocation}`);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(orderId);

    const result = await db.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    // Отправляем уведомление ученику при подтверждении заказа
    if (status === 'processing' || status === 'shipped') {
      try {
        const statusText = status === 'processing' ? 'подтвержден' : 'готов к выдаче';
        const locationText = pickupLocation ? ` в ${pickupLocation}` : '';

        await Notification.create(
          order.user_id,
          'order_confirmed',
          '📦 Заказ готов к получению',
          `Ваш заказ №${orderId} ${statusText}${locationText}. Пожалуйста, обратитесь к администратору для получения.`,
          orderId
        );
      } catch (notificationError) {
        console.error('Ошибка создания уведомления:', notificationError);
        // Не прерываем процесс обновления статуса
      }
    }

    // Отправляем уведомление ученику при отмене заказа
    if (status === 'cancelled') {
      try {
        await Notification.create(
          order.user_id,
          'order_cancelled',
          'Заказ отменен',
          `Ваш заказ №${orderId} был отменен. Баллы будут возвращены на ваш счет.`,
          orderId
        );
      } catch (notificationError) {
        console.error('Ошибка создания уведомления:', notificationError);
      }
    }

    res.json({ message: 'Статус заказа обновлен' });
  } catch (error) {
    console.error('Ошибка обновления статуса заказа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;