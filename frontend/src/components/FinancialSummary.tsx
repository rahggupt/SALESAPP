import React, { useEffect, useState } from 'react';
import { Card, Row, Col, List, Typography, Spin, Alert, Button, Divider, Space, Statistic, Layout, Table, Tag } from 'antd';
import { ArrowLeftOutlined, DollarOutlined, ShoppingCartOutlined, UserOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { canAccessFinancialData } from '../utils/permissions';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import axios from 'axios';

const { Title, Text } = Typography;
const { Header, Content } = Layout;

interface Summary {
  totalPayables: number;
  totalReceivables: number;
  customersDueAmount: number;
  purchaseOrders: {
    total: number;
    pending: number;
    completed: number;
    totalAmount: number;
    pendingAmount: number;
    completedAmount: number;
  };
  sales: {
    total: number;
    pending: number;
    completed: number;
    totalAmount: number;
    pendingAmount: number;
    completedAmount: number;
  };
  customers: {
    total: number;
    withDues: number;
    averageDue: number;
    overdueCount: number;
  };
  medicines: {
    total: number;
    lowStock: number;
    outOfStock: number;
  };
  vendors: {
    total: number;
    active: number;
    withDues: number;
  };
}

interface VendorReport {
  name: string;
  totalOrders: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  status: 'PAID' | 'PARTIAL' | 'DUE';
}

interface CustomerReport {
  name: string;
  totalPurchases: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  status: 'PAID' | 'PARTIAL' | 'DUE';
}

const FinancialSummary: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendorReport, setVendorReport] = useState<VendorReport[]>([]);
  const [customerReport, setCustomerReport] = useState<CustomerReport[]>([]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const endDate = today.toISOString().split('T')[0];
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];

        const [
          salesPaymentResponse,
          purchaseOrdersResponse,
          medicineStatsResponse,
          creditorsResponse,
          vendorSummaryResponse
        ] = await Promise.all([
          axios.get('/api/sales/payment/summary'),
          axios.get('/api/purchase-orders/payment/summary'),
          axios.get('/api/medicines/stats'),
          axios.get('/api/sales/credit', {
            params: {
              startDate,
              endDate,
              paymentStatus: 'ALL'
            }
          }),
          axios.get('/api/vendors/summary')
        ]);

        // Filter credit sales to get only those with due amounts
        const creditorsWithDues = creditorsResponse.data.filter((sale: any) => sale.dueAmount > 0);
        const totalDueAmount = creditorsWithDues.reduce((acc: number, sale: any) => acc + sale.dueAmount, 0);
        const averageDue = creditorsWithDues.length > 0 ? totalDueAmount / creditorsWithDues.length : 0;

        // Add vendor report data
        const vendorReportData = purchaseOrdersResponse.data?.vendors?.map((vendor: any) => ({
          name: vendor.name || 'Unknown Vendor',
          totalOrders: 1, // Each vendor appears once in the summary
          totalAmount: vendor.totalDue || 0,
          pendingAmount: vendor.totalDue || 0,
          paidAmount: 0, // This data is not available in the current API
          status: vendor.totalDue > 0 ? 'DUE' : 'PAID'
        })) || [];

        // Add customer report data
        const customerReportData = salesPaymentResponse.data?.customerTotals?.map((customer: any) => ({
          name: customer.name || 'Unknown Customer',
          totalPurchases: 1, // Each customer appears once in the summary
          totalAmount: customer.totalDue || 0,
          pendingAmount: customer.totalDue || 0,
          paidAmount: 0, // This data is not available in the current API
          status: customer.totalDue > 0 ? 'DUE' : 'PAID'
        })) || [];

        setVendorReport(vendorReportData);
        setCustomerReport(customerReportData);

        setSummary({
          totalPayables: purchaseOrdersResponse.data.totalDueAmount || 0,
          totalReceivables: salesPaymentResponse.data.totalDueAmount || 0,
          customersDueAmount: totalDueAmount,
          purchaseOrders: {
            total: purchaseOrdersResponse.data.totalAmount || 0,
            pending: purchaseOrdersResponse.data.partialAmount || 0,
            completed: purchaseOrdersResponse.data.paidAmount || 0,
            totalAmount: purchaseOrdersResponse.data.totalAmount || 0,
            pendingAmount: purchaseOrdersResponse.data.totalDueAmount || 0,
            completedAmount: purchaseOrdersResponse.data.paidAmount || 0
          },
          sales: {
            total: salesPaymentResponse.data.totalAmount || 0,
            pending: salesPaymentResponse.data.partialAmount || 0,
            completed: salesPaymentResponse.data.paidAmount || 0,
            totalAmount: salesPaymentResponse.data.totalAmount || 0,
            pendingAmount: salesPaymentResponse.data.totalDueAmount || 0,
            completedAmount: salesPaymentResponse.data.paidAmount || 0
          },
          customers: {
            total: creditorsResponse.data?.length || 0,
            withDues: creditorsWithDues.length || 0,
            averageDue: averageDue,
            overdueCount: creditorsWithDues.length || 0
          },
          medicines: {
            total: medicineStatsResponse.data?.totalMedicines || 0,
            lowStock: medicineStatsResponse.data?.lowStock || 0,
            outOfStock: medicineStatsResponse.data?.outOfStock || 0
          },
          vendors: {
            total: vendorSummaryResponse.data?.total || 0,
            active: vendorSummaryResponse.data?.active || 0,
            withDues: vendorSummaryResponse.data?.withDues || 0
          }
        });
      } catch (err) {
        setError('Failed to fetch financial summary');
        console.error('Error fetching summary:', err);
      } finally {
        setLoading(false);
      }
    };

    if (canAccessFinancialData(user)) {
      fetchSummary();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!canAccessFinancialData(user)) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Access Denied"
          description="You don't have permission to view financial data."
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert message={error} type="error" showIcon />
      </div>
    );
  }

  const vendorColumns = [
    {
      title: 'Vendor Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Total Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Pending Amount',
      dataIndex: 'pendingAmount',
      key: 'pendingAmount',
      render: (amount: number) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'PAID' ? 'green' :
          status === 'PARTIAL' ? 'orange' : 'red'
        }>
          {status}
        </Tag>
      ),
    },
  ];

  const customerColumns = [
    {
      title: 'Customer Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Total Purchases',
      dataIndex: 'totalPurchases',
      key: 'totalPurchases',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Pending Amount',
      dataIndex: 'pendingAmount',
      key: 'pendingAmount',
      render: (amount: number) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'PAID' ? 'green' :
          status === 'PARTIAL' ? 'orange' : 'red'
        }>
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <Layout className="layout">
      <Header className="header" style={{ background: '#5046e4', padding: '0 20px' }}>
        <div className="logo" style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
          Shyama Pharmacy
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Your health is our priority</div>
        </div>
      </Header>
      <Navbar />
      <Content style={{ padding: '24px', minHeight: '100vh', background: '#f0f2f5' }}>
        <div style={{ marginBottom: '24px' }}>
          <Button 
            type="link" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/dashboard')}
            style={{ marginBottom: '16px' }}
          >
            Back to Dashboard
          </Button>
          <Title level={2}>Financial Summary</Title>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card 
              title={
                <Space>
                  <DollarOutlined style={{ color: '#f5222d' }} />
                  <span>Total Payables</span>
                </Space>
              }
              variant="outlined"
              className="summary-card"
              style={{ height: '100%' }}
            >
              <Statistic
                value={summary?.totalPayables || 0}
                precision={2}
                prefix="₹"
                valueStyle={{ color: '#f5222d', fontSize: '24px' }}
              />
              <Divider />
              <List
                size="small"
                dataSource={[
                  { label: 'Total Purchase Orders', value: summary?.purchaseOrders?.total || 0 },
                  { label: 'Pending Orders', value: summary?.purchaseOrders?.pending || 0 },
                  { label: 'Completed Orders', value: summary?.purchaseOrders?.completed || 0 },
                  { label: 'Total Amount', value: `₹${(summary?.purchaseOrders?.totalAmount || 0).toFixed(2)}` },
                  { label: 'Pending Amount', value: `₹${(summary?.purchaseOrders?.pendingAmount || 0).toFixed(2)}` }
                ]}
                renderItem={item => (
                  <List.Item>
                    <Text>{item.label}</Text>
                    <Text strong>{item.value}</Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card 
              title={
                <Space>
                  <ShoppingCartOutlined style={{ color: '#52c41a' }} />
                  <span>Total Receivables</span>
                </Space>
              }
              variant="outlined"
              className="summary-card"
              style={{ height: '100%' }}
            >
              <Statistic
                value={summary?.totalReceivables || 0}
                precision={2}
                prefix="₹"
                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
              />
              <Divider />
              <List
                size="small"
                dataSource={[
                  { label: 'Total Sales', value: summary?.sales?.total || 0 },
                  { label: 'Pending Payments', value: summary?.sales?.pending || 0 },
                  { label: 'Completed Payments', value: summary?.sales?.completed || 0 },
                  { label: 'Total Amount', value: `₹${(summary?.sales?.totalAmount || 0).toFixed(2)}` },
                  { label: 'Pending Amount', value: `₹${(summary?.sales?.pendingAmount || 0).toFixed(2)}` }
                ]}
                renderItem={item => (
                  <List.Item>
                    <Text>{item.label}</Text>
                    <Text strong>{item.value}</Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card 
              title={
                <Space>
                  <UserOutlined style={{ color: '#1890ff' }} />
                  <span>Business Overview</span>
                </Space>
              }
              variant="outlined"
              className="summary-card"
              style={{ height: '100%' }}
            >
              <List
                size="small"
                dataSource={[
                  { 
                    label: 'Medicines',
                    value: `${summary?.medicines?.total || 0} total`,
                    description: (summary?.medicines?.lowStock || 0) > 0 ? `${summary?.medicines?.lowStock || 0} low stock` : null
                  },
                  { 
                    label: 'Vendors',
                    value: `${summary?.vendors?.total || 0} total`,
                    description: `${summary?.vendors?.active || 0} active, ${summary?.vendors?.withDues || 0} with dues`
                  },
                  { 
                    label: 'Customers',
                    value: `${summary?.customers?.total || 0} total`,
                    description: `${summary?.customers?.withDues || 0} with dues`
                  },
                  { 
                    label: 'Average Due',
                    value: `₹${(summary?.customers?.averageDue || 0).toFixed(2)}`,
                    description: `${summary?.customers?.overdueCount || 0} overdue`
                  }
                ]}
                renderItem={item => (
                  <List.Item>
                    <div>
                      <Text>{item.label}</Text>
                      <div>
                        <Text strong style={{ marginRight: 8 }}>{item.value}</Text>
                        {item.description && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>{item.description}</Text>
                        )}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        {/* Vendor Report */}
        <Card 
          title={
            <Space>
              <ArrowUpOutlined style={{ color: '#f5222d' }} />
              <span>Vendor Financial Report</span>
            </Space>
          }
          style={{ marginTop: '24px' }}
        >
          <Table 
            columns={vendorColumns} 
            dataSource={vendorReport}
            rowKey="name"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} vendors`
            }}
          />
        </Card>

        {/* Customer Report */}
        <Card 
          title={
            <Space>
              <ArrowDownOutlined style={{ color: '#52c41a' }} />
              <span>Customer Financial Report</span>
            </Space>
          }
          style={{ marginTop: '24px' }}
        >
          <Table 
            columns={customerColumns} 
            dataSource={customerReport}
            rowKey="name"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} customers`
            }}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default FinancialSummary; 