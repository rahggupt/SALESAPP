const crypto = require('crypto');

// Generate a random string of 64 bytes (128 characters in hex)
const secret = crypto.randomBytes(64).toString('hex');
console.log('Generated JWT_SECRET:');
console.log(secret); 