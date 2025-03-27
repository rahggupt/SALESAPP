import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface User {
  _id: string;
  username: string;
  fullName: string;
  phoneNumber: string;
  role: 'ADMIN' | 'USER' | 'VIEWER';
}

interface Vendor {
  _id: string;
  name: string;
}

interface Medicine {
  _id: string;
  name: string;
  unit: string;
}

interface PurchaseOrderItem {
  medicineId: string;
  quantity: number;
  medicine?: {
    name: string;
    unit: string;
  };
}

interface PurchaseOrder {
  _id: string;
  vendorId: string;
  vendor?: {
    name: string;
  };
  items: PurchaseOrderItem[];
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  createdBy: {
    _id: string;
    username: string;
  };
  assignee?: {
    _id: string;
    username: string;
  };
}

const PurchaseOrder: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const { token, isAdmin, user } = useAuth();
  const [formData, setFormData] = useState({
    vendorId: '',
    items: [{ medicineId: '', quantity: 1 }],
    assigneeId: ''
  });
  const [newAssignee, setNewAssignee] = useState({
    username: '',
    fullName: '',
    phoneNumber: '',
    role: 'USER' as const
  });
  const [assigneeError, setAssigneeError] = useState('');
  const [isCreatingAssignee, setIsCreatingAssignee] = useState(false);
  const [assigneeMode, setAssigneeMode] = useState<'select' | 'create'>('select');

  useEffect(() => {
    fetchVendors();
    fetchMedicines();
    fetchPurchaseOrders();
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/vendors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(response.data);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to load vendors');
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/medicines', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMedicines(response.data.medicines || []);
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('Failed to load medicines');
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/purchase-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPurchaseOrders(response.data);
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError('Failed to load purchase orders');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(
        'http://localhost:5000/api/purchase-orders',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Purchase order created successfully!');
      setShowForm(false);
      setFormData({
        vendorId: '',
        items: [{ medicineId: '', quantity: 1 }],
        assigneeId: ''
      });
      fetchPurchaseOrders();
    } catch (err) {
      console.error('Error creating purchase order:', err);
      setError('Failed to create purchase order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { medicineId: '', quantity: 1 }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: 'medicineId' | 'quantity', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleStatusChange = async (orderId: string, newStatus: 'pending' | 'completed' | 'cancelled') => {
    try {
      await axios.patch(
        `http://localhost:5000/api/purchase-orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPurchaseOrders();
      setSuccess('Purchase order status updated successfully!');
    } catch (err) {
      console.error('Error updating purchase order status:', err);
      setError('Failed to update purchase order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const createNewAssignee = async () => {
    try {
      setIsCreatingAssignee(true);
      setAssigneeError('');

      // Validate required fields
      if (!newAssignee.username.trim() || !newAssignee.fullName.trim() || !newAssignee.phoneNumber.trim()) {
        setAssigneeError('All fields are required');
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/users',
        {
          username: newAssignee.username,
          fullName: newAssignee.fullName,
          phoneNumber: newAssignee.phoneNumber,
          role: 'USER'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const newUser = response.data;
      setUsers(prev => [...prev, newUser]);
      setFormData(prev => ({ ...prev, assigneeId: newUser._id }));
      setNewAssignee({
        username: '',
        fullName: '',
        phoneNumber: '',
        role: 'USER'
      });
      setAssigneeMode('select');
      setSuccess(`New assignee created successfully! Initial password: ${response.data.initialPassword}`);
    } catch (err: any) {
      console.error('Error creating new assignee:', err);
      setAssigneeError(err.response?.data?.message || 'Failed to create new assignee');
    } finally {
      setIsCreatingAssignee(false);
    }
  };

  if (!isAdmin && user?.role !== 'VIEWER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
            <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Order
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {showForm && isAdmin && (
          <div className="bg-white shadow-lg rounded-lg p-8 mb-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create New Purchase Order</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor</label>
                  <select
                    value={formData.vendorId}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendorId: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select a vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor._id} value={vendor._id}>{vendor.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Assignee</label>
                  <div className="mt-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => setAssigneeMode('select')}
                        className={`px-3 py-1 text-sm rounded-md ${
                          assigneeMode === 'select'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Select Existing
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssigneeMode('create')}
                        className={`px-3 py-1 text-sm rounded-md ${
                          assigneeMode === 'create'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Create New
                      </button>
                    </div>

                    {assigneeMode === 'select' ? (
                      <select
                        value={formData.assigneeId}
                        onChange={(e) => setFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">Select an assignee</option>
                        {users.map(user => (
                          <option key={user._id} value={user._id}>{user.username}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Username</label>
                          <input
                            type="text"
                            value={newAssignee.username}
                            onChange={(e) => setNewAssignee(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="Enter username"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Full Name</label>
                          <input
                            type="text"
                            value={newAssignee.fullName}
                            onChange={(e) => setNewAssignee(prev => ({ ...prev, fullName: e.target.value }))}
                            placeholder="Enter full name"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                          <input
                            type="tel"
                            value={newAssignee.phoneNumber}
                            onChange={(e) => setNewAssignee(prev => ({ ...prev, phoneNumber: e.target.value }))}
                            placeholder="Enter phone number"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        {assigneeError && (
                          <p className="text-sm text-red-600">{assigneeError}</p>
                        )}
                        <button
                          type="button"
                          onClick={createNewAssignee}
                          disabled={!newAssignee.username.trim() || !newAssignee.fullName.trim() || !newAssignee.phoneNumber.trim() || isCreatingAssignee}
                          className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {isCreatingAssignee ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Creating...
                            </>
                          ) : (
                            'Create Assignee'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Item
                  </button>
                </div>

                {formData.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Medicine</label>
                        <select
                          value={item.medicineId}
                          onChange={(e) => handleItemChange(index, 'medicineId', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          required
                        >
                          <option value="">Select a medicine</option>
                          {medicines.map(medicine => (
                            <option key={medicine._id} value={medicine._id}>
                              {medicine.name}{medicine.unit ? ` (${medicine.unit})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                            className="flex-1 min-w-0 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                            required
                          />
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </>
                  ) : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {purchaseOrders.map((order) => (
              <li key={order._id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        Order #{order._id.slice(-6)}
                      </h3>
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        {isAdmin && (
                          <div className="relative">
                            <button
                              onClick={() => setEditingOrder(editingOrder === order._id ? null : order._id)}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                            {editingOrder === order._id && (
                              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                <div className="py-1" role="menu">
                                  {order.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleStatusChange(order._id, 'completed')}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        Mark as Complete
                                      </button>
                                      <button
                                        onClick={() => handleStatusChange(order._id, 'cancelled')}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        Cancel Order
                                      </button>
                                    </>
                                  )}
                                  {order.status === 'completed' && (
                                    <button
                                      onClick={() => handleStatusChange(order._id, 'pending')}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      Revert to Pending
                                    </button>
                                  )}
                                  {order.status === 'cancelled' && (
                                    <button
                                      onClick={() => handleStatusChange(order._id, 'pending')}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      Reactivate Order
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Vendor: {order.vendor?.name}</p>
                      <p>Created by: {order.createdBy?.username}</p>
                      {order.assignee && <p>Assigned to: {order.assignee.username}</p>}
                      <p>Created: {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700">Items:</h4>
                      <ul className="mt-2 space-y-2">
                        {order.items.map((item, index) => (
                          <li key={index} className="text-sm text-gray-600">
                            {item.medicine?.name} - {item.quantity} {item.medicine?.unit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrder; 