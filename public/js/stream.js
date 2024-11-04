
import { API_BASE_URL as BASE_URL } from "./constant.js";

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
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json', 
            }
        });
        console.log(response);
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        streams = await response.json();
        populateTable(streams);
    } catch (error) {
        // populateTable([]);
        console.error('Error fetching streams:', error);
    }
};

const populateTable = (streams) => {
    
    tableBody.innerHTML = ''; // Clear existing table data
    if(streams.length > 0) {

        streams.forEach(stream => {
            const row = document.createElement('tr');        
            row.innerHTML = `
            <td>${stream.title}</td>
            <td>${stream.description}</td>
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

        setTimeout(() => {
          fetchStreams();
        }, 1000);

    } catch (error) {
        console.error("Error deleting stream:", error);
    }
};



let isEdit = false;  
let currentStreamId = null; 

let sessionAdCount = 1;
let popupAdCount = 1;

const removeAd = (type, adGroupId) => {
    document.getElementById(adGroupId).remove();
    if(type == "sessionAd") {
        sessionAdCount = sessionAdCount - 1;
    } else if(type == "popupAd") {
        popupAdCount = popupAdCount - 1;
    }
  };

// Function to add Session Ad fields
const addSessionAd = () => {
  const sessionAdContainer = document.getElementById('sessionAdContainer');
  const adHtml = `
    <div class="d-flex mb-2" id="sessionAdGroup${sessionAdCount}">
      <textarea class="form-control" id="sessionAd${sessionAdCount}" name="sessionAds[${sessionAdCount}][sessionAd]" placeholder="Session Ad ${sessionAdCount}"></textarea>
      <input type="number" class="form-control mx-2" id="sessionAdTimeInterval${sessionAdCount}" name="sessionAds[${sessionAdCount}][sessionAdTimeInterval]" placeholder="Time Interval (seconds)" />
      <input type="text" class="form-control mx-2" id="sessionAdTitle${sessionAdCount}" name="sessionAds[${sessionAdCount}][adTitle]" placeholder="Ad Title" />
      <button type="button" class="btn btn-danger" onclick="removeAd('sessionAd','sessionAdGroup${sessionAdCount}')">-</button>
    </div>
  `;
  sessionAdContainer.insertAdjacentHTML('beforeend', adHtml);
  sessionAdCount++;
};

// Function to add Popup Ad fields
const addPopupAd = () => {
  const popupAdContainer = document.getElementById('popupAdContainer');
  const adHtml = `
    <div class="border p-3 rounded mb-2" id="popupAdGroup${popupAdCount}">
      <textarea class="form-control mb-2" id="popupAd${popupAdCount}" name="popupAds[${popupAdCount}][popupAd]" placeholder="Popup Ad ${popupAdCount}"></textarea>
      <input type="number" class="form-control mb-2" id="popupAdTimeInterval${popupAdCount}" name="popupAds[${popupAdCount}][popupAdTimeInterval]" placeholder="Time Interval (seconds)" />
      <input type="text" class="form-control mb-2" id="popupAdTitle${popupAdCount}" name="popupAds[${popupAdCount}][adTitle]" placeholder="Ad Title" />
      <input type="number" class="form-control mb-2" id="popupAdTimer${popupAdCount}" name="popupAds[${popupAdCount}][timer]" placeholder="Timer (seconds)" />
      <button type="button" class="btn btn-danger" onclick="removeAd('popupAd', 'popupAdGroup${popupAdCount}')">-</button>
    </div>
  `;
  popupAdContainer.insertAdjacentHTML('beforeend', adHtml);
  popupAdCount++;
};

// Function to open the edit modal and populate fields
const openEditModal = (streamId) => {
  const errorMessageHolder = document.getElementById('data-error');
  errorMessageHolder.textContent = "";

  const stream = streams.find(s => s.id === streamId);

  if (stream) {
    document.getElementById('title').value = stream.title;
    document.getElementById('description').value = stream.description;
    document.getElementById('stream').value = stream.stream;
    document.getElementById('adOne').value = stream.adOne;
    document.getElementById('adTwo').value = stream.adTwo;

    const sessionAdContainer = document.getElementById('sessionAdContainer');
    sessionAdContainer.innerHTML = '';
    sessionAdCount = 1;
    stream.sessionAds.forEach(ad => {
      addSessionAd();
      document.getElementById(`sessionAd${sessionAdCount - 1}`).value = ad.sessionAd;
      document.getElementById(`sessionAdTimeInterval${sessionAdCount - 1}`).value = ad.sessionAdTimeInterval;
      document.getElementById(`sessionAdTitle${sessionAdCount - 1}`).value = ad.adTitle;
    });

    const popupAdContainer = document.getElementById('popupAdContainer');
    popupAdContainer.innerHTML = '';
    popupAdCount = 1;
    stream.popupAds.forEach(ad => {
      addPopupAd();
      document.getElementById(`popupAd${popupAdCount - 1}`).value = ad.popupAd;
      document.getElementById(`popupAdTimeInterval${popupAdCount - 1}`).value = ad.popupAdTimeInterval;
      document.getElementById(`popupAdTitle${popupAdCount - 1}`).value = ad.adTitle;
      document.getElementById(`popupAdTimer${popupAdCount - 1}`).value = ad.timer;
    });

    document.getElementById('addEditModalTitle').textContent = "Edit Stream";
    isEdit = true;
    currentStreamId = streamId;

    $('#addEditModal').modal('show');
  }
};

const openAddModal = () => {
    const errorMessageHolder = document.getElementById('data-error');
    errorMessageHolder.textContent = "";

    document.getElementById('addEditStreamForm').reset();

    document.getElementById('addEditModalTitle').textContent = "Add New Stream";

    isEdit = false;
    currentStreamId = null;

    $('#addEditModal').modal('show');
};

// Function to save changes to the stream
const saveChanges = async () => {
  const errorMessageHolder = document.getElementById('data-error');
  errorMessageHolder.textContent = "";

  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  const stream = document.getElementById('stream').value;
  const adOne = document.getElementById('adOne').value;
  const adTwo = document.getElementById('adTwo').value;
  const createdAt = Date.now();

  const sessionAds = [];
  for (let i = 1; i < sessionAdCount; i++) {
    sessionAds.push({
      sessionAd: document.getElementById(`sessionAd${i}`).value,
      sessionAdTimeInterval: document.getElementById(`sessionAdTimeInterval${i}`).value,
      adTitle: document.getElementById(`sessionAdTitle${i}`).value
    });
  }

  const popupAds = [];
  for (let i = 1; i < popupAdCount; i++) {
    popupAds.push({
      popupAd: document.getElementById(`popupAd${i}`).value,
      popupAdTimeInterval: document.getElementById(`popupAdTimeInterval${i}`).value,
      adTitle: document.getElementById(`popupAdTitle${i}`).value,
      timer: document.getElementById(`popupAdTimer${i}`).value
    });
  }

  const streamData = { title, description, stream, adOne, adTwo, sessionAds, popupAds };

  const token = localStorage.getItem('token');

  try {
    const response = isEdit
      ? await fetch(`${BASE_URL}/api/streams/${currentStreamId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({...streamData, updatedAt: Date.now()})
        })
      : await fetch(`${BASE_URL}/api/streams`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({...streamData, createdAt: Date.now()})
        });

    const result = await response.json();
    if (response.status === 200) {
      fetchStreams();
      $('#addEditModal').modal('hide');
    } else {
      errorMessageHolder.textContent = result.error || "An error occurred.";
    }
  } catch (error) {
    errorMessageHolder.textContent = "Failed to save the stream.";
  }
};

function closeModal() {
    $('#addEditModal').modal('hide'); // This hides the modal
    if(sessionAdCount > 0) {
        for (let i = 1; i < sessionAdCount; i++) {
            removeAd(`sessionAdGroup${i}`);
        }
    }
    if(popupAdCount > 0) {
        for (let i = 1; i < popupAdCount; i++) {
            removeAd(`popupAdGroup${i}`);
        }
    }
}


let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout); 
    resizeTimeout = setTimeout(() => {
        console.log('Resizing...', streams);
        if (streams.length > 0) {
            populateTable(streams); 
        }
    }, 250); 
});


window.onload = fetchStreams;
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.deleteStream = deleteStream;
window.addSessionAd = addSessionAd;
window.addPopupAd = addPopupAd;
window.removeAd = removeAd;
window.saveChanges = saveChanges;