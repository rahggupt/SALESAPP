import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import API_ENDPOINTS from '../config/api';

interface PaymentHistory {
  amount: number;
  date: string;
  status: 'PAID' | 'PARTIAL';
}

interface Medicine {
  _id: string;
  name: string;
  category: string;
  composition: string[];
  price: number;
  stock: number;
  expiryDate: string;
  vendor: string;
  createdAt: string;
  paymentStatus?: 'PAID' | 'PARTIAL' | 'DUE';
  isActive?: boolean;
}

interface MedicineResponse {
  medicines: Medicine[];
  total: number;
  totalPages: number;
  currentPage: number;
  categories: string[];
}

interface VendorPaymentSummary {
  vendorId: string;
  vendorName: string;
  totalPayable: number;
  orders: {
    orderNumber: string;
    totalAmount: number;
    paidAmount: number;
    paymentStatus: string;
  }[];
}

// Add conversion function
const convertToINR = (nprPrice: number): number => {
  return nprPrice / 1.6; // 1 INR = 1.6 NPR
};

// Add function to calculate per piece price
const calculatePerPiecePrice = (price: number, unitsPerPackage: number): number => {
  return price / unitsPerPackage;
};

const MedicineList: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortField, setSortField] = useState<keyof Medicine>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editMedicine, setEditMedicine] = useState<Medicine | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const { token, isAdmin } = useAuth();
  const [showArchived, setShowArchived] = useState(false);
  const [compositionSearch, setCompositionSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [debouncedCompositionSearch, setDebouncedCompositionSearch] = useState('');
  const [vendorPayments, setVendorPayments] = useState<VendorPaymentSummary[]>([]);
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; medicine: Medicine | null }>({
    isOpen: false,
    medicine: null
  });
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PARTIAL' | 'DUE'>('DUE');
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [showPaymentHistory, setShowPaymentHistory] = useState<{ isOpen: boolean; medicine: Medicine | null }>({
    isOpen: false,
    medicine: null
  });

  // Update the debounce effect to use a longer delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setDebouncedCompositionSearch(compositionSearch);
    }, 800); // Increased debounce delay to 800ms
    return () => clearTimeout(timer);
  }, [searchTerm, compositionSearch]);

  // Fetch medicines only when debounced values change
  useEffect(() => {
    if (debouncedSearchTerm !== undefined || debouncedCompositionSearch !== undefined) {
      fetchMedicines();
    }
  }, [showArchived, currentPage, sortField, sortDirection, debouncedSearchTerm, debouncedCompositionSearch, categoryFilter]);

  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(API_ENDPOINTS.MEDICINES, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: 10,
          sortField,
          sortDirection,
          search: debouncedSearchTerm,
          composition: debouncedCompositionSearch,
          category: categoryFilter,
          archived: showArchived
        }
      });
      
      setMedicines(response.data.medicines);
      setTotalPages(response.data.totalPages);
      setCategories(response.data.categories);
    } catch (err) {
      setError('Failed to fetch medicines');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) {
      return;
    }
    
    try {
      await axios.delete(API_ENDPOINTS.MEDICINE_BY_ID(id), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      setMedicines(prev => prev.filter(medicine => medicine._id !== id));
      setDeleteConfirm(null);
      setSuccessMessage('Medicine deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete medicine');
      setDeleteConfirm(null);
    }
  };

  const handleUpdateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMedicine) return;

    try {
      await axios.put(
        API_ENDPOINTS.MEDICINE_BY_ID(editMedicine._id),
        editMedicine,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the medicines list with the edited medicine
      setMedicines(
        medicines.map(med => med._id === editMedicine._id ? editMedicine : med)
      );
      
      setEditMedicine(null);
      setSuccessMessage('Medicine updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to update medicine');
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editMedicine) return;
    
    const { name, value, type } = e.target;
    setEditMedicine({
      ...editMedicine,
      [name]: type === 'number' ? parseFloat(value) : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const toggleSort = (field: keyof Medicine) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Local filtering function
  const getFilteredMedicines = () => {
    return medicines.filter(medicine => {
      const searchTermLower = searchTerm.toLowerCase();
      const compositionSearchLower = compositionSearch.toLowerCase();
      
      const matchesSearch = 
        (medicine.name?.toLowerCase() || '').includes(searchTermLower) ||
        (medicine.composition?.some((comp: string) => 
          comp.toLowerCase().includes(searchTermLower)
        ) ?? false);
      
      const matchesComposition = !compositionSearchLower || 
        (medicine.composition?.some((comp: string) => 
          comp.toLowerCase().includes(compositionSearchLower)
        ) ?? false);
      
      const matchesCategory = !categoryFilter || medicine.category === categoryFilter;
      
      return matchesSearch && matchesComposition && matchesCategory;
    });
  };

  // Use memoized filtered medicines
  const filteredMedicines = React.useMemo(() => {
    const filtered = getFilteredMedicines();
    return filtered.sort((a, b) => {
      const aValue = a[sortField] ?? '';
      const bValue = b[sortField] ?? '';
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [medicines, searchTerm, compositionSearch, categoryFilter, sortField, sortDirection]);

  const handleArchive = async (medicineId: string) => {
    try {
      await axios.put(API_ENDPOINTS.MEDICINE_ARCHIVE(medicineId), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Medicine archived successfully');
      fetchMedicines();
    } catch (err) {
      setError('Failed to archive medicine');
      console.error('Error archiving medicine:', err);
    }
  };

  const handleUnarchive = async (medicineId: string) => {
    try {
      await axios.put(API_ENDPOINTS.MEDICINE_UNARCHIVE(medicineId), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Medicine unarchived successfully');
      fetchMedicines();
    } catch (err) {
      setError('Failed to unarchive medicine');
      console.error('Error unarchiving medicine:', err);
    }
  };

  const fetchVendorPayments = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.PURCHASE_ORDERS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Calculate vendor payment summaries
      const vendorSummaries = response.data.reduce((acc: { [key: string]: VendorPaymentSummary }, order: any) => {
        if (order.paymentStatus !== 'PAID') {
          const vendorId = order.vendorId._id;
          if (!acc[vendorId]) {
            acc[vendorId] = {
              vendorId,
              vendorName: order.vendorId.name,
              totalPayable: 0,
              orders: []
            };
          }
          
          acc[vendorId].totalPayable += order.totalAmount - order.paidAmount;
          acc[vendorId].orders.push({
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            paidAmount: order.paidAmount,
            paymentStatus: order.paymentStatus
          });
        }
        return acc;
      }, {});
      
      setVendorPayments(Object.values(vendorSummaries));
    } catch (err) {
      console.error('Error fetching vendor payments:', err);
    }
  };

  useEffect(() => {
    fetchVendorPayments();
  }, [token]);

  const fetchPaymentHistory = async (medicineId: string) => {
    try {
      const response = await axios.get(
        API_ENDPOINTS.MEDICINE_PAYMENT_HISTORY(medicineId),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPaymentHistory(response.data.paymentHistory);
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setError('Failed to fetch payment history');
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentModal.medicine) return;

    try {
      await axios.put(
        API_ENDPOINTS.MEDICINE_PAYMENT(paymentModal.medicine._id),
        {
          paidAmount: paymentAmount,
          paymentStatus
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh medicines list and payment history
      fetchMedicines();
      if (showPaymentHistory.isOpen && showPaymentHistory.medicine) {
        fetchPaymentHistory(showPaymentHistory.medicine._id);
      }

      setPaymentModal({ isOpen: false, medicine: null });
      setPaymentAmount(0);
      setPaymentStatus('DUE');
      setSuccessMessage('Payment status updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to update payment status');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error && !medicines.length) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={fetchMedicines}
              className="mt-2 text-sm text-red-700 underline hover:text-red-900"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
              <Link to="/view-prices" className="text-white hover:text-indigo-100 flex items-center">
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                View Prices
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {successMessage && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {showArchived ? 'Archived Medicines' : 'Medicine Inventory'}
              </h2>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  showArchived
                    ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showArchived ? 'Show Active' : 'Show Archived'}
              </button>
            </div>
            {isAdmin && !showArchived && (
              <Link
                to="/medicines/add"
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-indigo-700 hover:to-indigo-800 transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-md flex items-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Medicine
              </Link>
            )}
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
                <div className="flex-1">
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name, description, or manufacturer"
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search by composition"
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={compositionSearch}
                      onChange={(e) => setCompositionSearch(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="w-full md:w-64">
                  <select
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Medicine Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center">
                        Name
                        {sortField === 'name' && (
                          <svg className={`ml-1 h-5 w-5 ${sortDirection === 'asc' ? '' : 'transform rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort('category')}
                    >
                      <div className="flex items-center">
                        Category
                        {sortField === 'category' && (
                          <svg className={`ml-1 h-5 w-5 ${sortDirection === 'asc' ? '' : 'transform rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort('price')}
                    >
                      <div className="flex items-center">
                        Price
                        {sortField === 'price' && (
                          <svg className={`ml-1 h-5 w-5 ${sortDirection === 'asc' ? '' : 'transform rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort('stock')}
                    >
                      <div className="flex items-center">
                        Stock
                        {sortField === 'stock' && (
                          <svg className={`ml-1 h-5 w-5 ${sortDirection === 'asc' ? '' : 'transform rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort('expiryDate')}
                    >
                      <div className="flex items-center">
                        Expiry Date
                        {sortField === 'expiryDate' && (
                          <svg className={`ml-1 h-5 w-5 ${sortDirection === 'asc' ? '' : 'transform rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Storage
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Composition
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    {isAdmin && !showArchived && (
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMedicines.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 9 : 8} className="px-6 py-4 text-center">
                        <div className="text-gray-500">
                          No medicines found matching your search criteria
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMedicines.map((medicine) => (
                      <tr key={medicine._id} className={`hover:bg-gray-50 ${!medicine.isActive ? 'bg-gray-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-indigo-600">
                            {medicine.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {medicine.composition.join(', ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                            {medicine.category.charAt(0).toUpperCase() + medicine.category.slice(1).replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            ₹{medicine.price.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            medicine.stock > 10 ? 'bg-green-100 text-green-800' :
                            medicine.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {medicine.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(medicine.expiryDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {medicine.vendor}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(medicine.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              medicine.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                              medicine.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {medicine.paymentStatus}
                            </span>
                          </div>
                        </td>
                        {isAdmin && !showArchived && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {medicine.isActive ? (
                                <button
                                  onClick={() => handleArchive(medicine._id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Archive
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnarchive(medicine._id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Unarchive
                                </button>
                              )}
                              <button
                                onClick={() => setEditMedicine(medicine)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing {medicines.length} of {totalPages * 10} medicines
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this medicine? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Medicine Modal */}
      {editMedicine && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Medicine</h3>
            
            <form onSubmit={handleUpdateMedicine} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editMedicine.name}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    name="category"
                    value={editMedicine.category}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="prescription">Prescription</option>
                    <option value="over-the-counter">Over the Counter</option>
                    <option value="vitamins">Vitamins</option>
                    <option value="supplements">Supplements</option>
                    <option value="antibiotics">Antibiotics</option>
                    <option value="pain-relief">Pain Relief</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="composition"
                  value={editMedicine.composition.join(', ')}
                  onChange={(e) => setEditMedicine({
                    ...editMedicine,
                    composition: e.target.value.split(',').map(c => c.trim())
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={editMedicine.price}
                    onChange={handleEditChange}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock</label>
                  <input
                    type="number"
                    name="stock"
                    value={editMedicine.stock}
                    onChange={handleEditChange}
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                  <input
                    type="month"
                    name="expiryDate"
                    value={editMedicine.expiryDate}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor</label>
                  <input
                    type="text"
                    name="vendor"
                    value={editMedicine.vendor}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 space-x-3">
                <button
                  type="button"
                  onClick={() => setEditMedicine(null)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {vendorPayments.length > 0 && (
        <div className="mt-8 bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Vendor Payment Summary</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {vendorPayments.map((vendor) => (
                <div key={vendor.vendorId} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{vendor.vendorName}</h4>
                      <p className="text-sm text-gray-500">Total Payable: ₹{vendor.totalPayable.toFixed(2)}</p>
                    </div>
                    <Link
                      to={`/purchase-orders?vendor=${vendor.vendorId}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Orders
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {vendor.orders.map((order) => (
                      <div key={order.orderNumber} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          Order #{order.orderNumber} ({order.paymentStatus})
                        </span>
                        <span className="font-medium text-gray-900">
                          ₹{(order.totalAmount - order.paidAmount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal.isOpen && paymentModal.medicine && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Payment Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Medicine</label>
                <p className="mt-1 text-sm text-gray-900">{paymentModal.medicine.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                <p className="mt-1 text-sm text-gray-900">₹{paymentModal.medicine.price.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  min="0"
                  max={paymentModal.medicine.price}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as 'PAID' | 'PARTIAL' | 'DUE')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="PAID">Paid</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="DUE">Due</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setPaymentModal({ isOpen: false, medicine: null })}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSubmit}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Update Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistory.isOpen && showPaymentHistory.medicine && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
              <button
                onClick={() => setShowPaymentHistory({ isOpen: false, medicine: null })}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700">Medicine Details</h4>
              <p className="text-sm text-gray-900">{showPaymentHistory.medicine.name}</p>
              <p className="text-sm text-gray-500">Vendor: {showPaymentHistory.medicine.vendor}</p>
              <p className="text-sm text-gray-500">
                Total Amount: ₹{showPaymentHistory.medicine.price.toFixed(2)}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentHistory.map((payment, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{payment.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineList; 