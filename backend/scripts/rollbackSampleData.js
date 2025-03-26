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

const sampleDataNames = {
    categories: ['Tablets', 'Capsules', 'Syrups', 'Injections', 'Ointments'],
    compositions: ['Paracetamol', 'Amoxicillin', 'Omeprazole', 'Cetirizine', 'Vitamin C'],
    vendors: ['PharmaCorp Inc.', 'MediSupply Co.', 'HealthCare Distributors'],
    customers: ['John Doe', 'Jane Smith', 'Bob Johnson'],
    medicines: ['Paracetamol 500mg', 'Amoxicillin 500mg']
};

async function rollbackSampleData() {
    try {
        console.log('Connecting to MongoDB with URI:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete vendor transactions
        await VendorTransaction.deleteMany({
            vendor: { $in: sampleDataNames.vendors }
        });
        console.log('Vendor transactions deleted');

        // Delete sales
        await Sale.deleteMany({
            customer: { $in: sampleDataNames.customers }
        });
        console.log('Sales deleted');

        // Delete medicines
        await Medicine.deleteMany({
            name: { $in: sampleDataNames.medicines }
        });
        console.log('Medicines deleted');

        // Delete customers
        await Customer.deleteMany({
            name: { $in: sampleDataNames.customers }
        });
        console.log('Customers deleted');

        // Delete vendors
        await Vendor.deleteMany({
            name: { $in: sampleDataNames.vendors }
        });
        console.log('Vendors deleted');

        // Delete compositions
        await Composition.deleteMany({
            name: { $in: sampleDataNames.compositions }
        });
        console.log('Compositions deleted');

        // Delete categories
        await Category.deleteMany({
            name: { $in: sampleDataNames.categories }
        });
        console.log('Categories deleted');

        console.log('Sample data rolled back successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error rolling back sample data:', error);
        process.exit(1);
    }
}

rollbackSampleData(); 