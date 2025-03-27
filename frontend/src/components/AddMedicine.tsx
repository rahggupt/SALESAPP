import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Vendor {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface VendorFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface MedicineFormData {
  name: string;
  composition: string[];
  description: string;
  category: string;
  price: number;
  currency: 'INR' | 'NPR';
  priceUnit: string;
  stock: number;
  expiryDate: string;
  manufacturer: string;
  batchNumber: string;
  requiresPrescription: boolean;
  storage: 'cold' | 'extreme_cold' | 'hot' | 'extreme_hot';
  vendor: string;
  purchasePrice: number;
  paymentStatus: 'PAID' | 'DUE' | 'PARTIAL';
  paidAmount: number;
}

const AddMedicine: React.FC = () => {
  const [formData, setFormData] = useState<MedicineFormData>({
    name: '',
    composition: [],
    description: '',
    category: '',
    price: 0,
    currency: 'NPR',
    priceUnit: 'piece',
    stock: 0,
    expiryDate: '',
    manufacturer: '',
    batchNumber: '',
    requiresPrescription: false,
    storage: 'cold',
    vendor: '',
    purchasePrice: 0,
    paymentStatus: 'DUE',
    paidAmount: 0
  });
  const [currentComposition, setCurrentComposition] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [compositions, setCompositions] = useState<string[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [compositionSuggestions, setCompositionSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string>('');
  const navigate = useNavigate();
  const { token, isAdmin, user } = useAuth();

  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorFormData, setVendorFormData] = useState<VendorFormData>({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [vendorError, setVendorError] = useState('');

  useEffect(() => {
    // Check if user is admin, if not redirect to dashboard
    if (user && !isAdmin) {
      navigate('/');
    }
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    fetchCategories();
    fetchCompositions();
    fetchVendors();
  }, [token]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/medicines/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    }
  };

  const fetchCompositions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/medicines/compositions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompositions(response.data);
    } catch (err) {
      console.error('Error fetching compositions:', err);
      setError('Failed to load compositions');
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

  // Function to convert price to NPR
  const convertToNPR = (price: number, currency: 'INR' | 'NPR'): number => {
    if (currency === 'NPR') return price;
    return price * 1.6; // 1 INR = 1.6 NPR
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Debug log for required fields
      console.log('Required fields check:', {
        paymentStatus: formData.paymentStatus,
        purchasePrice: formData.purchasePrice,
        vendor: formData.vendor,
        storage: formData.storage
      });

      // Validate all required fields
      const requiredFields = {
        name: 'Medicine name',
        category: 'Category',
        vendor: 'Vendor',
        storage: 'Storage requirements',
        manufacturer: 'Manufacturer',
        batchNumber: 'Batch number',
        expiryDate: 'Expiry date',
        purchasePrice: 'Purchase price',
        paymentStatus: 'Payment status'
      };

      for (const [field, label] of Object.entries(requiredFields)) {
        const value = formData[field as keyof MedicineFormData];
        if (!value || (typeof value === 'string' && !value.trim())) {
          setError(`${label} is required`);
          setLoading(false);
          return;
        }
      }

      if (formData.composition.length === 0) {
        setError('Please add at least one composition');
        setLoading(false);
        return;
      }

      if (formData.price <= 0) {
        setError('Price must be greater than 0');
        setLoading(false);
        return;
      }

      if (formData.purchasePrice <= 0) {
        setError('Purchase price must be greater than 0');
        setLoading(false);
        return;
      }

      if (formData.stock < 0) {
        setError('Stock cannot be negative');
        setLoading(false);
        return;
      }

      // Validate paid amount based on payment status
      if (formData.paymentStatus === 'PAID' && formData.paidAmount !== formData.purchasePrice) {
        setError('Paid amount must equal purchase price for PAID status');
        setLoading(false);
        return;
      }

      if (formData.paymentStatus === 'DUE' && formData.paidAmount !== 0) {
        setError('Paid amount must be 0 for DUE status');
        setLoading(false);
        return;
      }

      if (formData.paymentStatus === 'PARTIAL' && (formData.paidAmount >= formData.purchasePrice || formData.paidAmount <= 0)) {
        setError('Paid amount must be greater than 0 and less than purchase price for PARTIAL status');
        setLoading(false);
        return;
      }

      const priceInNPR = convertToNPR(formData.price, formData.currency);
      
      // Calculate due amount based on payment status
      let dueAmount = 0;
      if (formData.paymentStatus === 'DUE') {
        dueAmount = formData.purchasePrice;
      } else if (formData.paymentStatus === 'PARTIAL') {
        dueAmount = formData.purchasePrice - formData.paidAmount;
      }

      const medicineData = {
        name: formData.name.trim(),
        composition: formData.composition,
        description: formData.description.trim(),
        category: formData.category.trim(),
        price: priceInNPR,
        currency: formData.currency,
        priceUnit: formData.priceUnit,
        stock: Number(formData.stock),
        expiryDate: formData.expiryDate,
        manufacturer: formData.manufacturer.trim(),
        batchNumber: formData.batchNumber.trim(),
        requiresPrescription: formData.requiresPrescription,
        storage: formData.storage,
        vendor: formData.vendor,
        purchasePrice: Number(formData.purchasePrice),
        paymentStatus: formData.paymentStatus,
        paidAmount: Number(formData.paidAmount),
        dueAmount: Number(dueAmount)
      };

      // Debug logs
      console.log('Final medicine data:', {
        ...medicineData,
        _debug: {
          paymentStatusType: typeof medicineData.paymentStatus,
          purchasePriceType: typeof medicineData.purchasePrice,
          vendorType: typeof medicineData.vendor,
          storageType: typeof medicineData.storage
        }
      });

      // Create medicine
      const medicineResponse = await axios.post('http://localhost:5000/api/medicines', medicineData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Create vendor transaction
      const transactionData = {
        medicine: medicineResponse.data._id,
        transactionType: 'PURCHASE',
        amount: Number(formData.purchasePrice),
        paymentStatus: formData.paymentStatus,
        paidAmount: Number(formData.paidAmount),
        dueAmount: Number(dueAmount),
        notes: `Purchase of medicine: ${formData.name}`
      };

      await axios.post(`http://localhost:5000/api/vendors/${formData.vendor}/transactions`, transactionData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Medicine added successfully!');
      setFormData({
        name: '',
        composition: [],
        description: '',
        category: '',
        price: 0,
        currency: 'NPR',
        priceUnit: 'piece',
        stock: 0,
        expiryDate: '',
        manufacturer: '',
        batchNumber: '',
        requiresPrescription: false,
        storage: 'cold',
        vendor: '',
        purchasePrice: 0,
        paymentStatus: 'DUE',
        paidAmount: 0
      });
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error('Error adding medicine:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add medicine. Please try again.';
      console.error('Error details:', err.response?.data); // Add this for debugging
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle numeric inputs
    if (type === 'number') {
      const numValue = value === '' ? 0 : parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
      return;
    }

    // Handle checkbox inputs
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
      return;
    }

    // Handle expiry date
    if (name === 'expiryDate') {
      // Format the date to MM/YYYY
      const date = new Date(value + '-01');  // Add day to make it a valid date
      const formattedDate = date.toISOString().slice(0, 7);  // Get YYYY-MM format
      setFormData(prev => ({
        ...prev,
        [name]: formattedDate
      }));
      return;
    }

    // Handle payment status change
    if (name === 'paymentStatus') {
      const paymentStatus = value as 'PAID' | 'DUE' | 'PARTIAL';
      setFormData(prev => {
        const newState = {
          ...prev,
          paymentStatus,
          paidAmount: paymentStatus === 'PAID' ? prev.purchasePrice : paymentStatus === 'DUE' ? 0 : prev.paidAmount
        };
        return newState;
      });
      return;
    }

    // Handle paid amount change
    if (name === 'paidAmount') {
      const numValue = value === '' ? 0 : parseFloat(value);
      const paidAmount = isNaN(numValue) ? 0 : numValue;
      
      // Validate paid amount based on payment status
      if (formData.paymentStatus === 'PAID' && paidAmount !== formData.purchasePrice) {
        setError('Paid amount must equal purchase price for PAID status');
        return;
      }
      if (formData.paymentStatus === 'DUE' && paidAmount !== 0) {
        setError('Paid amount must be 0 for DUE status');
        return;
      }
      if (formData.paymentStatus === 'PARTIAL' && (paidAmount >= formData.purchasePrice || paidAmount <= 0)) {
        setError('Paid amount must be greater than 0 and less than purchase price for PARTIAL status');
        return;
      }

      setFormData(prev => ({
        ...prev,
        paidAmount
      }));
      setError('');
      return;
    }

    // Handle purchase price change
    if (name === 'purchasePrice') {
      const numValue = value === '' ? 0 : parseFloat(value);
      const purchasePrice = isNaN(numValue) ? 0 : numValue;
      
      setFormData(prev => {
        const newState = {
          ...prev,
          purchasePrice,
          paidAmount: prev.paymentStatus === 'PAID' ? purchasePrice : prev.paymentStatus === 'DUE' ? 0 : prev.paidAmount
        };
        return newState;
      });
      return;
    }

    // Handle all other inputs
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCompositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentComposition(value);
    
    if (value) {
      const suggestions = compositions.filter(comp => 
        comp.toLowerCase().includes(value.toLowerCase())
      );
      setCompositionSuggestions(suggestions);
    } else {
      setCompositionSuggestions([]);
    }
  };

  const handleAddComposition = () => {
    if (currentComposition.trim()) {
      setFormData(prev => {
        // Convert existing compositions to Set to remove duplicates
        const compositionSet = new Set(prev.composition);
        compositionSet.add(currentComposition.trim());
        
        return {
          ...prev,
          composition: Array.from(compositionSet)
        };
      });
      setCurrentComposition('');
      setCompositionSuggestions([]);
    }
  };

  // Add a helper function to check if composition exists
  const isCompositionDuplicate = (comp: string): boolean => {
    return formData.composition.includes(comp.trim());
  };

  const handleRemoveComposition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      composition: prev.composition.filter((_, i) => i !== index)
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, category: value }));
    
    if (value) {
      const suggestions = categories.filter(cat => 
        cat.toLowerCase().includes(value.toLowerCase())
      );
      setCategorySuggestions(suggestions);
    } else {
      setCategorySuggestions([]);
    }
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVendorError('');

    try {
      const response = await axios.post(
        'http://localhost:5000/api/vendors',
        vendorFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add the new vendor to the vendors list
      setVendors(prev => [...prev, response.data]);
      
      // Select the new vendor
      setFormData(prev => ({
        ...prev,
        vendor: response.data._id
      }));

      // Reset form and close modal
      setVendorFormData({
        name: '',
        phone: '',
        email: '',
        address: ''
      });
      setShowVendorModal(false);
    } catch (err) {
      console.error('Error adding vendor:', err);
      setVendorError('Failed to add vendor. Please try again.');
    }
  };

  const handleVendorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVendorFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // If not admin, show access denied
  if (user && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <svg className="h-16 w-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-4 text-xl font-bold text-gray-900">Access Denied</h2>
            <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600">
            <h2 className="text-2xl font-bold text-white">Add New Medicine</h2>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
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

            {success && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medicine Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                    placeholder="e.g. Paracetamol 500mg"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700">Composition</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      value={currentComposition}
                      onChange={handleCompositionChange}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (isCompositionDuplicate(currentComposition)) {
                            setError('This composition already exists');
                            return;
                          }
                          handleAddComposition();
                        }
                      }}
                      className="flex-1 block w-full rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Enter composition and press Enter or click Add"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (isCompositionDuplicate(currentComposition)) {
                          setError('This composition already exists');
                          return;
                        }
                        handleAddComposition();
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add
                    </button>
                  </div>

                  {compositionSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300">
                      <ul className="max-h-60 overflow-auto py-1 text-base">
                        {compositionSuggestions
                          .filter(comp => !isCompositionDuplicate(comp))
                          .map((comp, index) => (
                          <li
                            key={index}
                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white"
                            onClick={() => {
                              setCurrentComposition(comp);
                              setCompositionSuggestions([]);
                            }}
                          >
                            {comp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {formData.composition.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Added Compositions</label>
                    <div className="flex flex-wrap gap-2">
                      {formData.composition.map((comp, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                        >
                          {comp}
                          <button
                            type="button"
                            onClick={() => handleRemoveComposition(index)}
                            className="ml-2 text-indigo-600 hover:text-indigo-800 focus:outline-none"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleCategoryChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                  placeholder="Enter or select a category"
                />
                {categorySuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300">
                    <ul className="max-h-60 overflow-auto py-1 text-base">
                      {categorySuggestions.map((cat, index) => (
                        <li
                          key={index}
                          className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, category: cat }));
                            setCategorySuggestions([]);
                          }}
                        >
                          {cat}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                  required
                  placeholder="Enter detailed description of the medicine..."
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="flex-1 min-w-0 block w-full rounded-none rounded-l-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="NPR">NPR</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.currency === 'INR' 
                      ? `≈ NPR ${(formData.price * 1.6).toFixed(2)}`
                      : ''}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <select
                    name="priceUnit"
                    value={formData.priceUnit}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="piece">Piece</option>
                    <option value="box">Box</option>
                    <option value="strip">Strip</option>
                    <option value="bottle">Bottle</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiry Date (MM/YYYY)</label>
                  <input
                    type="month"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                    placeholder="e.g. Johnson & Johnson"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                  <input
                    type="text"
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                    placeholder="e.g. B12345"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <select
                      name="vendor"
                      value={formData.vendor}
                      onChange={handleChange}
                      className="flex-1 block w-full rounded-l-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select a vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor._id} value={vendor._id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowVendorModal(true)}
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add New
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purchase Price</label>
                  <input
                    type="number"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="PAID">PAID</option>
                    <option value="DUE">DUE</option>
                    <option value="PARTIAL">PARTIAL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Paid Amount</label>
                  <input
                    type="number"
                    name="paidAmount"
                    value={formData.paidAmount}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="storage" className="block text-sm font-medium text-gray-700">
                    Storage Requirements
                  </label>
                  <select
                    id="storage"
                    name="storage"
                    value={formData.storage}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="cold">Cold</option>
                    <option value="extreme_cold">Extreme Cold</option>
                    <option value="hot">Hot</option>
                    <option value="extreme_hot">Extreme Hot</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="requiresPrescription"
                    checked={formData.requiresPrescription}
                    onChange={handleChange}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-3 block text-sm font-medium text-gray-700">
                    Requires Prescription
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">Check this if the medicine can only be sold with a valid prescription.</p>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="bg-white text-gray-700 px-4 py-2 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium text-white 
                    ${loading 
                      ? 'bg-indigo-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                  {loading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {loading ? 'Adding...' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Add Vendor Modal */}
      {showVendorModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add New Vendor</h3>
                
                {vendorError && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <p className="text-sm text-red-700">{vendorError}</p>
                  </div>
                )}

                <form onSubmit={handleVendorSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={vendorFormData.name}
                      onChange={handleVendorChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={vendorFormData.phone}
                      onChange={handleVendorChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={vendorFormData.email}
                      onChange={handleVendorChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={vendorFormData.address}
                      onChange={handleVendorChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                    >
                      Add Vendor
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowVendorModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddMedicine; 