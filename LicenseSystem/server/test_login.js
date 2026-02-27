const axios = require('axios');

const testLogin = async () => {
    try {
        console.log('Testing Login...');
        const res = await axios.post('http://localhost:5001/api/auth/login', {
            username: 'admin',
            password: 'password123'
        });
        console.log('Success:', res.data);
    } catch (err) {
        if (err.response) {
            console.error('Error Status:', err.response.status);
            console.error('Error Data:', err.response.data);
        } else {
            console.error('Error:', err.message);
        }
    }
};

testLogin();
