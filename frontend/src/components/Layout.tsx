import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import {
  canAccessFinancialData,
  canAccessPurchaseOrders,
  canAccessUserManagement,
  canAccessInventory,
  canAccessSales,
  canCreateSales
} from '../utils/permissions';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Secondary Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link to="/" className={`px-3 py-2 text-sm font-medium ${isActive('/')}`}>
              Dashboard
            </Link>
            {canAccessInventory(user) && (
              <Link to="/medicines" className={`px-3 py-2 text-sm font-medium ${isActive('/medicines')}`}>
                Medicines
              </Link>
            )}
            {canCreateSales(user) && (
              <Link to="/sales/new" className={`px-3 py-2 text-sm font-medium ${isActive('/sales/new')}`}>
                New Sale
              </Link>
            )}
            {canAccessInventory(user) && (
              <Link to="/prices" className={`px-3 py-2 text-sm font-medium ${isActive('/prices')}`}>
                View Prices
              </Link>
            )}
            {canAccessInventory(user) && (
              <Link to="/prescriptions" className={`px-3 py-2 text-sm font-medium ${isActive('/prescriptions')}`}>
                Prescriptions
              </Link>
            )}
            {canAccessSales(user) && (
              <Link to="/sales/history" className={`px-3 py-2 text-sm font-medium ${isActive('/sales/history')}`}>
                Sales History
              </Link>
            )}
            {canAccessPurchaseOrders(user) && (
              <>
                <Link to="/vendors" className={`px-3 py-2 text-sm font-medium ${isActive('/vendors')}`}>
                  Vendors
                </Link>
                <Link to="/purchase-orders" className={`px-3 py-2 text-sm font-medium ${isActive('/purchase-orders')}`}>
                  Purchase Orders
                </Link>
              </>
            )}
            {canAccessUserManagement(user) && (
              <Link to="/users" className={`px-3 py-2 text-sm font-medium ${isActive('/users')}`}>
                Users
              </Link>
            )}
            {canAccessFinancialData(user) && (
              <Link to="/financial-summary" className={`px-3 py-2 text-sm font-medium ${isActive('/financial-summary')}`}>
                Financial Summary
              </Link>
            )}
          </div>
        </div>
      </div>

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout; 