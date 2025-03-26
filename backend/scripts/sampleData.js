const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const Category = require('../models/Category');
const Composition = require('../models/Composition');
const Vendor = require('../models/Vendor');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const VendorTransaction = require('../models/VendorTransaction');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Verify MongoDB URI is loaded
if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env file');
    process.exit(1);
}

const sampleData = {
  categories: [
    { name: 'Tablets', description: 'Oral solid dosage forms' },
    { name: 'Capsules', description: 'Oral solid dosage forms in gelatin shells' },
    { name: 'Syrups', description: 'Liquid oral medications' },
    { name: 'Injections', description: 'Parenteral medications' },
    { name: 'Ointments', description: 'Topical medications' }
  ],
  compositions: [
    { name: 'Paracetamol', description: 'Pain reliever and fever reducer' },
    { name: 'Amoxicillin', description: 'Antibiotic medication' },
    { name: 'Omeprazole', description: 'Proton pump inhibitor' },
    { name: 'Cetirizine', description: 'Antihistamine' },
    { name: 'Vitamin C', description: 'Ascorbic acid supplement' }
  ],
  vendors: [
    { name: 'PharmaCorp Inc.', phone: '1234567890', email: 'contact@pharmacorp.com', address: '123 Pharma Street' },
    { name: 'MediSupply Co.', phone: '0987654321', email: 'info@medisupply.com', address: '456 Medical Ave' },
    { name: 'HealthCare Distributors', phone: '5555555555', email: 'sales@healthcare.com', address: '789 Health Road' }
  ],
  customers: [
    { name: 'John Doe', phone: '1112223333', email: 'john@example.com', address: '123 Main St' },
    { name: 'Jane Smith', phone: '4445556666', email: 'jane@example.com', address: '456 Oak Ave' },
    { name: 'Bob Johnson', phone: '7778889999', email: 'bob@example.com', address: '789 Pine Rd' }
  ],
  medicines: [
    {
      name: 'Paracetamol 500mg',
      composition: 'Paracetamol',
      description: 'Pain reliever and fever reducer',
      category: 'Tablets',
      price: 10,
      currency: 'NPR',
      priceUnit: 'per tablet',
      stock: 1000,
      expiryDate: new Date('2025-12-31'),
      manufacturer: 'PharmaCorp Inc.',
      batchNumber: 'BATCH001',
      requiresPrescription: false,
      storage: 'Room Temperature',
      vendor: 'PharmaCorp Inc.',
      purchasePrice: 8,
      paymentStatus: 'PAID',
      paidAmount: 8000,
      dueAmount: 0
    },
    {
      name: 'Amoxicillin 500mg',
      composition: 'Amoxicillin',
      description: 'Antibiotic medication',
      category: 'Capsules',
      price: 15,
      currency: 'NPR',
      priceUnit: 'per capsule',
      stock: 500,
      expiryDate: new Date('2024-12-31'),
      manufacturer: 'MediSupply Co.',
      batchNumber: 'BATCH002',
      requiresPrescription: true,
      storage: 'Room Temperature',
      vendor: 'MediSupply Co.',
      purchasePrice: 12,
      paymentStatus: 'PARTIAL',
      paidAmount: 3000,
      dueAmount: 3000
    }
  ],
  sales: [
    {
      customer: 'John Doe',
      medicines: [
        { medicine: 'Paracetamol 500mg', quantity: 10, price: 10 }
      ],
      totalAmount: 100,
      discount: 5,
      finalAmount: 95,
      paymentType: 'CASH',
      paymentStatus: 'PAID',
      paidAmount: 95,
      dueAmount: 0,
      date: new Date()
    },
    {
      customer: 'Jane Smith',
      medicines: [
        { medicine: 'Amoxicillin 500mg', quantity: 20, price: 15 }
      ],
      totalAmount: 300,
      discount: 10,
      finalAmount: 290,
      paymentType: 'CREDIT',
      paymentStatus: 'PARTIAL',
      paidAmount: 150,
      dueAmount: 140,
      date: new Date()
    }
  ],
  vendorTransactions: [
    {
      vendor: 'PharmaCorp Inc.',
      medicine: 'Paracetamol 500mg',
      transactionType: 'PURCHASE',
      amount: 8000,
      paymentStatus: 'PAID',
      paidAmount: 8000,
      dueAmount: 0,
      notes: 'Initial stock purchase'
    },
    {
      vendor: 'MediSupply Co.',
      medicine: 'Amoxicillin 500mg',
      transactionType: 'PURCHASE',
      amount: 6000,
      paymentStatus: 'PARTIAL',
      paidAmount: 3000,
      dueAmount: 3000,
      notes: 'Partial payment for stock purchase'
    }
  ]
};

async function insertSampleData() {
  try {
    console.log('Connecting to MongoDB with URI:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Insert categories
    const categories = await Category.insertMany(sampleData.categories);
    console.log('Categories inserted');

    // Insert compositions
    const compositions = await Composition.insertMany(sampleData.compositions);
    console.log('Compositions inserted');

    // Insert vendors
    const vendors = await Vendor.insertMany(sampleData.vendors);
    console.log('Vendors inserted');

    // Insert customers
    const customers = await Customer.insertMany(sampleData.customers);
    console.log('Customers inserted');

    // Insert medicines
    const medicines = await Medicine.insertMany(sampleData.medicines);
    console.log('Medicines inserted');

    // Insert sales
    const sales = await Sale.insertMany(sampleData.sales);
    console.log('Sales inserted');

    // Insert vendor transactions
    const vendorTransactions = await VendorTransaction.insertMany(sampleData.vendorTransactions);
    console.log('Vendor transactions inserted');

    console.log('Sample data inserted successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error inserting sample data:', error);
    process.exit(1);
  }
}

insertSampleData(); 