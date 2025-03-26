# Medicine Shop Management System

A full-stack web application for managing a medicine shop's inventory, prescriptions, and sales.

## Features

- User authentication (Admin and General users)
- Medicine inventory management
- Prescription tracking
- Sales management
- Responsive design for mobile and desktop

## Tech Stack

- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: MongoDB
- Styling: Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd medicine-shop
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Create a `.env` file in the root directory:
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
```

5. Start the backend server:
```bash
npm run dev
```

6. Start the frontend development server:
```bash
cd frontend
npm start
```

## Default Admin Credentials

- Username: admin
- Password: admin123

## Deployment

The application can be deployed on various cloud platforms:

1. **Backend Deployment**:
   - Deploy to Heroku, DigitalOcean, or AWS
   - Set up environment variables
   - Configure MongoDB connection

2. **Frontend Deployment**:
   - Build the frontend: `cd frontend && npm run build`
   - Deploy to Netlify, Vercel, or AWS S3
   - Configure environment variables

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 