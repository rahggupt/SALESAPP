import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  const getActiveClass = (path: string) => {
    return location.pathname === path
      ? 'bg-indigo-100 text-indigo-700'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Secondary Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8" aria-label="Secondary">
            <Link
              to="/dashboard"
              className={`${getActiveClass('/dashboard')} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                location.pathname === '/dashboard' ? 'border-indigo-500' : 'border-transparent'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/medicines"
              className={`${getActiveClass('/medicines')} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                location.pathname === '/medicines' ? 'border-indigo-500' : 'border-transparent'
              }`}
            >
              Medicines
            </Link>
            <Link
              to="/sales/new"
              className={`${getActiveClass('/sales/new')} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                location.pathname === '/sales/new' ? 'border-indigo-500' : 'border-transparent'
              }`}
            >
              New Sale
            </Link>
            <Link
              to="/prices"
              className={`${getActiveClass('/prices')} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                location.pathname === '/prices' ? 'border-indigo-500' : 'border-transparent'
              }`}
            >
              View Prices
            </Link>
            {user?.role === 'ADMIN' && (
              <Link
                to="/prescriptions"
                className={`${getActiveClass('/prescriptions')} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  location.pathname === '/prescriptions' ? 'border-indigo-500' : 'border-transparent'
                }`}
              >
                Prescriptions
              </Link>
            )}
            <Link
              to="/sales/history"
              className={`${getActiveClass('/sales/history')} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                location.pathname === '/sales/history' ? 'border-indigo-500' : 'border-transparent'
              }`}
            >
              Sales History
            </Link>
            {user?.role === 'ADMIN' && (
              <Link
                to="/vendors"
                className={`${getActiveClass('/vendors')} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  location.pathname === '/vendors' ? 'border-indigo-500' : 'border-transparent'
                }`}
              >
                Vendors
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link
                to="/purchase-orders"
                className={`${getActiveClass('/purchase-orders')} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  location.pathname === '/purchase-orders' ? 'border-indigo-500' : 'border-transparent'
                }`}
              >
                Purchase Orders
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout; 