import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_ENDPOINTS from '../config/api';

interface Vendor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  balance: number;
  createdAt: string;
}

const VendorList: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(API_ENDPOINTS.VENDORS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setVendors(response.data);
    } catch (err) {
      setError('Failed to fetch vendors. Please try again.');
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) {
      return;
    }
    
    try {
      await axios.delete(API_ENDPOINTS.VENDOR_BY_ID(id), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      setVendors(prev => prev.filter(vendor => vendor._id !== id));
      setSuccessMessage('Vendor deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete vendor. Please try again.');
      console.error('Error deleting vendor:', err);
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
      <h1 className="text-2xl font-bold mb-6">Vendors</h1>
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr>
              <th className="px-6 py-3 border-b">Name</th>
              <th className="px-6 py-3 border-b">Email</th>
              <th className="px-6 py-3 border-b">Phone</th>
              <th className="px-6 py-3 border-b">Address</th>
              <th className="px-6 py-3 border-b">Balance</th>
              <th className="px-6 py-3 border-b">Created At</th>
              <th className="px-6 py-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor._id}>
                <td className="px-6 py-4 border-b">{vendor.name}</td>
                <td className="px-6 py-4 border-b">{vendor.email}</td>
                <td className="px-6 py-4 border-b">{vendor.phone}</td>
                <td className="px-6 py-4 border-b">{vendor.address}</td>
                <td className="px-6 py-4 border-b">₹{vendor.balance.toFixed(2)}</td>
                <td className="px-6 py-4 border-b">
                  {new Date(vendor.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 border-b">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDelete(vendor._id)}
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

export default VendorList; 