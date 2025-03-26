import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Dashboard: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    medicines: 0,
    prescriptions: 0,
    sales: 0,
    vendors: 0,
    payables: 0,
    receivables: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const isViewer = user?.role === 'VIEWER';

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch medicine count
        const medicinesResponse = await axios.get('http://localhost:5000/api/medicines/stats/count', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch prescription count
        const prescriptionsResponse = await axios.get('http://localhost:5000/api/prescriptions/stats/count', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch sales total (admin only)
        let salesTotal = 0;
        let vendorsCount = 0;
        let payablesTotal = 0;
        let receivablesTotal = 0;
        if (isAdmin) {
          const salesResponse = await axios.get('http://localhost:5000/api/sales/stats/total', {
            headers: { Authorization: `Bearer ${token}` }
          });
          salesTotal = salesResponse.data.total;

          // Fetch vendors count (admin only)
          const vendorsResponse = await axios.get('http://localhost:5000/api/vendors/stats/count', {
            headers: { Authorization: `Bearer ${token}` }
          });
          vendorsCount = vendorsResponse.data.count;

          // Fetch payables and receivables
          const payablesResponse = await axios.get('http://localhost:5000/api/vendors/stats/payables', {
            headers: { Authorization: `Bearer ${token}` }
          });
          payablesTotal = payablesResponse.data.total;

          const receivablesResponse = await axios.get('http://localhost:5000/api/sales/stats/receivables', {
            headers: { Authorization: `Bearer ${token}` }
          });
          receivablesTotal = receivablesResponse.data.total;
        }
        
        setStats({
          medicines: medicinesResponse.data.count,
          prescriptions: prescriptionsResponse.data.count,
          sales: salesTotal,
          vendors: vendorsCount,
          payables: payablesTotal,
          receivables: receivablesTotal
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load statistics. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, isAdmin]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Menu Items */}
            {(isAdmin || isViewer) && (
              <Link
                to="/medicines"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-semibold mb-2">Medicines</h2>
                <p className="text-gray-600">View and manage medicines</p>
                <p className="text-2xl font-bold mt-2">{stats.medicines}</p>
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/prescriptions"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-semibold mb-2">Prescriptions</h2>
                <p className="text-gray-600">Manage prescriptions</p>
                <p className="text-2xl font-bold mt-2">{stats.prescriptions}</p>
              </Link>
            )}

            {(isAdmin || isViewer) && (
              <Link
                to="/sales/new"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-semibold mb-2">New Sale</h2>
                <p className="text-gray-600">Record a new sale</p>
              </Link>
            )}

            {isAdmin && (
              <>
                <Link
                  to="/sales/history"
                  className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <h2 className="text-xl font-semibold mb-2">Sales History</h2>
                  <p className="text-gray-600">View all sales</p>
                  <p className="text-2xl font-bold mt-2">{stats.sales}</p>
                </Link>

                <Link
                  to="/sales/receivables"
                  className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <h2 className="text-xl font-semibold mb-2">Receivables</h2>
                  <p className="text-gray-600">Manage credit sales</p>
                  <p className="text-2xl font-bold mt-2">{stats.receivables}</p>
                </Link>

                <Link
                  to="/vendors"
                  className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <h2 className="text-xl font-semibold mb-2">Vendors</h2>
                  <p className="text-gray-600">Manage vendors</p>
                  <p className="text-2xl font-bold mt-2">{stats.vendors}</p>
                </Link>

                <Link
                  to="/vendors/payables"
                  className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <h2 className="text-xl font-semibold mb-2">Payables</h2>
                  <p className="text-gray-600">Manage vendor payments</p>
                  <p className="text-2xl font-bold mt-2">{stats.payables}</p>
                </Link>
              </>
            )}

            {(isAdmin || isViewer) && (
              <Link
                to="/medicines/add"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-semibold mb-2">Add Medicine</h2>
                <p className="text-gray-600">Add new medicine to inventory</p>
              </Link>
            )}

            {(isAdmin || isViewer) && (
              <Link
                to="/prices"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-semibold mb-2">View Prices</h2>
                <p className="text-gray-600">Check medicine prices</p>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 