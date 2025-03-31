import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_ENDPOINTS from '../config/api';

interface PurchaseOrder {
  _id: string;
  orderNumber: string;
  vendor: string;
  items: Array<{
    medicine: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const PurchaseOrderList: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(API_ENDPOINTS.PURCHASE_ORDERS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPurchaseOrders(response.data);
    } catch (err) {
      setError('Failed to fetch purchase orders. Please try again.');
      console.error('Error fetching purchase orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      await axios.put(API_ENDPOINTS.PURCHASE_ORDER_STATUS(id), 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update locally
      setPurchaseOrders((prev: PurchaseOrder[]) => 
        prev.map(po => 
          po._id === id ? {...po, status: newStatus} : po
        )
      );
      
      setSuccessMessage(`Purchase order status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update status. Please try again.');
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) {
      return;
    }
    
    try {
      await axios.delete(API_ENDPOINTS.PURCHASE_ORDER_BY_ID(id), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      setPurchaseOrders(prev => prev.filter(po => po._id !== id));
      setSuccessMessage('Purchase order deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete purchase order. Please try again.');
      console.error('Error deleting purchase order:', err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Purchase Orders</h1>
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr>
              <th className="px-6 py-3 border-b">Order Number</th>
              <th className="px-6 py-3 border-b">Vendor</th>
              <th className="px-6 py-3 border-b">Total Amount</th>
              <th className="px-6 py-3 border-b">Status</th>
              <th className="px-6 py-3 border-b">Created At</th>
              <th className="px-6 py-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map((po) => (
              <tr key={po._id}>
                <td className="px-6 py-4 border-b">{po.orderNumber}</td>
                <td className="px-6 py-4 border-b">{po.vendor}</td>
                <td className="px-6 py-4 border-b">₹{po.totalAmount.toFixed(2)}</td>
                <td className="px-6 py-4 border-b">
                  <span className={`px-2 py-1 rounded ${
                    po.status === 'approved' ? 'bg-green-100 text-green-800' :
                    po.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {po.status}
                  </span>
                </td>
                <td className="px-6 py-4 border-b">
                  {new Date(po.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 border-b">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusChange(po._id, 'approved')}
                      className="text-green-600 hover:text-green-900"
                      disabled={po.status === 'approved'}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(po._id, 'rejected')}
                      className="text-red-600 hover:text-red-900"
                      disabled={po.status === 'rejected'}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleDelete(po._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseOrderList; 