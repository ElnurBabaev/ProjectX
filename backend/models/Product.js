const db = require('../config/database');

class Product {
  static async create(productData) {
    const { title, description, price, image_url, stock_quantity } = productData;
    
    const query = `
      INSERT INTO products (title, description, price, image_url, stock_quantity, is_available)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await db.query(query, [title, description, price, image_url, stock_quantity, true]);
    return result.rows[0];
  }

  static async getAll() {
    const query = 'SELECT * FROM products WHERE is_available = true ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM products WHERE id = $1 AND is_available = true';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async purchase(productId, userId) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Проверяем наличие товара и достаточность баллов
      const productQuery = 'SELECT * FROM products WHERE id = $1 AND is_available = true FOR UPDATE';
      const productResult = await client.query(productQuery, [productId]);
      const product = productResult.rows[0];
      
      if (!product) {
        throw new Error('Товар не найден');
      }
      
      if (product.stock_quantity <= 0) {
        throw new Error('Товар закончился');
      }
      
      const userQuery = 'SELECT personal_points FROM users WHERE id = $1 FOR UPDATE';
      const userResult = await client.query(userQuery, [userId]);
      const user = userResult.rows[0];
      
      if (!user) {
        throw new Error('Пользователь не найден');
      }
      
      if (user.personal_points < product.price) {
        throw new Error('Недостаточно баллов');
      }
      
      // Списываем баллы
      const updatePointsQuery = 'UPDATE users SET personal_points = personal_points - $1 WHERE id = $2';
      await client.query(updatePointsQuery, [product.price, userId]);
      
      // Уменьшаем количество товара
      const updateStockQuery = 'UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = $1';
      await client.query(updateStockQuery, [productId]);
      
      // Создаем запись о покупке
      const purchaseQuery = `
        INSERT INTO purchases (user_id, product_id, price_paid, purchased_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *
      `;
      const purchaseResult = await client.query(purchaseQuery, [userId, productId, product.price]);
      
      await client.query('COMMIT');
      return purchaseResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getUserPurchases(userId) {
    const query = `
      SELECT p.title, p.description, p.image_url, pu.price_paid, pu.purchased_at
      FROM purchases pu
      JOIN products p ON pu.product_id = p.id
      WHERE pu.user_id = $1
      ORDER BY pu.purchased_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async update(id, productData) {
    const { title, description, price, image_url, stock_quantity } = productData;
    
    const query = `
      UPDATE products 
      SET title = $1, description = $2, price = $3, image_url = $4, stock_quantity = $5
      WHERE id = $6
      RETURNING *
    `;
    
    const result = await db.query(query, [title, description, price, image_url, stock_quantity, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'UPDATE products SET is_available = false WHERE id = $1';
    await db.query(query, [id]);
  }
}

module.exports = Product;