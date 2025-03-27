import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Medicine {
  _id: string;
  name: string;
  description: string;
  category: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: string;
  stock: number;
  vendor?: {
    _id: string;
    name: string;
  };
  purchasePrice?: number;
}

interface MedicineResponse {
  medicines: {
    expired: Medicine[];
    expiring: Medicine[];
    valid: Medicine[];
  };
  total: number;
  filter: string;
  days: number;
}

const ExpiryView: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'expired' | 'expiring'>('all');
  const { token } = useAuth();

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await axios.get<MedicineResponse>(
          `http://localhost:5000/api/medicines/expiry${filter !== 'all' ? `?filter=${filter}` : ''}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        // Combine all medicines based on filter
        let combinedMedicines: Medicine[] = [];
        if (filter === 'expired') {
          combinedMedicines = response.data.medicines.expired;
        } else if (filter === 'expiring') {
          combinedMedicines = response.data.medicines.expiring;
        } else {
          combinedMedicines = [
            ...response.data.medicines.expired,
            ...response.data.medicines.expiring,
            ...response.data.medicines.valid
          ];
        }

        setMedicines(combinedMedicines);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching medicines:', err);
        setError(err.response?.data?.message || 'Failed to fetch medicines');
        setLoading(false);
      }
    };

    fetchMedicines();
  }, [token, filter]);

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    
    if (expiry < today) return 'Expired';
    
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 30) return 'Expiring Soon';
    return 'Valid';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Expired':
        return 'bg-red-100 text-red-800';
      case 'Expiring Soon':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-indigo-500 to-purple-600">
            <h2 className="text-2xl font-bold text-white">Medicine Expiry Status</h2>
            <p className="text-indigo-100 mt-1">Track medicine expiry dates</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-end mb-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'expired' | 'expiring')}
                className="block w-48 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Medicines</option>
                <option value="expired">Expired Only</option>
                <option value="expiring">Expiring Soon</option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 text-center">
                <p className="text-red-700">{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medicine Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Manufacturer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch Number
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {medicines.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                          No medicines found matching your criteria
                        </td>
                      </tr>
                    ) : (
                      medicines.map((medicine) => {
                        const status = getExpiryStatus(medicine.expiryDate);
                        return (
                          <tr key={medicine._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{medicine.name}</div>
                                  <div className="text-sm text-gray-500 truncate max-w-xs">{medicine.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                {medicine.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {medicine.manufacturer}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {medicine.batchNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(medicine.expiryDate).toLocaleDateString('en-GB', { 
                                year: 'numeric',
                                month: 'short'
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {medicine.stock}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpiryView; 