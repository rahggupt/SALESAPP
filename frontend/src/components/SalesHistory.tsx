import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import API_ENDPOINTS from '../config/api';

interface Medicine {
  medicineId: {
    name: string;
  };
  quantity: number;
  price: number;
  subtotal: number;
}

interface Sale {
  _id: string;
  customer: string;
  items: Medicine[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentType: 'CASH' | 'CREDIT' | 'CARD' | 'UPI' | 'INSURANCE';
  paymentStatus: 'PAID' | 'DUE' | 'PARTIAL';
  paidAmount: number;
  dueAmount: number;
  date: string;
  notes?: string;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

const SalesHistory: React.FC = () => {
  const { token } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'ALL' | 'CASH' | 'CREDIT' | 'CARD' | 'UPI' | 'INSURANCE'>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'PAID' | 'DUE' | 'PARTIAL'>('ALL');
  const [stats, setStats] = useState({
    totalSales: 0,
    totalAmount: 0,
    cashSales: 0,
    creditSales: 0,
    paidAmount: 0,
    dueAmount: 0
  });

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.SALES_HISTORY, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          paymentType: paymentTypeFilter !== 'ALL' ? paymentTypeFilter : undefined,
          paymentStatus: paymentStatusFilter !== 'ALL' ? paymentStatusFilter : undefined
        }
      });

      setSales(response.data);
      calculateStats(response.data);
    } catch (err) {
      setError('Failed to fetch sales history');
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (salesData: Sale[]) => {
    const newStats = salesData.reduce((acc, sale) => ({
      totalSales: acc.totalSales + 1,
      totalAmount: acc.totalAmount + sale.finalAmount,
      cashSales: acc.cashSales + (sale.paymentType === 'CASH' ? 1 : 0),
      creditSales: acc.creditSales + (sale.paymentType === 'CREDIT' ? 1 : 0),
      paidAmount: acc.paidAmount + sale.paidAmount,
      dueAmount: acc.dueAmount + sale.dueAmount
    }), {
      totalSales: 0,
      totalAmount: 0,
      cashSales: 0,
      creditSales: 0,
      paidAmount: 0,
      dueAmount: 0
    });

    setStats(newStats);
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  useEffect(() => {
    fetchSales();
  }, [dateRange, paymentTypeFilter, paymentStatusFilter, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold">Shyama Pharmacy</h1>
              <p className="mt-1 text-indigo-100">Your health is our priority</p>
            </div>
            <div>
              <Link to="/dashboard" className="text-white hover:text-indigo-100 flex items-center">
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              <Link to="/sales/new" className="text-white hover:text-indigo-100 flex items-center">
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Sale
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700">
                Payment Type
              </label>
              <select
                id="paymentType"
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value as 'ALL' | 'CASH' | 'CREDIT' | 'CARD' | 'UPI' | 'INSURANCE')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="ALL">All Types</option>
                <option value="CASH">Cash</option>
                <option value="CREDIT">Credit</option>
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
                <option value="INSURANCE">Insurance</option>
              </select>
            </div>
            <div>
              <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700">
                Payment Status
              </label>
              <select
                id="paymentStatus"
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value as 'ALL' | 'PAID' | 'DUE' | 'PARTIAL')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="DUE">Due</option>
                <option value="PARTIAL">Partial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.totalSales}</div>
                      <div className="ml-2">
                        <span className="text-sm text-gray-500">
                          ({stats.cashSales} cash, {stats.creditSales} credit)
                        </span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Amount</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalAmount)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Receivables</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.dueAmount)}</div>
                      <div className="ml-2">
                        <span className="text-sm text-gray-500">
                          ({formatCurrency(stats.paidAmount)} paid)
                        </span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(sale.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{sale._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.customer || <span className="text-gray-500">Walk-in Customer</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col space-y-1">
                        {sale.items.map((item, index) => (
                          <div key={index} className="text-sm">
                            {item.quantity} x {item.medicineId.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{formatCurrency(sale.totalAmount)}</div>
                      {sale.discount > 0 && (
                        <div className="text-xs text-gray-500">
                          Discount: {formatCurrency(sale.discount)}
                        </div>
                      )}
                      <div className="font-medium">
                        Net: {formatCurrency(sale.finalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        sale.paymentType === 'CASH' ? 'bg-green-100 text-green-800' :
                        sale.paymentType === 'CREDIT' ? 'bg-blue-100 text-blue-800' :
                        sale.paymentType === 'CARD' ? 'bg-yellow-100 text-yellow-800' :
                        sale.paymentType === 'UPI' ? 'bg-purple-100 text-purple-800' :
                        'bg-indigo-100 text-indigo-800'
                      }`}>
                        {sale.paymentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        sale.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                        sale.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {sale.dueAmount > 0 ? (
                        <span className="text-red-600 font-medium">
                          {formatCurrency(sale.dueAmount)}
                        </span>
                      ) : (
                        <span className="text-green-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesHistory; 