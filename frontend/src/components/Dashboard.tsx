import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface DashboardSection {
  id: string;
  title: string;
  component: string;
  order: number;
}

const getSectionComponent = (id: string, stats: any) => {
  switch (id) {
    case 'overview':
      return <OverviewSection stats={stats} />;
    case 'inventory':
      return <InventorySection stats={stats} />;
    case 'sales':
      return <SalesSection stats={stats} />;
    case 'alerts':
      return <AlertsSection stats={stats} />;
    default:
      return null;
  }
};

const SortableItem = ({ id, section, stats }: { id: string; section: DashboardSection; stats: any }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg shadow-xl overflow-hidden transform transition-all hover:scale-[1.02]"
    >
      <div
        {...attributes}
        {...listeners}
        className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 flex justify-between items-center cursor-move"
      >
        <h2 className="text-xl font-semibold text-white">{section.title}</h2>
        <svg className="w-6 h-6 text-white opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </div>
      <div className="p-6">
        {getSectionComponent(section.id, stats)}
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    medicineCount: 0,
    salesCount: 0,
    prescriptionCount: 0,
    totalRevenue: 0,
    lowStockCount: 0,
    expiringCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const [sections, setSections] = useState<DashboardSection[]>([]);

  const isViewer = user?.role === 'VIEWER';

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchDashboardData = async () => {
    try {
      const [medicineStats, salesStats, prescriptionStats] = await Promise.all([
        axios.get('http://localhost:5000/api/medicines/stats/count', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/sales/stats/total', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/prescriptions/stats/count', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats({
        medicineCount: medicineStats.data.count || 0,
        salesCount: salesStats.data.totalCount || 0,
        prescriptionCount: prescriptionStats.data.count || 0,
        totalRevenue: salesStats.data.totalRevenue || 0,
        lowStockCount: medicineStats.data.lowStockCount || 0,
        expiringCount: medicineStats.data.expiringCount || 0
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    loadUserLayout();
  }, [token, isAdmin]);

  const loadUserLayout = () => {
    // Load user's saved layout from localStorage or use default
    const savedLayout = localStorage.getItem(`dashboard_layout_${user?.id}`);
    if (savedLayout) {
      const parsedLayout = JSON.parse(savedLayout);
      const sectionsWithComponents = parsedLayout.map((section: DashboardSection) => ({
        ...section,
        component: getSectionComponent(section.id, stats)
      }));
      setSections(sectionsWithComponents);
    } else {
      const defaultSections: DashboardSection[] = [
        {
          id: 'overview',
          title: 'Overview',
          component: 'overview',
          order: 0
        },
        {
          id: 'inventory',
          title: 'Inventory Status',
          component: 'inventory',
          order: 1
        },
        {
          id: 'sales',
          title: 'Sales Analytics',
          component: 'sales',
          order: 2
        },
        {
          id: 'alerts',
          title: 'Alerts',
          component: 'alerts',
          order: 3
        }
      ];
      setSections(defaultSections);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const updatedItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          order: index
        }));

        // Save to localStorage
        localStorage.setItem(`dashboard_layout_${user?.id}`, JSON.stringify(updatedItems));

        return updatedItems;
      });
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold">Shyama Pharmacy</h1>
              <p className="mt-1 text-indigo-100">Your health is our priority</p>
            </div>
            <div>
              <Link to="/medicines" className="text-white hover:text-indigo-100 flex items-center">
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Medicines
              </Link>
              <Link to="/sales/new" className="text-white hover:text-indigo-100 flex items-center">
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                New Sale
              </Link>
              <Link to="/prices" className="text-white hover:text-indigo-100 flex items-center">
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                View Prices
              </Link>
              <Link to="/vendors" className="text-white hover:text-indigo-100 flex items-center">
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Vendors
              </Link>
              <Link to="/purchase-orders" className="text-white hover:text-indigo-100 flex items-center">
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Purchase Orders
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-2">
            <SortableContext
              items={sections.map(section => section.id)}
              strategy={verticalListSortingStrategy}
            >
              {sections.map((section) => (
                <SortableItem key={section.id} id={section.id} section={section} stats={stats} />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      </div>
    </div>
  );
};

const OverviewSection: React.FC<{ stats: any }> = ({ stats }) => (
  <div className="grid grid-cols-2 gap-4">
    <StatCard
      title="Total Medicines"
      value={stats.medicineCount}
      icon={<MedicineIcon />}
      color="bg-blue-500"
    />
    <StatCard
      title="Total Sales"
      value={stats.salesCount}
      icon={<SalesIcon />}
      color="bg-green-500"
    />
    <StatCard
      title="Prescriptions"
      value={stats.prescriptionCount}
      icon={<PrescriptionIcon />}
      color="bg-purple-500"
    />
    <StatCard
      title="Revenue"
      value={`NPR ${stats.totalRevenue.toLocaleString()}`}
      icon={<RevenueIcon />}
      color="bg-yellow-500"
    />
  </div>
);

const InventorySection: React.FC<{ stats: any }> = ({ stats }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between p-4 bg-orange-100 rounded-lg">
      <div>
        <p className="text-sm text-orange-600">Low Stock Items</p>
        <p className="text-2xl font-bold text-orange-700">{stats.lowStockCount}</p>
      </div>
      <LowStockIcon />
    </div>
    <div className="flex items-center justify-between p-4 bg-red-100 rounded-lg">
      <div>
        <p className="text-sm text-red-600">Expiring Soon</p>
        <p className="text-2xl font-bold text-red-700">{stats.expiringCount}</p>
      </div>
      <ExpiryIcon />
    </div>
  </div>
);

const SalesSection: React.FC<{ stats: any }> = ({ stats }) => (
  <div className="h-64 flex items-center justify-center">
    {/* Add your sales chart component here */}
    <p className="text-gray-500">Sales Chart Coming Soon</p>
  </div>
);

const AlertsSection: React.FC<{ stats: any }> = ({ stats }) => (
  <div className="space-y-4">
    {stats.lowStockCount > 0 && (
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Low Stock Alert
              </h3>
              <p className="mt-2 text-sm text-yellow-700">
                {stats.lowStockCount} medicines are running low on stock
              </p>
            </div>
          </div>
          <Link
            to="/medicines"
            className="ml-6 bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100"
          >
            View All →
          </Link>
        </div>
      </div>
    )}
    {stats.expiringCount > 0 && (
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Expiry Alert
              </h3>
              <p className="mt-2 text-sm text-red-700">
                {stats.expiringCount} medicines are expired or expiring soon
              </p>
            </div>
          </div>
          <Link
            to="/medicines/expiry"
            className="ml-6 bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100"
          >
            View All →
          </Link>
        </div>
      </div>
    )}
  </div>
);

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
    <div className="flex items-center">
      <div className={`p-3 rounded-full ${color} text-white mr-4`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  </div>
);

// Icons components (you can replace these with your own icons)
const MedicineIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const SalesIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const PrescriptionIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const RevenueIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LowStockIcon = () => (
  <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
);

const ExpiryIcon = () => (
  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

export default Dashboard; 