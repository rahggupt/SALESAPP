const config = {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    isProduction: process.env.NODE_ENV === 'production'
};

export default config; 