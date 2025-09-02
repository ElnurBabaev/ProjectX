import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, 
  Search, 
  Edit, 
  Trash2, 
  Plus, 
  Package,
  Star,
  DollarSign,
  X,
  Eye,
  EyeOff,
  List,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUploader from '../ImageUploader';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  stock: number;
  active: boolean;
  purchaseCount?: number;
}

const ProductManagement: React.FC = () => {
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';
  const API_ORIGIN = import.meta.env.PROD 
    ? 'https://api.schoolactive.ru' 
    : (API_BASE_URL.replace(/\/api\/?$/, '') || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Функция для получения полного URL изображения
  const getFullImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url; // уже полный URL
    if (url.startsWith('/uploads/')) {
      const fullUrl = `${API_ORIGIN}${url}`;
      console.log('🔧 Преобразование URL в ProductManagement:', url, '→', fullUrl);
      return fullUrl;
    }
    return url; // внешняя ссылка или что-то еще
  };

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 10,
    category: '',
    imageUrl: '',
    stock: 50,
    active: true
  });

  const categories = ['Канцелярия', 'Одежда', 'Аксессуары', 'Книги', 'Другое'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
  // Админ-эндпоинт возвращает все товары (включая скрытые)
  const response = await fetch(`${API_BASE_URL}/admin/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Ошибка загрузки товаров');
      
      const data = await response.json();
      // Приводим к локальной форме, чтобы поля были консистентными
      const mapped: Product[] = (data.products || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        imageUrl: p.image_url || '',
        stock: p.stock_quantity,
        active: p.is_active === 1 || p.is_active === true,
        purchaseCount: p.purchaseCount
      }));
      setProducts(mapped);
    } catch (error) {
      toast.error('Ошибка загрузки товаров');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async () => {
    try {
      const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/admin/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price,
          category: newProduct.category,
      imageUrl: newProduct.imageUrl,
      stock_quantity: newProduct.stock,
      active: newProduct.active
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка создания товара');
      }

      await fetchProducts();
      setShowCreateModal(false);
      setNewProduct({
        name: '',
        description: '',
        price: 10,
        category: '',
        imageUrl: '',
        stock: 50,
        active: true
      });
      toast.success('Товар создан успешно');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateProduct = async () => {
    if (!selectedProduct) return;

    console.log('🔄 Обновление товара:', {
      id: selectedProduct.id,
      data: {
        name: selectedProduct.name,
        description: selectedProduct.description,
        price: selectedProduct.price,
        category: selectedProduct.category,
        imageUrl: selectedProduct.imageUrl,
        stock_quantity: selectedProduct.stock,
        active: selectedProduct.active
      }
    });

    try {
      const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/admin/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: selectedProduct.name,
          description: selectedProduct.description,
          price: selectedProduct.price,
          category: selectedProduct.category,
      imageUrl: selectedProduct.imageUrl,
      stock_quantity: selectedProduct.stock,
      active: selectedProduct.active
        })
      });

      console.log('📡 Ответ сервера:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Ошибка от API:', errorData);
        throw new Error(errorData.message || 'Ошибка обновления товара');
      }

      await fetchProducts();
      setShowEditModal(false);
      setSelectedProduct(null);
      toast.success('Товар обновлен успешно');
      
      // Принудительное обновление через секунду для обновления изображений
      setTimeout(() => {
        fetchProducts();
      }, 1000);
    } catch (error: any) {
      console.error('❌ Ошибка обновления товара:', error);
      toast.error(error.message);
    }
  };

  const deleteProduct = async (productId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;

    try {
      const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка удаления товара');
      }

      await fetchProducts();
      toast.success('Товар удален успешно');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleProductStatus = async (productId: number, active: boolean) => {
    try {
      const token = localStorage.getItem('token');
      // На сервере требуется полный набор полей при обновлении товара
      const p = products.find(pr => pr.id === productId);
      if (!p) throw new Error('Товар не найден в списке');

      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          imageUrl: p.imageUrl,
          stock_quantity: p.stock,
          active
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка обновления статуса товара');
      }

      await fetchProducts();
      toast.success(`Товар ${active ? 'активирован' : 'деактивирован'}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const viewPurchases = async (productId: number) => {
    try {
      const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/purchases`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Ошибка загрузки покупок');
      
      const data = await response.json();
      alert(`Покупки товара:\n${data.purchases.map((p: any) => `${p.firstName} ${p.lastName} - ${new Date(p.purchaseDate).toLocaleDateString('ru-RU')}`).join('\n')}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const exportPurchases = async (productId: number, productName: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Необходима авторизация');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/export-purchases`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка экспорта' }));
        throw new Error(errorData.message || 'Ошибка экспорта');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Покупки_${productName.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Покупки успешно экспортированы');
    } catch (error: any) {
      console.error('Error exporting purchases:', error);
      toast.error(error.message || 'Ошибка экспорта покупок');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShoppingBag className="w-8 h-8 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">Управление товарами</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить товар
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск товаров..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Все категории</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className={`bg-white rounded-lg shadow-sm border overflow-hidden ${product.active ? 'border-gray-200' : 'border-red-200 opacity-75'}`}>
            {product.imageUrl && (
              <img
                src={`${getFullImageUrl(product.imageUrl)}?t=${Date.now()}`}
                alt={product.name}
                className="w-full h-48 object-cover"
                crossOrigin="anonymous"
                onLoad={() => {
                  console.log('✅ Изображение товара в админке загружено:', product.imageUrl, '-> Полный URL:', getFullImageUrl(product.imageUrl || ''));
                }}
                onError={(e) => {
                  console.error('❌ Ошибка загрузки изображения товара в админке:', product.imageUrl, '-> Полный URL:', getFullImageUrl(product.imageUrl || ''));
                  // Попробуем загрузить через fetch для диагностики
                  fetch(getFullImageUrl(product.imageUrl || ''))
                    .then(response => {
                      console.log('📡 Fetch результат для товара в админке:', response.status, response.statusText);
                    })
                    .catch(fetchError => {
                      console.error('📡 Fetch ошибка для товара в админке:', fetchError);
                    });
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800 flex-1">{product.name}</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {product.active ? 'Активен' : 'Неактивен'}
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500 mb-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{product.price} баллов</span>
                  </span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{product.category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4" />
                  <span>В наличии: {product.stock}</span>
                </div>
                {product.purchaseCount !== undefined && (
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4" />
                    <span>Продано: {product.purchaseCount}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {/* Покупки */}
                <button
                  onClick={() => viewPurchases(product.id)}
                  className="w-9 h-9 flex items-center justify-center bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Показать покупки"
                  aria-label="Показать покупки"
                >
                  <List className="w-4 h-4" />
                </button>
                {/* Экспорт */}
                <button
                  onClick={() => exportPurchases(product.id, product.name)}
                  className="w-9 h-9 flex items-center justify-center bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  title="Экспортировать покупки в Excel"
                  aria-label="Экспортировать покупки в Excel"
                >
                  <Download className="w-4 h-4" />
                </button>
                {/* Скрыть/Показать */}
                <button
                  onClick={() => toggleProductStatus(product.id, !product.active)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                    product.active 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                  title={product.active ? 'Скрыть товар' : 'Показать товар'}
                  aria-label={product.active ? 'Скрыть товар' : 'Показать товар'}
                >
                  {product.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {/* Редактировать */}
                <button
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowEditModal(true);
                  }}
                  className="w-9 h-9 flex items-center justify-center text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Редактировать товар"
                  aria-label="Редактировать товар"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {/* Удалить */}
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="w-9 h-9 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Удалить товар"
                  aria-label="Удалить товар"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет товаров</h3>
          <p className="text-gray-500">Добавьте первый товар для начала работы</p>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Добавить товар</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Название товара"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <textarea
                placeholder="Описание товара"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Выберите категорию</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Цена в баллах"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="number"
                placeholder="Количество в наличии"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <ImageUploader
                currentImage={newProduct.imageUrl}
                onImageChange={(imageUrl) => setNewProduct({ ...newProduct, imageUrl })}
                label="Изображение товара"
              />
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newProduct.active}
                  onChange={(e) => setNewProduct({ ...newProduct, active: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Активен</span>
              </label>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={createProduct}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Редактировать товар</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Название товара"
                value={selectedProduct.name}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <textarea
                placeholder="Описание товара"
                value={selectedProduct.description}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <select
                value={selectedProduct.category}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Выберите категорию</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Цена в баллах"
                value={selectedProduct.price}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, price: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="number"
                placeholder="Количество в наличии"
                value={selectedProduct.stock}
                onChange={(e) => setSelectedProduct({ ...selectedProduct, stock: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <ImageUploader
                currentImage={selectedProduct.imageUrl || ''}
                onImageChange={(imageUrl) => setSelectedProduct({ ...selectedProduct, imageUrl })}
                label="Изображение товара"
              />
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedProduct.active}
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, active: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Активен</span>
              </label>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={updateProduct}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;