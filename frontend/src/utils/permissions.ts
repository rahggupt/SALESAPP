type UserRole = 'ADMIN' | 'STAFF' | 'CASHIER' | 'VIEWER';

interface User {
  role: UserRole;
}

export const canAccessFinancialData = (user: User | null): boolean => {
  if (!user) return false;
  return ['ADMIN', 'VIEWER'].includes(user.role);
};

export const canAccessPurchaseOrders = (user: User | null): boolean => {
  if (!user) return false;
  return ['ADMIN', 'VIEWER'].includes(user.role);
};

export const canAccessUserManagement = (user: User | null): boolean => {
  if (!user) return false;
  return user.role === 'ADMIN';
};

export const canAccessInventory = (user: User | null): boolean => {
  if (!user) return false;
  return ['ADMIN', 'STAFF', 'VIEWER'].includes(user.role);
};

export const canAccessSales = (user: User | null): boolean => {
  if (!user) return false;
  return ['ADMIN', 'STAFF', 'CASHIER', 'VIEWER'].includes(user.role);
};

export const canCreateSales = (user: User | null): boolean => {
  if (!user) return false;
  return ['ADMIN', 'STAFF', 'CASHIER'].includes(user.role);
};

export const canEditData = (user: User | null): boolean => {
  if (!user) return false;
  return ['ADMIN', 'STAFF'].includes(user.role);
}; 