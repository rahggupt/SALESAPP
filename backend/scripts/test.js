const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let testVendorId = '';
let testMedicineId = '';
let testUserId = '';

// Test results storage
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
};

// Helper function to add test results
const addTestResult = (name, passed, error = null) => {
    testResults.total++;
    if (passed) {
        testResults.passed++;
    } else {
        testResults.failed++;
    }
    testResults.tests.push({
        name,
        passed,
        error
    });
};

// Helper function to print test results
const printTestResults = () => {
    console.log('\n=== Test Results ===');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log('\nDetailed Results:');
    testResults.tests.forEach(test => {
        console.log(`\n${test.passed ? '✓' : '✗'} ${test.name}`);
        if (!test.passed && test.error) {
            console.log(`  Error: ${test.error}`);
        }
    });
};

// Test authentication
const testAuth = async () => {
    try {
        // Test login
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@example.com',
            password: 'admin123'
        });
        authToken = loginResponse.data.token;
        addTestResult('Authentication - Login', true);
    } catch (error) {
        addTestResult('Authentication - Login', false, error.message);
    }
};

// Test user management
const testUserManagement = async () => {
    try {
        // Create new user
        const createUserResponse = await axios.post(
            `${API_URL}/users`,
            {
                name: 'Test User',
                email: 'testuser@example.com',
                password: 'test123',
                role: 'STAFF',
                phone: '1234567890',
                address: 'Test Address'
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        testUserId = createUserResponse.data._id;
        addTestResult('User Management - Create User', true);

        // Get all users
        const getUsersResponse = await axios.get(
            `${API_URL}/users`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('User Management - Get Users', true);

        // Get user profile
        const getUserProfileResponse = await axios.get(
            `${API_URL}/users/${testUserId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('User Management - Get User Profile', true);

        // Update user
        await axios.put(
            `${API_URL}/users/${testUserId}`,
            {
                name: 'Updated Test User',
                phone: '9876543210'
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('User Management - Update User', true);

        // Test user login with new credentials
        const userLoginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'testuser@example.com',
            password: 'test123'
        });
        addTestResult('User Management - Test User Login', true);

        // Change user password
        await axios.put(
            `${API_URL}/users/${testUserId}/password`,
            {
                currentPassword: 'test123',
                newPassword: 'newtest123'
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('User Management - Change Password', true);

        // Test login with new password
        const newPasswordLoginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'testuser@example.com',
            password: 'newtest123'
        });
        addTestResult('User Management - Test Login with New Password', true);

        // Deactivate user
        await axios.put(
            `${API_URL}/users/${testUserId}/status`,
            { isActive: false },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('User Management - Deactivate User', true);

        // Reactivate user
        await axios.put(
            `${API_URL}/users/${testUserId}/status`,
            { isActive: true },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('User Management - Reactivate User', true);

    } catch (error) {
        addTestResult('User Management', false, error.message);
    }
};

// Test vendor management
const testVendorManagement = async () => {
    try {
        // Create vendor
        const createVendorResponse = await axios.post(
            `${API_URL}/vendors`,
            {
                name: 'Test Vendor',
                phone: '1234567890',
                email: 'test@vendor.com',
                address: 'Test Address'
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        testVendorId = createVendorResponse.data._id;
        addTestResult('Vendor Management - Create Vendor', true);

        // Get vendors
        const getVendorsResponse = await axios.get(
            `${API_URL}/vendors`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('Vendor Management - Get Vendors', true);

        // Update vendor
        await axios.put(
            `${API_URL}/vendors/${testVendorId}`,
            { phone: '9876543210' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('Vendor Management - Update Vendor', true);
    } catch (error) {
        addTestResult('Vendor Management', false, error.message);
    }
};

// Test medicine management
const testMedicineManagement = async () => {
    try {
        // Create medicine
        const createMedicineResponse = await axios.post(
            `${API_URL}/medicines`,
            {
                name: 'Test Medicine',
                composition: ['Test Composition'],
                description: 'Test Description',
                category: 'test-category',
                price: 100,
                currency: 'NPR',
                priceUnit: 'piece',
                unitsPerPackage: 1,
                stock: 100,
                expiryDate: '2025-12',
                manufacturer: 'Test Manufacturer',
                batchNumber: 'TEST123',
                requiresPrescription: false,
                storage: 'cold',
                vendor: testVendorId,
                purchasePrice: 80,
                paymentStatus: 'DUE',
                paidAmount: 0
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        testMedicineId = createMedicineResponse.data._id;
        addTestResult('Medicine Management - Create Medicine', true);

        // Get medicines
        const getMedicinesResponse = await axios.get(
            `${API_URL}/medicines`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('Medicine Management - Get Medicines', true);

        // Update medicine
        await axios.put(
            `${API_URL}/medicines/${testMedicineId}`,
            { stock: 150 },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('Medicine Management - Update Medicine', true);

        // Test payment functionality
        await axios.put(
            `${API_URL}/medicines/${testMedicineId}/payment`,
            {
                paidAmount: 40,
                paymentStatus: 'PARTIAL'
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('Medicine Management - Update Payment', true);

        // Get payment history
        const paymentHistoryResponse = await axios.get(
            `${API_URL}/medicines/${testMedicineId}/payment-history`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('Medicine Management - Get Payment History', true);

        // Get payment summary
        const paymentSummaryResponse = await axios.get(
            `${API_URL}/medicines/payment/summary`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('Medicine Management - Get Payment Summary', true);
    } catch (error) {
        addTestResult('Medicine Management', false, error.message);
    }
};

// Test sales functionality
const testSales = async () => {
    try {
        // Create sale
        const createSaleResponse = await axios.post(
            `${API_URL}/sales`,
            {
                items: [{
                    medicine: testMedicineId,
                    quantity: 2,
                    price: 100
                }],
                totalAmount: 200,
                paymentMethod: 'CASH'
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('Sales Management - Create Sale', true);

        // Get sales
        const getSalesResponse = await axios.get(
            `${API_URL}/sales`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('Sales Management - Get Sales', true);

        // Get sales statistics
        const salesStatsResponse = await axios.get(
            `${API_URL}/sales/stats`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('Sales Management - Get Sales Statistics', true);
    } catch (error) {
        addTestResult('Sales Management', false, error.message);
    }
};

// Test purchase orders
const testPurchaseOrders = async () => {
    try {
        // Create purchase order
        const createOrderResponse = await axios.post(
            `${API_URL}/purchase-orders`,
            {
                vendor: testVendorId,
                items: [{
                    medicine: testMedicineId,
                    quantity: 10,
                    price: 80
                }],
                totalAmount: 800,
                paymentStatus: 'DUE'
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('Purchase Orders - Create Order', true);

        // Get purchase orders
        const getOrdersResponse = await axios.get(
            `${API_URL}/purchase-orders`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('Purchase Orders - Get Orders', true);

        // Update purchase order payment
        await axios.put(
            `${API_URL}/purchase-orders/${createOrderResponse.data._id}/payment`,
            {
                paidAmount: 400,
                paymentStatus: 'PARTIAL'
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        addTestResult('Purchase Orders - Update Payment', true);
    } catch (error) {
        addTestResult('Purchase Orders', false, error.message);
    }
};

// Cleanup function
const cleanup = async () => {
    try {
        // Delete test user
        if (testUserId) {
            await axios.delete(
                `${API_URL}/users/${testUserId}`,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
        }

        // Delete test medicine
        if (testMedicineId) {
            await axios.delete(
                `${API_URL}/medicines/${testMedicineId}`,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
        }

        // Delete test vendor
        if (testVendorId) {
            await axios.delete(
                `${API_URL}/vendors/${testVendorId}`,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
        }

        addTestResult('Cleanup - Delete Test Data', true);
    } catch (error) {
        addTestResult('Cleanup', false, error.message);
    }
};

// Main test function
const runTests = async () => {
    console.log('Starting tests...\n');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Run tests in sequence
        await testAuth();
        await testUserManagement();
        await testVendorManagement();
        await testMedicineManagement();
        await testSales();
        await testPurchaseOrders();
        await cleanup();

        // Print results
        printTestResults();

        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    } catch (error) {
        console.error('Test suite failed:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
};

// Run the tests
runTests(); 