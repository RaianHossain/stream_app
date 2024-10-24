import { API_BASE_URL as BASE_URL } from "./constant.js";
// Function to handle form submission
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const errorMessageHolder = document.getElementById('login-error');
    errorMessageHolder.textContent = "";

    const email = document.getElementById('inputEmail').value;
    const password = document.getElementById('inputPassword').value;

    const payload = {
        email: email,
        password: password
    };

    // Send POST request to login API
    fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error) {
            const errorMessageHolder = document.getElementById('login-error');
            errorMessageHolder.textContent = data.error;
        }
        if (data.user && data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to another page if needed
            window.location.href = 'index.html';
        }
    })
    .catch(error => {
        console.error('Error during login:', error);
        alert('An error occurred. Please try again.');
    });
});

