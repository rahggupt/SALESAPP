import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_ENDPOINTS from '../config/api';

interface Creditor {
  customer: string;
  phoneNumber: string;
  totalDue: number;
  lastPurchaseDate: string;
  salesCount: number;
}

const CreditorsView: React.FC = () => {
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    const fetchCreditors = async () => {
      setLoading(true);
      try {
        const response = await axios.get(API_ENDPOINTS.SALES_CREDITORS, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCreditors(response.data);
      } catch (error) {
        console.error('Error fetching creditors:', error);
        setError('Failed to fetch creditors');
      } finally {
        setLoading(false);
      }
    };

    fetchCreditors();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-indigo-500 to-purple-600">
            <h2 className="text-2xl font-bold text-white">Credit Management</h2>
            <p className="text-indigo-100 mt-1">Track customer credit and due amounts</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
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
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone Number
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Due
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Purchase
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Sales
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {creditors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No creditors found
                        </td>
                      </tr>
                    ) : (
                      creditors.map((creditor, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {creditor.customer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {creditor.phoneNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="text-red-600 font-semibold">
                              NPR {creditor.totalDue.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(creditor.lastPurchaseDate).toLocaleDateString('en-GB', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {creditor.salesCount}
                          </td>
                        </tr>
                      ))
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

export default CreditorsView; 