const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_URL}/api/auth/login`,
  REGISTER: `${API_URL}/api/auth/register`,
  ME: `${API_URL}/api/auth/me`,
  RESET_PASSWORD: (userId: string) => `${API_URL}/api/users/${userId}/reset-password`,

  // Medicine endpoints
  MEDICINES: `${API_URL}/api/medicines`,
  MEDICINE_BY_ID: (id: string) => `${API_URL}/api/medicines/${id}`,
  MEDICINE_CATEGORIES: `${API_URL}/api/medicines/categories`,
  MEDICINE_COMPOSITIONS: `${API_URL}/api/medicines/compositions`,
  MEDICINE_STATS: `${API_URL}/api/medicines/stats/count`,
  MEDICINE_EXPIRY: (filter?: string) => `${API_URL}/api/medicines/expiry${filter !== 'all' ? `?filter=${filter}` : ''}`,
  MEDICINE_PAYMENT_HISTORY: (medicineId: string) => `${API_URL}/api/medicines/${medicineId}/payment-history`,
  MEDICINE_PAYMENT: (medicineId: string) => `${API_URL}/api/medicines/${medicineId}/payment`,
  MEDICINE_ARCHIVE: (id: string) => `${API_URL}/api/medicines/${id}/archive`,
  MEDICINE_UNARCHIVE: (id: string) => `${API_URL}/api/medicines/${id}/unarchive`,

  // Sales endpoints
  SALES: `${API_URL}/api/sales`,
  SALES_HISTORY: `${API_URL}/api/sales/history`,
  SALES_STATS_TOTAL: `${API_URL}/api/sales/stats/total`,
  SALES_STATS_DAILY: `${API_URL}/api/sales/stats/daily`,
  SALES_CREDIT: `${API_URL}/api/sales/credit`,
  SALES_CREDITORS: `${API_URL}/api/sales/creditors`,
  SALE_BY_ID: (id: string) => `${API_URL}/api/sales/${id}`,
  SALE_PAYMENT: (id: string) => `${API_URL}/api/sales/${id}/payment`,

  // Vendor endpoints
  VENDORS: `${API_URL}/api/vendors`,
  VENDOR_BY_ID: (id: string) => `${API_URL}/api/vendors/${id}`,
  VENDOR_TRANSACTIONS: (id: string) => `${API_URL}/api/vendors/${id}/transactions`,

  // Prescription endpoints
  PRESCRIPTIONS: `${API_URL}/api/prescriptions`,
  PRESCRIPTION_BY_ID: (id: string) => `${API_URL}/api/prescriptions/${id}`,
  PRESCRIPTION_UPLOAD: `${API_URL}/api/prescriptions/upload`,
  PRESCRIPTION_STATUS: (id: string) => `${API_URL}/api/prescriptions/${id}/status`,
  PRESCRIPTION_STATS: `${API_URL}/api/prescriptions/stats/count`,

  // Purchase Order endpoints
  PURCHASE_ORDERS: `${API_URL}/api/purchase-orders`,
  PURCHASE_ORDER_BY_ID: (id: string) => `${API_URL}/api/purchase-orders/${id}`,
  PURCHASE_ORDER_STATUS: (id: string) => `${API_URL}/api/purchase-orders/${id}/status`,
  PURCHASE_ORDER_ASSIGNEE: (id: string) => `${API_URL}/api/purchase-orders/${id}/assignee`,
  PURCHASE_ORDER_PAYMENT: (id: string) => `${API_URL}/api/purchase-orders/${id}/payment`,

  // User endpoints
  USERS: `${API_URL}/api/users`,
};

export default API_ENDPOINTS; 