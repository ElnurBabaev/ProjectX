import React, { useState, useEffect } from 'react';
import { Package, MapPin, User, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  shipping_address: string;
  notes: string;
  created_at: string;
  first_name: string;
  last_name: string;
  class_grade: number;
  class_letter: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  name: string;
  image_url: string;
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/products/orders/all');
      setOrders(data.orders);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
      toast.error('Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    if (newStatus === 'processing' || newStatus === 'shipped') {
      setSelectedOrder(orders.find(o => o.id === orderId) || null);
      setPickupLocation('');
      setShowConfirmModal(true);
      return;
    }

    try {
      await api.put(`/products/orders/${orderId}/status`, { status: newStatus });
      toast.success('Статус заказа обновлен');
      fetchOrders();
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      toast.error('Ошибка обновления статуса');
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedOrder) return;

    try {
      await api.put(`/products/orders/${selectedOrder.id}/status`, {
        status: 'processing',
        pickupLocation: pickupLocation || 'Кабинет администратора'
      });
      toast.success('Заказ подтвержден и уведомление отправлено ученику');
      setShowConfirmModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Ошибка подтверждения заказа:', error);
      toast.error('Ошибка подтверждения заказа');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'processing': return 'В обработке';
      case 'shipped': return 'Готов к выдаче';
      case 'delivered': return 'Выдан';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Управление заказами</h2>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Все заказы</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {orders.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>Нет заказов</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <ShoppingCart size={16} className="text-gray-500" />
                        <span className="font-medium text-gray-900">
                          Заказ №{order.id}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString('ru-RU')}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{order.first_name} {order.last_name} ({order.class_grade}{order.class_letter})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package size={14} />
                        <span>{order.total_amount} баллов</span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <div className="flex items-start gap-1">
                        <MapPin size={14} className="mt-0.5" />
                        <span>{order.shipping_address}</span>
                      </div>
                      {order.notes && (
                        <div className="mt-1 text-gray-500">
                          Примечание: {order.notes}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {order.items.slice(0, 3).map((item) => (
                        <span key={item.id} className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {item.name} × {item.quantity}
                        </span>
                      ))}
                      {order.items.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          +{order.items.length - 3} товаров
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(order.id, 'processing')}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Подтвердить
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Отменить
                        </button>
                      </>
                    )}
                    {order.status === 'processing' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'shipped')}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Готов к выдаче
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'delivered')}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Выдан
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Модальное окно подтверждения заказа */}
      {showConfirmModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Подтверждение заказа</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Заказ №{selectedOrder.id} от {selectedOrder.first_name} {selectedOrder.last_name}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Сумма: {selectedOrder.total_amount} баллов
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Место получения
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="Например: Кабинет 205"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleConfirmOrder}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Подтвердить и уведомить
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;