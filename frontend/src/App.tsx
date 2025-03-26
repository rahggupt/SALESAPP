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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/medicines" element={<PrivateRoute><MedicineList /></PrivateRoute>} />
          <Route path="/medicines/add" element={<PrivateRoute><AddMedicine /></PrivateRoute>} />
          <Route path="/prescriptions" element={<PrivateRoute><PrescriptionList /></PrivateRoute>} />
          <Route path="/prescriptions/add" element={<PrivateRoute><AddPrescription /></PrivateRoute>} />
          <Route path="/scan-prescription" element={<PrivateRoute><ScanPrescription /></PrivateRoute>} />
          <Route path="/sales/new" element={<PrivateRoute><SalesEntry /></PrivateRoute>} />
          <Route path="/sales/history" element={<PrivateRoute><SalesHistory /></PrivateRoute>} />
          <Route path="/sales/receivables" element={<PrivateRoute><ReceivablesList /></PrivateRoute>} />
          <Route path="/prices" element={<PrivateRoute><ViewPrices /></PrivateRoute>} />
          <Route path="/vendors" element={<PrivateRoute><VendorManagement /></PrivateRoute>} />
          <Route path="/vendors/payables" element={<PrivateRoute><VendorPayables /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 