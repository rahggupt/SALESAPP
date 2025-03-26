const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
require('dotenv').config();

// Common compositions for medicines
const commonCompositions = [
  "Paracetamol", "Ibuprofen", "Aspirin", "Amoxicillin", "Ciprofloxacin",
  "Metformin", "Omeprazole", "Lisinopril", "Amlodipine", "Vitamin C",
  "Vitamin D", "Vitamin B12", "Iron", "Zinc", "Calcium",
  "Insulin", "Salbutamol", "Cetirizine", "Dextromethorphan", "Guaifenesin"
];

// Categories
const categories = [
  "pain-relief", "antibiotics", "vitamins", "prescription", "over-the-counter",
  "antihistamines", "antacids", "diabetes", "respiratory", "supplements"
];

// Manufacturers
const manufacturers = [
  "PharmaCorp", "MediPharma", "HealthPlus", "BioTech", "DigestHealth",
  "VaxCorp", "Shyama Pharmacy", "HealthCare", "PharmaTech", "MediPlus"
];

// Generate a random composition array
const generateComposition = () => {
  const numIngredients = Math.floor(Math.random() * 3) + 1;
  const composition = [];
  const availableCompositions = [...commonCompositions];
  
  for (let i = 0; i < numIngredients; i++) {
    const randomIndex = Math.floor(Math.random() * availableCompositions.length);
    composition.push(availableCompositions[randomIndex]);
    availableCompositions.splice(randomIndex, 1);
  }
  
  return composition;
};

// Generate a random medicine
const generateMedicine = (index) => {
  const composition = generateComposition();
  const category = categories[Math.floor(Math.random() * categories.length)];
  const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
  const storage = ['cold', 'extreme_cold', 'hot', 'extreme_hot'][Math.floor(Math.random() * 4)];
  const priceUnit = ['piece', 'box', 'strip', 'bottle', 'pack'][Math.floor(Math.random() * 5)];
  
  return {
    name: `Medicine ${index + 1}`,
    composition: composition,
    description: `Sample medicine ${index + 1} with ${composition.join(' + ')}`,
    category: category,
    price: (Math.random() * 100 + 5).toFixed(2),
    priceUnit: priceUnit,
    stock: Math.floor(Math.random() * 100) + 10,
    expiryDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000), // Random future date
    manufacturer: manufacturer,
    batchNumber: `${manufacturer.substring(0, 2)}${String(index + 1).padStart(4, '0')}`,
    requiresPrescription: Math.random() > 0.5,
    storage: storage
  };
};

// Generate 100 unique medicines
const generateMedicines = () => {
  const medicines = [];
  for (let i = 0; i < 100; i++) {
    medicines.push(generateMedicine(i));
  }
  return medicines;
};

const seedMedicines = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Medicine.deleteMany({});
    console.log('Cleared existing medicines');

    // Generate and insert new medicines
    const medicines = generateMedicines();
    const insertedMedicines = await Medicine.insertMany(medicines);
    console.log(`Successfully inserted ${insertedMedicines.length} medicines`);

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding medicines:', error);
    process.exit(1);
  }
};

seedMedicines(); 