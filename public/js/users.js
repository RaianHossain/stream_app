
import { API_BASE_URL as BASE_URL } from "./constant.js";
const user = JSON.parse(localStorage.getItem("user"));
const token = localStorage.getItem("token");
let users = [];

if (!user || !token) {
    window.location.href = "login.html";
}

document.getElementById("loggedInName").textContent = user.firstName + " " + user.lastName;
const tableBody = document.getElementById('user_tableBody');

const fetchUsers = async () => {
    try {
        const response = await fetch(`${BASE_URL}/auth/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Include the Bearer token
                'Content-Type': 'application/json', // Optional, depending on your API
            }
        });
        console.log(response);
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        users = await response.json();
        console.log(users);
        populateTable(users);
    } catch (error) {
        console.error('Error fetching users:', error);
    }
};

// Populate the table with user data
const populateTable = (users) => {
    
    tableBody.innerHTML = ''; // Clear existing table data

    users.forEach(user => {
        const row = document.createElement('tr');
        if(user.role === 'super-admin'){
            row.innerHTML = `
            <td>${user.firstName}</td>
            <td>${user.lastName}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>
                <button class="btn btn-primary" onclick="openEditModal('${user.id}')">Edit</button>
            </td>
        `;
        } else {
            row.innerHTML = `
            <td>${user.firstName}</td>
            <td>${user.lastName}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>
                <button class="btn btn-primary" onclick="openEditModal('${user.id}')" data-toggle="modal" data-target="#addEditModal">Edit</button>
                <button class="btn btn-danger" onclick="deleteUser('${user.id}')">Delete</button>
            </td>
        `;
        }
        
        tableBody.appendChild(row);
    });
};

const deleteUser = async (userId) => {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${BASE_URL}/auth/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        console.log(`User with ID ${userId} deleted successfully`);

        // Remove the row from the table after successful deletion
        fetchUsers();

    } catch (error) {
        console.error("Error deleting user:", error);
    }
};

let isEdit = false;  // to track if we are editing or adding a user
let currentUserId = null; // to hold the ID of the user being edited

// Function to open the modal for adding a user
const openAddModal = () => {
    //empty data-error error errorMessageHolder
    const errorMessageHolder = document.getElementById('data-error');
    errorMessageHolder.textContent = "";

    // Clear the form
    document.getElementById('addEditUserForm').reset();

    // Update modal title and reset flags
    document.getElementById('addEditModalTitle').textContent = "Add New User";

    // Show the password field for adding a new user
    document.getElementById('passwordField').style.display = 'block';

    isEdit = false;
    currentUserId = null;

    // Show the modal
    $('#addEditModal').modal('show');
};

// Function to open the modal for editing a user
const openEditModal = (userId) => {
    //empty data-error error errorMessageHolder
    const errorMessageHolder = document.getElementById('data-error');
    errorMessageHolder.textContent = "";

    // Fetch the user details (replace this with your actual data source)
    const user = users.find(u => u.id === userId);

    if (user) {
        // Populate the form with existing user data
        document.getElementById('firstName').value = user.firstName;
        document.getElementById('lastName').value = user.lastName;
        document.getElementById('email').value = user.email;
        document.getElementById('role').value = user.role;

        // Update modal title and set flags
        document.getElementById('addEditModalTitle').textContent = "Edit User";

        // Hide the password field when editing a user
        document.getElementById('passwordField').style.display = 'none';


        isEdit = true;
        currentUserId = userId;

        // Show the modal
        $('#addEditModal').modal('show');
    }
};

// Function to handle saving changes
const saveChanges = async () => {
    //empty data-error error errorMessageHolder
    const errorMessageHolder = document.getElementById('data-error');
    errorMessageHolder.textContent = "";

    const password = document.getElementById('password').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const role = document.getElementById('role').value;

    // Collect the data to be sent to the server
    const userData = {
        firstName,
        lastName,
        email,
        role
    };

    if (!isEdit && password) {
        userData.password = password; // Add the password only for new users
    }

    const token = localStorage.getItem('token');

    try {
        if (isEdit) {
            // If editing, send PUT request to update user
            const response = await fetch(`${BASE_URL}/auth/users/${currentUserId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            if (!response.ok) {
                const data = await response.json();
                if(data.error) {
                    const errorMessageHolder = document.getElementById('data-error');
                    errorMessageHolder.textContent = data.error;
                }
                throw new Error('Failed to update user')
            };
            alert("User updated successfully");
        } else {
            // If adding, send POST request to create new user
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const data = await response.json();
                if(data.error) {
                    const errorMessageHolder = document.getElementById('data-error');
                    errorMessageHolder.textContent = data.error;
                }
                throw new Error('Failed to create user')
            };
            alert("User created successfully");
        }

        // Close the modal and reload the data
        $('#addEditModal').modal('hide');
        fetchUsers(); // Reload the table after saving
    } catch (error) {
        console.error("Error saving changes:", error);
        alert("Error saving changes");
    }
};

function closeModal() {
    $('#addEditModal').modal('hide'); // This hides the modal
  }
  

// Attach event listeners
document.getElementById('saveChangesButton').addEventListener('click', saveChanges);



// Fetch users on page load

// Throttle resize event handler to avoid too many calls
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout); // Clear previous timeout
    resizeTimeout = setTimeout(() => {
        console.log('Resizing...', users);
        if (users.length > 0) {
            populateTable(users); // Repopulate the table on resize
        }
    }, 250); // Adjust the delay as needed
});


window.onload = fetchUsers;
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.deleteUser = deleteUser; 