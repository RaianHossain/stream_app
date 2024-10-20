
import { API_BASE_URL as BASE_URL } from "./constant.js";

// const BASE_URL = "http://localhost:3000";
const user = JSON.parse(localStorage.getItem("user"));
const token = localStorage.getItem("token");
let streams = [];

if (!user || !token) {
    window.location.href = "login.html";
}

document.getElementById("loggedInName").textContent = user.firstName + " " + user.lastName;
const tableBody = document.getElementById('stream_tableBody');

const fetchStreams = async () => {
    try {
        const response = await fetch(`${BASE_URL}/api/streams`, {
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
        streams = await response.json();
        console.log(streams);
        populateTable(streams);
    } catch (error) {
        // populateTable([]);
        console.error('Error fetching streams:', error);
    }
};

// Populate the table with user data
const populateTable = (streams) => {
    
    tableBody.innerHTML = ''; // Clear existing table data
    if(streams.length > 0) {

        streams.forEach(stream => {
            const row = document.createElement('tr');        
            row.innerHTML = `
            <td>${stream.title}</td>
            <td>${stream.description}</td>
            <td>${stream.adOne}</td>
            <td>${stream.adTwo}</td>
            <td>
                <a href="show.html?id=${stream.id}"><button class="btn btn-info btn-sm"><i class="fa fa-eye" aria-hidden="true"></i></button></a>
                <button class="btn btn-warning btn-sm" onclick="openEditModal('${stream.id}')" data-toggle="modal" data-target="#addEditModal"><i class="fa fa-pencil-square" aria-hidden="true"></i></button>
                <button class="btn btn-danger btn-sm" onclick="deleteStream('${stream.id}')"><i class="fa fa-trash" aria-hidden="true"></i></button>
            </td>
        `;
            
            tableBody.appendChild(row);
        });
    }
};

const deleteStream = async (streamId) => {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${BASE_URL}/api/streams/${streamId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        console.log(`Stream with ID ${streamId} deleted successfully`);

        // Remove the row from the table after successful deletion
        fetchStreams();

    } catch (error) {
        console.error("Error deleting stream:", error);
    }
};

let isEdit = false;  // to track if we are editing or adding a user
let currentStreamId = null; // to hold the ID of the user being edited

// Function to open the modal for adding a user
const openAddModal = () => {
    //empty data-error error errorMessageHolder
    const errorMessageHolder = document.getElementById('data-error');
    errorMessageHolder.textContent = "";

    // Clear the form
    document.getElementById('addEditStreamForm').reset();

    // Update modal title and reset flags
    document.getElementById('addEditModalTitle').textContent = "Add New Stream";

    isEdit = false;
    currentStreamId = null;

    // Show the modal
    $('#addEditModal').modal('show');
};

// Function to open the modal for editing a user
const openEditModal = (streamId) => {
    //empty data-error error errorMessageHolder
    const errorMessageHolder = document.getElementById('data-error');
    errorMessageHolder.textContent = "";

    // Fetch the user details (replace this with your actual data source)
    const stream = streams.find(s => s.id === streamId);

    if (stream) {
        // Populate the form with existing user data
        document.getElementById('title').value = stream.title;
        document.getElementById('description').value = stream.description;
        document.getElementById('stream').value = stream.stream;
        document.getElementById('adOne').value = stream.adOne;
        document.getElementById('adTwo').value = stream.adTwo;

        // Update modal title and set flags
        document.getElementById('addEditModalTitle').textContent = "Edit Stream";

        
        isEdit = true;
        currentStreamId = streamId;

        // Show the modal
        $('#addEditModal').modal('show');
    }
};

// Function to handle saving changes
const saveChanges = async () => {
    //empty data-error error errorMessageHolder
    const errorMessageHolder = document.getElementById('data-error');
    errorMessageHolder.textContent = "";

    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const stream = document.getElementById('stream').value;
    const adOne = document.getElementById('adOne').value;
    const adTwo = document.getElementById('adTwo').value;
    
    // Collect the data to be sent to the server
    const streamData = {
        title,
        description,
        stream,
        adOne,
        adTwo
    };

   
    const token = localStorage.getItem('token');

    try {
        if (isEdit) {
            // If editing, send PUT request to update user
            const response = await fetch(`${BASE_URL}/api/streams/${currentStreamId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(streamData)
            });
            if (!response.ok) {
                const data = await response.json();
                if(data.error) {
                    const errorMessageHolder = document.getElementById('data-error');
                    errorMessageHolder.textContent = data.error;
                }
                throw new Error('Failed to update stream')
            };
            alert("Stream updated successfully");
        } else {
            // If adding, send POST request to create new user
            const response = await fetch(`${BASE_URL}/api/streams`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(streamData)
            });
            
            if (!response.ok) {
                const data = await response.json();
                if(data.error) {
                    const errorMessageHolder = document.getElementById('data-error');
                    errorMessageHolder.textContent = data.error;
                }
                throw new Error('Failed to create stream')
            };
            alert("Stream created successfully");
        }

        // Close the modal and reload the data
        $('#addEditModal').modal('hide');
        fetchStreams(); // Reload the table after saving
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




// Throttle resize event handler to avoid too many calls
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout); // Clear previous timeout
    resizeTimeout = setTimeout(() => {
        console.log('Resizing...', streams);
        if (streams.length > 0) {
            populateTable(streams); // Repopulate the table on resize
        }
    }, 250); // Adjust the delay as needed
});


// Fetch users on page load
window.onload = fetchStreams;
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.deleteStream = deleteStream;