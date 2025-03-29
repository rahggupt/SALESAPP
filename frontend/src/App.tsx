import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MedicineList from './components/MedicineList';
import AddMedicine from './components/AddMedicine';
import PrescriptionList from './components/PrescriptionList';
import AddPrescription from './components/AddPrescription';
import ScanPrescription from './components/ScanPrescription';
import SalesEntry from './components/SalesEntry';
import ViewPrices from './components/ViewPrices';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import VendorManagement from './components/VendorManagement';
import VendorPayables from './components/VendorPayables';
import SalesHistory from './components/SalesHistory';
import ReceivablesList from './components/ReceivablesList';
import ExpiryView from './components/ExpiryView';
import CreditorsView from './components/CreditorsView';
import Layout from './components/Layout';
import PurchaseOrder from './components/PurchaseOrder';
import UserManagement from './components/UserManagement';

// Wrap component with Layout
const withLayout = (Component: React.ComponentType): React.ReactNode => {
  return (
    <Layout>
      <Component />
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute>{withLayout(Dashboard)}</PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute>{withLayout(Dashboard)}</PrivateRoute>} />
          <Route path="/medicines" element={<PrivateRoute allowedRoles={['ADMIN', 'VIEWER']}>{withLayout(MedicineList)}</PrivateRoute>} />
          <Route path="/medicines/add" element={<PrivateRoute allowedRoles={['ADMIN', 'VIEWER']}>{withLayout(AddMedicine)}</PrivateRoute>} />
          <Route path="/medicines/expiry" element={<PrivateRoute allowedRoles={['ADMIN', 'VIEWER']}>{withLayout(ExpiryView)}</PrivateRoute>} />
          <Route path="/prescriptions" element={<PrivateRoute allowedRoles={['ADMIN']}>{withLayout(PrescriptionList)}</PrivateRoute>} />
          <Route path="/prescriptions/add" element={<PrivateRoute allowedRoles={['ADMIN']}>{withLayout(AddPrescription)}</PrivateRoute>} />
          <Route path="/scan-prescription" element={<PrivateRoute allowedRoles={['ADMIN']}>{withLayout(ScanPrescription)}</PrivateRoute>} />
          <Route path="/sales/new" element={<PrivateRoute allowedRoles={['ADMIN', 'VIEWER']}>{withLayout(SalesEntry)}</PrivateRoute>} />
          <Route path="/sales/history" element={<PrivateRoute allowedRoles={['ADMIN']}>{withLayout(SalesHistory)}</PrivateRoute>} />
          <Route path="/sales/receivables" element={<PrivateRoute allowedRoles={['ADMIN']}>{withLayout(ReceivablesList)}</PrivateRoute>} />
          <Route path="/sales/creditors" element={<PrivateRoute allowedRoles={['ADMIN']}>{withLayout(CreditorsView)}</PrivateRoute>} />
          <Route path="/prices" element={<PrivateRoute allowedRoles={['ADMIN', 'VIEWER']}>{withLayout(ViewPrices)}</PrivateRoute>} />
          <Route path="/vendors" element={<PrivateRoute allowedRoles={['ADMIN']}>{withLayout(VendorManagement)}</PrivateRoute>} />
          <Route path="/vendors/payables" element={<PrivateRoute allowedRoles={['ADMIN']}>{withLayout(VendorPayables)}</PrivateRoute>} />
          <Route path="/sales-history" element={<SalesHistory />} />
          <Route path="/purchase-orders" element={<PrivateRoute allowedRoles={['ADMIN']}>{withLayout(PurchaseOrder)}</PrivateRoute>} />
          <Route path="/vendor-management" element={<VendorManagement />} />
          <Route path="/users" element={<PrivateRoute allowedRoles={['ADMIN']}>{withLayout(UserManagement)}</PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 