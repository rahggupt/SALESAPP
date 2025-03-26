# MongoDB CLI Guide for Medicine Shop

This guide provides instructions for managing users and data in the MongoDB database for the Medicine Shop application.

## Connecting to MongoDB CLI

```bash
# Connect to MongoDB shell
mongosh

# Select the medicine shop database
use medicine-shop
```

## Viewing Users

```bash
# List all users
db.users.find().pretty()

# Find a specific user by username
db.users.findOne({username: "admin"})
```

## Changing User Password

```bash
# Method 1: Using direct update
db.users.updateOne(
  { username: "admin" },
  { $set: { password: "$2a$10$YourHashedPasswordHere" } }
)

# Method 2: Using the app's seed script (recommended)
# 1. Edit the password in seed.js
# 2. Run: npm run seed
```

## Creating a New Hashed Password

Since passwords are hashed, you need to generate a hash before storing it in MongoDB. The easiest way is:

1. Edit `seed.js` to include your new user
2. Run `npm run seed`

## Managing Medicines

```bash
# List all medicines
db.medicines.find().pretty()

# Remove a medicine by ID
db.medicines.deleteOne({ _id: ObjectId("your-medicine-id") })

# Update medicine details
db.medicines.updateOne(
  { _id: ObjectId("your-medicine-id") },
  { $set: { price: 25.99, stock: 100 } }
)
```

## Backup and Restore

```bash
# Backup the database
mongodump --db medicine-shop --out ./backup

# Restore the database
mongorestore --db medicine-shop ./backup/medicine-shop
```

## Security Recommendation

For production environments, always:
1. Use strong passwords
2. Enable authentication
3. Restrict network access
4. Regularly backup your data 