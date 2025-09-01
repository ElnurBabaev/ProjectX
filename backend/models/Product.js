const db = require('../config/database');

class Product {
  static async create(productData) {
    const { name, description, price, image_url, stock_quantity, category } = productData;
    
    const query = `
      INSERT INTO products (name, description, price, image_url, stock_quantity, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(query, [name, description, price, image_url, stock_quantity, category]);
    // Получить созданный продукт
    const productResult = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    return productResult.rows[0];
  }

  static async getAll() {
    const query = 'SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM products WHERE id = ? AND is_active = 1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async purchase(productId, userId) {
    try {
      // Проверяем наличие товара
      const productResult = await db.query(
        'SELECT * FROM products WHERE id = ? AND is_active = 1',
        [productId]
      );
      const product = productResult.rows[0];
      
      if (!product) {
        throw new Error('Товар не найден');
      }
      
      if (product.stock_quantity <= 0) {
        throw new Error('Товар закончился');
      }
      
      // Проверяем баллы пользователя
      const userResult = await db.query('SELECT points FROM users WHERE id = ?', [userId]);
      const user = userResult.rows[0];
      
      if (!user) {
        throw new Error('Пользователь не найден');
      }
      
      if (user.points < product.price) {
        throw new Error('Недостаточно баллов');
      }
      
      // Списываем баллы
      await db.query(
        'UPDATE users SET points = points - ? WHERE id = ?',
        [product.price, userId]
      );
      
      // Уменьшаем количество товара
      await db.query(
        'UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = ?',
        [productId]
      );
      
      // Создаем заказ
      const orderResult = await db.query(
        'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
        [userId, product.price, 'delivered']
      );
      
      // Создаем элемент заказа
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderResult.insertId, productId, 1, product.price]
      );
      
      // Пересчитываем баллы пользователя
      const { recalculateUserPoints } = require('../utils/pointsCalculator');
      await recalculateUserPoints(userId);
      
      return { orderId: orderResult.insertId, product, price: product.price };
      
    } catch (error) {
      throw error;
    }
  }

  static async getUserPurchases(userId) {
    const query = `
      SELECT p.name, p.description, p.image_url, oi.price, o.created_at as purchased_at
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ? AND o.status != 'cancelled'
      ORDER BY o.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async update(id, productData) {
    const { name, description, price, image_url, stock_quantity, category, is_active } = productData;
    
    const query = `
      UPDATE products 
      SET name = ?, description = ?, price = ?, image_url = ?, stock_quantity = ?, category = ?, is_active = ?
      WHERE id = ?
    `;
    
    await db.query(query, [name, description, price, image_url, stock_quantity, category, is_active, id]);
    // Получить обновленный продукт
    const productResult = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    return productResult.rows[0];
  }

  static async delete(id) {
    const query = 'UPDATE products SET is_active = 0 WHERE id = ?';
    await db.query(query, [id]);
  }

  // Метод для получения покупок товара (для админки)
  static async getProductPurchases(productId) {
    const query = `
      SELECT 
        u.first_name, u.last_name, u.class_grade, u.class_letter,
        oi.quantity, oi.price, o.created_at as purchase_date
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN users u ON o.user_id = u.id
      WHERE oi.product_id = ? AND o.status != 'cancelled'
      ORDER BY o.created_at DESC
    `;
    const result = await db.query(query, [productId]);
    return result.rows;
  }
}

module.exports = Product;