import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  ShoppingCartIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

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
  price: number;
}

interface PurchaseOrderItem {
  medicineId: string;
  quantity: number;
  medicine?: {
    _id: string;
    name: string;
    unit: string;
  };
}

interface PurchaseOrder {
  _id: string;
  orderNumber: string;
  vendorId: {
    _id: string;
    name: string;
  };
  items: {
    medicineId: {
      _id: string;
      name: string;
      unit: string;
    };
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'archived';
  paymentStatus: 'PAID' | 'PARTIAL' | 'DUE';
  paidAmount: number;
  assignee: {
    _id: string;
    username: string;
  };
  createdAt: string;
  isArchived: boolean;
}

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalItems: number;
  totalValue: number;
}

interface ColumnVisibility {
  orderNumber: boolean;
  vendor: boolean;
  items: boolean;
  quantity: boolean;
  total: boolean;
  status: boolean;
  paymentStatus: boolean;
  payable: boolean;
  assignee: boolean;
  date: boolean;
  actions: boolean;
}

const PurchaseOrder: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalItems: 0,
    totalValue: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [showNewAssigneeForm, setShowNewAssigneeForm] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    orderNumber: true,
    vendor: true,
    items: true,
    quantity: true,
    total: true,
    status: true,
    paymentStatus: true,
    payable: true,
    assignee: true,
    date: true,
    actions: true
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    fetchVendors();
    fetchMedicines();
    fetchOrders();
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

  const calculateStats = (orders: PurchaseOrder[]) => {
    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      totalItems: orders.reduce((sum, order) => sum + order.items.length, 0),
      totalValue: orders.reduce((sum, order) => 
        sum + order.items.reduce((itemSum, item) => itemSum + ((item.quantity || 0) * (item.price || 0)), 0), 0)
    };
    setStats(stats);
  };

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders...');
      const response = await axios.get('http://localhost:5000/api/purchase-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // console.log('Orders response:', JSON.stringify(response.data, null, 2));
      setOrders(response.data);
      calculateStats(response.data);
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError('Failed to load purchase orders');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate required fields
    if (!formData.vendorId) {
      setError('Please select a vendor');
      setLoading(false);
      return;
    }

    if (!formData.assigneeId) {
      setError('Please select an assignee');
      setLoading(false);
      return;
    }

    // Validate that all items have valid medicine IDs
    const invalidItems = formData.items.filter(item => !item.medicineId);
    if (invalidItems.length > 0) {
      setError('Please select a medicine for all items');
      setLoading(false);
      return;
    }

    try {
      // Transform items to include medicine details
      const transformedItems = formData.items.map(item => ({
        medicineId: item.medicineId,
        quantity: item.quantity
      }));

      const response = await axios.post(
        'http://localhost:5000/api/purchase-orders',
        {
          vendorId: formData.vendorId,
          items: transformedItems,
          assigneeId: formData.assigneeId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the orders state with the new order
      setOrders(prevOrders => [...prevOrders, response.data]);
      
      setSuccess('Purchase order created successfully!');
      setShowForm(false);
      setFormData({
        vendorId: '',
        items: [{ medicineId: '', quantity: 1 }],
        assigneeId: ''
      });
    } catch (err: any) {
      console.error('Error creating purchase order:', err);
      setError(err.response?.data?.message || 'Failed to create purchase order. Please try again.');
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

  const handleStatusChange = async (orderId: string, newStatus: 'pending' | 'completed' | 'cancelled' | 'archived') => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/purchase-orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? response.data : order
        )
      );
      
      setSuccess('Purchase order status updated successfully!');
    } catch (err) {
      console.error('Error updating purchase order status:', err);
      setError('Failed to update purchase order status');
    }
  };

  const handleAssigneeChange = async (orderId: string, newAssigneeId: string) => {
    try {
      // If newAssigneeId is empty string, send null to unassign
      const assigneeValue = newAssigneeId === '' ? null : newAssigneeId;
      
      const response = await axios.patch(
        `http://localhost:5000/api/purchase-orders/${orderId}/assignee`,
        { assignee: assigneeValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? response.data : order
        )
      );
      
      setSuccess('Assignee updated successfully!');
    } catch (err) {
      console.error('Error updating assignee:', err);
      setError('Failed to update assignee');
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

      // Generate a unique email based on username
      const email = `${newAssignee.username.toLowerCase().replace(/\s+/g, '')}@example.com`;

      const response = await axios.post(
        'http://localhost:5000/api/users',
        {
          username: newAssignee.username,
          fullName: newAssignee.fullName,
          phoneNumber: newAssignee.phoneNumber,
          email: email,
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

  const getFilteredAndSortedOrders = () => {
    let filteredOrders = [...orders];

    // Apply status filter
    if (filters.status !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === filters.status);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        switch (filters.dateRange) {
          case 'today':
            return orderDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        (order.vendorId?.name?.toLowerCase() || '').includes(searchLower) ||
        (order.assignee?.username?.toLowerCase() || '').includes(searchLower) ||
        (order.orderNumber?.toLowerCase() || '').includes(searchLower) ||
        order.items.some(item => 
          (item.medicineId?.name?.toLowerCase() || '').includes(searchLower)
        )
      );
    }

    // Sort by date by default (newest first)
    return filteredOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const getPaginatedOrders = () => {
    const filteredOrders = getFilteredAndSortedOrders();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filteredOrders = getFilteredAndSortedOrders();
    return Math.ceil(filteredOrders.length / itemsPerPage);
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order._id));
    }
  };

  const handlePrintOrders = () => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order to print');
      return;
    }

    const selectedOrdersData = orders.filter(order => selectedOrders.includes(order._id));
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Purchase Orders</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h1 { margin: 0; font-size: 24px; }
              .header p { margin: 5px 0; color: #666; }
              .order-info { margin-bottom: 20px; }
              .order-info p { margin: 5px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Shyama Pharmacy</h1>
              <p>Mahabir Road, Birgunj - 10</p>
              <p>Phone: +91 9845099594 | Email: info@shyamapharmacy.com</p>
            </div>
            ${selectedOrdersData.map(order => `
              <div style="page-break-after: always;">
                <div class="order-info">
                  <h2>Order #${order.orderNumber}</h2>
                  <p><strong>Vendor:</strong> ${order.vendorId.name}</p>
                  <p><strong>Assigned To:</strong> ${order.assignee?.username || 'Unassigned'}</p>
                  <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.items.map(item => `
                      <tr>
                        <td>${item.medicineId.name}</td>
                        <td>${item.quantity}</td>
                        <td>₹${(item.price || 0).toFixed(2)}</td>
                        <td>₹${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                    <tr>
                      <td colspan="3"><strong>Total Amount</strong></td>
                      <td><strong>₹${(order.totalAmount || 0).toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `).join('')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleArchiveOrder = async (orderId: string) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/purchase-orders/${orderId}/status`,
        { status: 'archived' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? response.data : order
        )
      );
      
      setSuccess('Order archived successfully');
    } catch (err: any) {
      console.error('Error archiving order:', err);
      setError(err.response?.data?.message || 'Failed to archive order');
    }
  };

  const handleUnarchiveOrder = async (orderId: string) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/purchase-orders/${orderId}/status`,
        { status: 'pending' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? response.data : order
        )
      );
      
      setSuccess('Order unarchived successfully');
    } catch (err: any) {
      console.error('Error unarchiving order:', err);
      setError(err.response?.data?.message || 'Failed to unarchive order');
    }
  };

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const handlePaymentStatusChange = async (orderId: string, newStatus: 'PAID' | 'PARTIAL' | 'DUE', paidAmount?: number) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/purchase-orders/${orderId}/payment`,
        { paymentStatus: newStatus, paidAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError('Failed to update payment status');
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedOrder) return;
    
    try {
      const newStatus = paymentAmount >= selectedOrder.totalAmount ? 'PAID' : 'PARTIAL';
      await handlePaymentStatusChange(selectedOrder._id, newStatus, paymentAmount);
      setShowPaymentModal(false);
      setSelectedOrder(null);
      setPaymentAmount(0);
    } catch (err) {
      console.error('Error submitting payment:', err);
      setError('Failed to submit payment');
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
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCartIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.totalOrders}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.pendingOrders}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed Orders</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.completedOrders}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Cancelled Orders</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.cancelledOrders}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Search</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Search by order #, vendor, user, or medicine..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ShoppingCartIcon className="h-5 w-5 mr-2" />
              New Order
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
                  Create Order
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Column Visibility Controls */}
        <div className="bg-white shadow rounded-lg mb-4 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Visible Columns</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(columnVisibility).map(([column, isVisible]) => (
              <label key={column} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => toggleColumn(column as keyof ColumnVisibility)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, ' $1')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              onClick={handlePrintOrders}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              disabled={selectedOrders.length === 0}
            >
              Print Selected Orders
            </button>
          </div>
        </div>

        {/* Active Orders Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Active Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columnVisibility.actions && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === orders.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                  )}
                  {columnVisibility.orderNumber && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                  )}
                  {columnVisibility.vendor && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                  )}
                  {columnVisibility.items && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                  )}
                  {columnVisibility.quantity && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                  )}
                  {columnVisibility.total && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  )}
                  {columnVisibility.status && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  )}
                  {columnVisibility.assignee && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                  )}
                  {columnVisibility.date && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  )}
                  {columnVisibility.paymentStatus && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                  )}
                  {columnVisibility.payable && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payable Amount
                    </th>
                  )}
                  {columnVisibility.actions && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredAndSortedOrders().filter(order => order.status !== 'archived').map((order) => (
                  <tr key={order._id}>
                    {columnVisibility.actions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order._id)}
                          onChange={() => handleOrderSelect(order._id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                    )}
                    {columnVisibility.orderNumber && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.orderNumber}
                      </td>
                    )}
                    {columnVisibility.vendor && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.vendorId.name}
                      </td>
                    )}
                    {columnVisibility.items && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <span className="text-gray-900">{item.medicineId.name}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    )}
                    {columnVisibility.quantity && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="text-gray-900">
                              {item.quantity}
                            </div>
                          ))}
                        </div>
                      </td>
                    )}
                    {columnVisibility.total && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="text-gray-900">
                              ₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)} (₹{(item.price || 0).toFixed(2)} per piece)
                            </div>
                          ))}
                          <div className="font-semibold border-t pt-1">
                            Total: ₹{(order.totalAmount || 0).toFixed(2)}
                          </div>
                        </div>
                      </td>
                    )}
                    {columnVisibility.status && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value as 'pending' | 'completed' | 'cancelled' | 'archived')}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="archived">Archived</option>
                        </select>
                      </td>
                    )}
                    {columnVisibility.assignee && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <select
                          value={order.assignee?._id || ''}
                          onChange={(e) => handleAssigneeChange(order._id, e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        >
                          <option value="">Unassigned</option>
                          {users.map(user => (
                            <option key={user._id} value={user._id}>{user.username}</option>
                          ))}
                        </select>
                      </td>
                    )}
                    {columnVisibility.date && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    )}
                    {columnVisibility.paymentStatus && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                          order.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.paymentStatus}
                        </span>
                        {order.paymentStatus !== 'PAID' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setPaymentAmount(order.totalAmount - order.paidAmount);
                              setShowPaymentModal(true);
                            }}
                            className="ml-2 text-indigo-600 hover:text-indigo-900"
                          >
                            Update Payment
                          </button>
                        )}
                      </td>
                    )}
                    {columnVisibility.payable && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          order.paymentStatus === 'PAID' ? 'text-green-600' :
                          order.paymentStatus === 'PARTIAL' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          ₹{(order.totalAmount - order.paidAmount).toFixed(2)}
                        </span>
                      </td>
                    )}
                    {columnVisibility.actions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order._id)}
                            onChange={() => handleOrderSelect(order._id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() => handleArchiveOrder(order._id)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Archive Order"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Archived Orders Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Archived Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredAndSortedOrders().filter(order => order.status === 'archived').map((order) => (
                  <tr key={order._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.vendorId.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-sm">
                            {item.quantity} x {item.medicineId.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{(order.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.assignee?.username || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUnarchiveOrder(order._id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Unarchive Order"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showPaymentModal && selectedOrder && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Payment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    ₹{selectedOrder.totalAmount.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    ₹{selectedOrder.paidAmount.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount to Pay</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                    min="0"
                    max={selectedOrder.totalAmount - selectedOrder.paidAmount}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedOrder(null);
                    setPaymentAmount(0);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Submit Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrder; 