import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Star, Package, CreditCard, History } from 'lucide-react';
import { productsApi } from '../utils/api';
import { Product, Order } from '../utils/types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Shop: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [purchaseLoading, setPurchaseLoading] = useState<number | null>(null);

  // Функция для получения полного URL изображения
  const getFullImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url; // уже полный URL
    if (url.startsWith('/uploads/')) {
      const fullUrl = `http://localhost:5000${url}`;
      console.log('🔧 Преобразование URL в Shop:', url, '→', fullUrl);
      return fullUrl;
    }
    return url; // внешняя ссылка или что-то еще
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsResponse, ordersResponse] = await Promise.all([
        productsApi.getAll(),
        productsApi.getMyOrders()
      ]);
      
      setProducts(productsResponse.data);
      setOrders(ordersResponse.data || []);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      toast.error('Товар не найден');
      return;
    }

    // Проверяем достаточность баллов
    const userPoints = Math.floor(user?.points || 0);
    const productPrice = Math.floor(product.price);
    if (userPoints < productPrice) {
      toast.error(`Недостаточно баллов! У вас ${userPoints}, нужно ${productPrice}`);
      return;
    }

    setPurchaseLoading(productId);
    
    try {
      await productsApi.createOrder({
        items: [{ product_id: productId, quantity: 1 }],
        shipping_address: 'Школа',
        notes: 'Покупка через магазин'
      });
      
      toast.success('Товар успешно куплен!');
      
      // Динамически обновляем баланс пользователя
      await refreshUser();
      
      // Обновляем данные о заказах
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка покупки');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка магазина...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold gradient-text mb-2">
                  🛒 Магазин мерча
                </h1>
                <p className="text-gray-600">
                  Потратьте заработанные баллы на крутые товары!
                </p>
              </div>
              
              {/* Balance */}
              <div className="text-right">
                <div className="flex items-center justify-end mb-2">
                  <Star className="w-6 h-6 text-yellow-500 mr-2" />
                  <span className="text-3xl font-bold text-yellow-600">
                    {Math.floor(user?.points || 0)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Ваши баллы</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'products'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm hover:shadow-md'
              }`}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Товары
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm hover:shadow-md'
              }`}
            >
              <History className="w-4 h-4 mr-2" />
              История покупок ({orders.length})
            </button>
          </div>
        </motion.div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="card hover:shadow-2xl"
              >
                {/* Product Image */}
                <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={`${getFullImageUrl(product.image_url)}?t=${Date.now()}`}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-xl"
                      crossOrigin="anonymous"
                      onLoad={() => {
                        console.log('✅ Изображение товара загружено:', product.image_url, '-> Полный URL:', getFullImageUrl(product.image_url || ''));
                      }}
                      onError={(e) => {
                        console.error('❌ Ошибка загрузки изображения товара:', product.image_url, '-> Полный URL:', getFullImageUrl(product.image_url || ''));
                        // Попробуем загрузить через fetch для диагностики
                        fetch(getFullImageUrl(product.image_url || ''))
                          .then(response => {
                            console.log('📡 Fetch результат для товара:', response.status, response.statusText);
                          })
                          .catch(fetchError => {
                            console.error('📡 Fetch ошибка для товара:', fetchError);
                          });
                        // Показываем иконку вместо сломанного изображения
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.appendChild(
                          Object.assign(document.createElement('div'), {
                            className: 'flex items-center justify-center w-full h-full',
                            innerHTML: '<svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm5 6a2 2 0 100-4 2 2 0 000 4zm-1.5 2.5A1.5 1.5 0 018 11h4a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5H8a1.5 1.5 0 01-1.5-1.5v-1z" clip-rule="evenodd"></path></svg>'
                          })
                        );
                      }}
                    />
                  ) : (
                    <Package className="w-16 h-16 text-gray-400" />
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {product.name}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {product.description}
                  </p>
                  
                  {/* Stock Status */}
                  <div className="mb-4">
                    {product.stock_quantity > 0 ? (
                      <div className="flex items-center text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm">В наличии: {product.stock_quantity} шт.</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-sm">Нет в наличии</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price and Buy Button */}
                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-500 mr-1" />
                      <span className="text-2xl font-bold text-yellow-600">
                        {Math.floor(product.price)}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handlePurchase(product.id)}
                    disabled={
                      product.stock_quantity === 0 ||
                      purchaseLoading === product.id
                    }
                    className={`w-full btn flex items-center justify-center ${
                      product.stock_quantity === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'btn-primary'
                    }`}
                  >
                    {purchaseLoading === product.id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    
                    {purchaseLoading === product.id
                      ? 'Покупаем...'
                      : product.stock_quantity === 0
                        ? 'Нет в наличии'
                        : 'Купить'
                    }
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Order History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      Заказ #{order.id}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {formatDate(order.created_at)}
                    </p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {
                        order.status === 'pending' ? 'Ожидает' :
                        order.status === 'processing' ? 'Обрабатывается' :
                        order.status === 'shipped' ? 'Отправлен' :
                        order.status === 'delivered' ? 'Доставлен' :
                        order.status === 'cancelled' ? 'Отменён' :
                        order.status
                      }
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center text-yellow-600">
                      <Star className="w-4 h-4 mr-1" />
                      <span className="text-lg font-semibold">
                        {Math.floor(order.total_amount)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">сумма</span>
                  </div>
                </div>
                
                {/* Order Items */}
                <div className="space-y-2">
                  {order.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.image_url ? (
                          <img 
                            src={`${getFullImageUrl(item.image_url)}?t=${Date.now()}`}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                            crossOrigin="anonymous"
                            onLoad={() => {
                              console.log('✅ Изображение товара в заказе загружено:', item.image_url);
                            }}
                            onError={(e) => {
                              console.error('❌ Ошибка загрузки изображения товара в заказе:', item.image_url);
                              e.currentTarget.style.display = 'none';
                              // Показываем иконку Package вместо сломанного изображения
                              const iconElement = document.createElement('div');
                              iconElement.innerHTML = '<svg class="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm5 6a2 2 0 100-4 2 2 0 000 4zm-1.5 2.5A1.5 1.5 0 018 11h4a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5H8a1.5 1.5 0 01-1.5-1.5v-1z" clip-rule="evenodd"></path></svg>';
                              iconElement.className = 'flex items-center justify-center w-full h-full';
                              e.currentTarget.parentElement?.appendChild(iconElement);
                            }}
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-500" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-600">Количество: {item.quantity}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">{Math.floor(item.price * item.quantity)}</p>
                        <p className="text-xs text-gray-500">{Math.floor(item.price)} за шт.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty States */}
        {activeTab === 'products' && products.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Товары временно недоступны
            </h3>
            <p className="text-gray-600">
              Скоро здесь появится крутой мерч для учеников!
            </p>
          </motion.div>
        )}

        {activeTab === 'history' && orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              История покупок пуста
            </h3>
            <p className="text-gray-600">
              Когда вы купите первый товар, он появится здесь
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Shop;