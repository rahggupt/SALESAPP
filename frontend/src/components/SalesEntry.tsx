import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_ENDPOINTS from '../config/api';

// Types
interface Medicine {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  expiryDate?: string;
}

interface SaleItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  discount: number;
}

interface MedicineResponse {
  medicines: Medicine[];
  totalPages: number;
  categories: string[];
}

const SalesEntry: React.FC = () => {
  const navigate = useNavigate();
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [prescriptionImage, setPrescriptionImage] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  
  // UI state
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const { token } = useAuth();
  
  // Fetch medicines on component mount
  useEffect(() => {
    const fetchMedicines = async () => {
      setLoading(true);
      try {
        const response = await axios.get<MedicineResponse>(API_ENDPOINTS.MEDICINES, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMedicines(response.data.medicines);
      } catch (error) {
        console.error('Error fetching medicines:', error);
        setError('Failed to fetch medicines');
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, [token]);
  
  // Handle medicine selection
  const handleMedicineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMedicine(e.target.value);
    setQuantity(1);
    setDiscount(0);
  };
  
  // Add medicine to sale
  const handleAddMedicine = () => {
    if (!selectedMedicine || quantity <= 0) {
      setError('Please select a medicine and enter a valid quantity');
      return;
    }
    
    const medicine = medicines.find(m => m._id === selectedMedicine);
    
    if (!medicine) {
      setError('Selected medicine not found');
      return;
    }
    
    if (quantity > medicine.stock) {
      setError(`Only ${medicine.stock} units available in stock`);
      return;
    }
    
    // Check if medicine already exists in sale items
    const existingItemIndex = saleItems.findIndex(item => item.medicineId === selectedMedicine);
    
    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedItems = [...saleItems];
      const currentQuantity = updatedItems[existingItemIndex].quantity;
      const newQuantity = currentQuantity + quantity;
      
      if (newQuantity > medicine.stock) {
        setError(`Only ${medicine.stock} units available in stock. You already have ${currentQuantity} in your cart.`);
        return;
      }
      
      updatedItems[existingItemIndex].quantity = newQuantity;
      updatedItems[existingItemIndex].discount = discount;
      setSaleItems(updatedItems);
    } else {
      // Add new item
      const newItem: SaleItem = {
        medicineId: medicine._id,
        medicineName: medicine.name,
        quantity,
        price: medicine.price,
        discount
      };
      
      setSaleItems([...saleItems, newItem]);
    }
    
    // Reset selection
    setSelectedMedicine('');
    setQuantity(1);
    setDiscount(0);
    setError(null);
  };
  
  // Remove medicine from sale
  const handleRemoveMedicine = (index: number) => {
    const updatedItems = [...saleItems];
    updatedItems.splice(index, 1);
    setSaleItems(updatedItems);
  };
  
  // Handle prescription image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      setError('Please select an image file (jpg, jpeg, png)');
      return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should not exceed 5MB');
      return;
    }
    
    setPrescriptionImage(file);
    setError(null);
    
    // Create image preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Remove prescription image
  const handleRemoveImage = () => {
    setPrescriptionImage(null);
    setImagePreview(null);
  };
  
  // Calculate sale totals
  const calculateSubtotal = () => {
    return saleItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };
  
  const calculateTotalDiscount = () => {
    return saleItems.reduce((total, item) => {
      return total + ((item.price * item.quantity) * (item.discount / 100));
    }, 0);
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() - calculateTotalDiscount();
  };
  
  // Submit sale
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (saleItems.length === 0) {
      setError('Please add at least one medicine to the sale');
      return;
    }
    
    if (!customerName) {
      setError('Customer name is required');
      return;
    }

    if (paymentMethod === 'credit' && !customerPhone) {
      setError('Phone number is required for credit sales');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      const saleData = {
        customerName,
        customerPhone,
        customerEmail,
        paymentMethod,
        items: saleItems,
        notes,
        total: calculateTotal(),
        isPaid: paymentMethod !== 'credit',
        dueAmount: paymentMethod === 'credit' ? calculateTotal() : 0
      };
      
      formData.append('saleData', JSON.stringify(saleData));
      
      if (prescriptionImage) {
        formData.append('prescriptionImage', prescriptionImage);
      }
      
      await axios.post(API_ENDPOINTS.SALES, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMessage('Sale recorded successfully!');
      
      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setPaymentMethod('cash');
      setSaleItems([]);
      setSelectedMedicine('');
      setQuantity(1);
      setDiscount(0);
      setPrescriptionImage(null);
      setImagePreview(null);
      setNotes('');
      
      // Navigate to sales history after a short delay
      setTimeout(() => {
        navigate('/sales/history');
      }, 2000);
    } catch (err) {
      setError('Failed to record sale. Please try again.');
      console.error('Error recording sale:', err);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Filter medicines based on search term
  const filteredMedicines = medicines.filter(medicine => 
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    medicine.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.category.toLowerCase().includes(searchTerm.toLowerCase())
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
              <Link
                to="/sales/history"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 inline-block mt-2"
              >
                <svg className="h-5 w-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Sales History
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Record Sale</h2>
            <Link
              to="/sales"
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 inline-block mt-2"
            >
              <svg className="h-5 w-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Sales History
            </Link>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-md">
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

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <form onSubmit={handleSubmit}>
              <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Information</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Enter customer details</p>
              </div>
              
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      id="customerEmail"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                      Payment Method
                    </label>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="insurance">Insurance</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-b border-gray-200 px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Medicines</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Add medicines to the sale</p>
              </div>
              
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="searchMedicine" className="block text-sm font-medium text-gray-700">
                      Search Medicines
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="text"
                        name="searchMedicine"
                        id="searchMedicine"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, description or category"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <div className="w-full md:w-1/3">
                      <label htmlFor="medicine" className="block text-sm font-medium text-gray-700">
                        Medicine
                      </label>
                      <select
                        id="medicine"
                        name="medicine"
                        value={selectedMedicine}
                        onChange={handleMedicineChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">Select a medicine</option>
                        {filteredMedicines.map(medicine => (
                          <option key={medicine._id} value={medicine._id}>
                            {medicine.name} - ₹{medicine.price.toFixed(2)} (Stock: {medicine.stock})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="w-full md:w-1/4">
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                        Quantity
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        id="quantity"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div className="w-full md:w-1/4">
                      <label htmlFor="discount" className="block text-sm font-medium text-gray-700">
                        Discount (%)
                      </label>
                      <input
                        type="number"
                        name="discount"
                        id="discount"
                        min="0"
                        max="100"
                        value={discount}
                        onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div className="w-full md:w-auto mt-2 md:mt-0">
                      <button
                        type="button"
                        onClick={handleAddMedicine}
                        className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                      </button>
                    </div>
                  </div>
                  
                  {saleItems.length > 0 ? (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900">Sale Items</h4>
                      <div className="mt-2 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Medicine
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Discount
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {saleItems.map((item, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.medicineName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  ₹{item.price.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.discount}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  ₹{((item.price * item.quantity) - ((item.price * item.quantity) * (item.discount / 100))).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMedicine(index)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-gray-50">
                              <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                Subtotal:
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                ₹{calculateSubtotal().toFixed(2)}
                              </td>
                              <td></td>
                            </tr>
                            {calculateTotalDiscount() > 0 && (
                              <tr className="bg-gray-50">
                                <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                  Total Discount:
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                                  -₹{calculateTotalDiscount().toFixed(2)}
                                </td>
                                <td></td>
                              </tr>
                            )}
                            <tr className="bg-gray-50">
                              <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                                Grand Total:
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">
                                ₹{calculateTotal().toFixed(2)}
                              </td>
                              <td></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-md">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No items added yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Select medicines from the dropdown above to add to this sale.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Prescription (Optional)</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Upload a prescription image if available</p>
              </div>
              
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prescription Image</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      {!imagePreview ? (
                        <div className="space-y-1 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                              <span>Upload a file</span>
                              <input 
                                id="file-upload" 
                                name="file-upload" 
                                type="file" 
                                className="sr-only" 
                                accept="image/*"
                                onChange={handleImageChange}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 5MB</p>
                        </div>
                      ) : (
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Prescription Preview" 
                            className="mx-auto h-64 object-contain rounded" 
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-100 rounded-full p-1 text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Additional Notes
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Any additional information about this sale"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  disabled={submitting || saleItems.length === 0}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    submitting || saleItems.length === 0
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Complete Sale
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesEntry; 