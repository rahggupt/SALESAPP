import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface FormData {
  name: string;
  category: string;
  composition: string[];
  description: string;
  price: number;
  currency: string;
  priceUnit: string;
  stock: number;
  storage: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: string;
  purchasePrice: number;
  paymentStatus: string;
  paidAmount: number;
  requiresPrescription: boolean;
  vendor?: string;
}

const EditMedicine: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '',
    composition: [],
    description: '',
    price: 0,
    currency: 'NPR',
    priceUnit: 'piece',
    stock: 0,
    storage: 'cold',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    purchasePrice: 0,
    paymentStatus: 'DUE',
    paidAmount: 0,
    requiresPrescription: false
  });
  const [originalData, setOriginalData] = useState({});
  const [error, setError] = useState('');
  const [currentComposition, setCurrentComposition] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [medicineResponse, categoriesResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/medicines/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/medicines/categories', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setFormData(medicineResponse.data);
        setOriginalData(medicineResponse.data);
        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch medicine details');
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
      return;
    }

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

    const inputValue = type === 'number' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({
      ...prev,
      [name]: inputValue
    }));
  };

  const handleCompositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentComposition(e.target.value);
  };

  const isCompositionDuplicate = (composition: string, existingCompositions: string[]): boolean => {
    return existingCompositions.some(
      (existing) => existing.toLowerCase().trim() === composition.toLowerCase().trim()
    );
  };

  const handleAddComposition = () => {
    if (!currentComposition.trim()) return;
    
    if (isCompositionDuplicate(currentComposition, formData.composition)) {
      setError('This composition already exists');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      composition: [...prev.composition, currentComposition.trim()]
    }));
    setCurrentComposition('');
    setError('');
  };

  const handleRemoveComposition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      composition: prev.composition.filter((_, i) => i !== index)
    }));
  };

  const handleAddNewCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      const response = await axios.post(
        'http://localhost:5000/api/medicines/categories',
        { category: newCategory.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCategories(prev => [...prev, response.data.category]);
      setFormData(prev => ({ ...prev, category: response.data.category }));
      setNewCategory('');
      setShowNewCategoryInput(false);
    } catch (err) {
      console.error('Error adding new category:', err);
      setError('Failed to add new category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:5000/api/medicines/${id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/medicines');
    } catch (err) {
      console.error('Error updating medicine:', err);
      setError('Failed to update medicine');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600">
            <h3 className="text-2xl font-bold text-white">Edit Medicine</h3>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
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
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Category */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <div className="mt-1 flex gap-2">
                    {showNewCategoryInput ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter new category"
                        />
                        <button
                          type="button"
                          onClick={handleAddNewCategory}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewCategoryInput(false);
                            setNewCategory('');
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        >
                          <option value="">Select Category</option>
                          {categories.map(category => (
                            <option key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowNewCategoryInput(true)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Add New
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                  <input
                    type="text"
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Pricing and Stock */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="flex-1 rounded-l-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="rounded-none border-l-0 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="NPR">NPR</option>
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                    </select>
                    <select
                      name="priceUnit"
                      value={formData.priceUnit}
                      onChange={handleInputChange}
                      className="rounded-r-md border-l-0 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="piece">Per Piece</option>
                      <option value="strip">Per Strip</option>
                      <option value="box">Per Box</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Purchase Price</label>
                  <input
                    type="number"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="PAID">Paid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="DUE">Due</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Paid Amount</label>
                  <input
                    type="number"
                    name="paidAmount"
                    value={formData.paidAmount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Storage</label>
                  <select
                    name="storage"
                    value={formData.storage}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="cold">Cold</option>
                    <option value="extreme_cold">Extreme Cold</option>
                    <option value="hot">Hot</option>
                    <option value="extreme_hot">Extreme Hot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiry Date (MM/YYYY)</label>
                  <input
                    type="month"
                    name="expiryDate"
                    value={formData.expiryDate.split('T')[0].slice(0, 7)}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="requiresPrescription"
                    checked={formData.requiresPrescription}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Requires Prescription
                  </label>
                </div>
              </div>
            </div>

            {/* Composition Section */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Composition</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentComposition}
                  onChange={handleCompositionChange}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!isCompositionDuplicate(currentComposition, formData.composition)) {
                        setFormData(prev => ({
                          ...prev,
                          composition: [...prev.composition, currentComposition.trim()]
                        }));
                        setCurrentComposition('');
                      }
                    }
                  }}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter composition and press Enter"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!isCompositionDuplicate(currentComposition, formData.composition)) {
                      setFormData(prev => ({
                        ...prev,
                        composition: [...prev.composition, currentComposition.trim()]
                      }));
                      setCurrentComposition('');
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>

              {formData.composition.length > 0 && (
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
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-5">
              <button
                type="button"
                onClick={() => navigate('/medicines')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditMedicine; 