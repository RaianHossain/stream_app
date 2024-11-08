

import { HlsJsP2PEngine } from "p2p-media-loader-hlsjs";
import { API_BASE_URL } from './constant.js';

let currentAdContent = null;

const adModalInstance = new bootstrap.Modal(document.getElementById('adModal'), {
  backdrop: 'static',
  keyboard: false
});

document.getElementById('adModal').addEventListener('hidden.bs.modal', () => {
  playStream();
}) 

async function init() {
  const streamId = getStreamIdFromURL();

  if (!streamId) {
    console.error('Stream ID not found in URL');
    return;
  }

  const streamData = await fetchStreamData(streamId);

  if (streamData) {
    updateUIWithStreamData(streamData);
    handleSessionAd(streamId, streamData.sessionAds);
    handlePopupAds(streamData.createdAt, streamData.popupAds);
  }
}

function getStreamIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id'); 
}

async function fetchStreamData(streamId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streams/${streamId}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const streamData = await response.json();
    return streamData;
  } catch (error) {
    console.error('Error fetching stream data:', error);
    return null;
  }
}

function updateUIWithStreamData(streamData) {
  // Update video player
  const videoPlayer = document.getElementById('videoPlayer');
  // const videoSource = document.getElementById('videoSource');
  const videoTitle = document.getElementById('videoTitle');
  const videoDescription = document.getElementById('videoDescription');
  const peerCountComp = document.getElementById('peerCount');

  videoPlayer.src = streamData.stream;
  videoTitle.textContent = streamData.title;
  videoDescription.textContent = streamData.description;

  const player = document.querySelector("media-player");
  // Inject P2P capabilities into Hls.js
  const HlsWithP2P = HlsJsP2PEngine.injectMixin(window.Hls);
  let peerCount = 0;
  player.addEventListener("provider-change", (event) => {
    const provider = event.detail;

    // Check if the provider is HLS
    if (provider?.type === "hls") {
      provider.library = HlsWithP2P;

      provider.config = {
        p2p: {
          core: {
            swarmId: "test893648527354",
            // other P2P engine config parameters go here
          },
          onHlsJsCreated: (hls) => {
            hls.p2pEngine.addEventListener("onPeerConnect", (params) => {
              peerCount++;
              
              console.log("Peer connected:", params.peerId);
            });
            hls.p2pEngine.addEventListener("onPeerDisconnect", (params) => {
              peerCount--;
              console.log("Peer connected:", params.peerId);
            });
            hls.p2pEngine.addEventListener("onChunkDownloaded", (params) => {
              
              console.log("Chunk Downloadinged");
            });
            // Subscribe to P2P engine and Hls.js events here
          },
        },
      };
    }
  });
  //
  playStream();

  // Update ads dynamically
  const ad1Container = document.getElementById('ad1');
  const ad2Container = document.getElementById('ad2');

  // Load the ad scripts properly by creating <script> elements
  loadAdScript(ad1Container, streamData.adOne);
  loadAdScript(ad2Container, streamData.adTwo);
}

// Function to dynamically load the ad content in the modal container
function loadAdScript(container, adContent) {
  container.innerHTML = adContent;
}

function handlePopupAds(createdAt, popupAds) {
  const creationTime = new Date(createdAt).getTime(); 
  const now = Date.now();

  popupAds.forEach((popupAd, index) => {
    const popupAdTimeMs = parseInt(popupAd.popupAdTimeInterval) * 60 * 1000;
    const adShowTime = creationTime + popupAdTimeMs;

    if (now < adShowTime) {
      alert("check")
      adModalTitle(popupAd.adTitle);
      createPopupAdTimeout(popupAd.popupAd, adShowTime - now);
    }
  });
}

function createPopupAdTimeout(adContent, delay) {
  setTimeout(() => {
    showAdModal(adContent);
  }, delay); 
}

// function handleSessionAd(streamId, sessionAds) {
//   const lastAdTimeKey = `lastAdTime_${streamId}`;
//   const sessionStartTimeKey = `sessionStartTime_${streamId}`;
//   const sessionAdIndexKey = `sessionIndex_${streamId}`;

//   const lastAdTime = localStorage.getItem(lastAdTimeKey);
//   const sessionStartTime = localStorage.getItem(sessionStartTimeKey);
//   const sessionAdIndex = localStorage.getTime(sessionAdIndexKey)
//   const now = Date.now();

//   // If session has not started or has reset based on sessionResetTime
//   if (!sessionStartTime || (now - sessionStartTime > sessionResetTime * 1000)) {
//     let currentSessionAdIndex = sessionAdIndex ? sessionAdIndex : 0;    

//     // Start a new session or reset the session start time
//     localStorage.setItem(sessionStartTimeKey, now);
//     localStorage.setItem(lastAdTimeKey, now);

//     // Show the session ad after the sessionTimeInterval
//     setTimeout(() => {
//       adModalAdTitle(sessionAds[currentSessionAdIndex].adTitle);
//       showAdModal(sessionAds[currentSessionAdIndex].sessionAd);
//       localStorage.setItem(lastAdTimeKey, now);

//       if(currentSessionAdIndex + 1 <= sessionAds.length) {
//         localStorage.setItem(sessionAdIndexKey, currentSessionAdIndex + 1)
//       } else {
//         localStorage.setItem(sessionAdIndexKey, 0);
//       }

//     }, sessionTimeInterval * 1000);

//   } else if (!lastAdTime || now - lastAdTime > sessionResetTime * 1000) {
//     let currentSessionAdIndex = sessionAdIndex ? sessionAdIndex : 0;

//     // If session has not reset but last ad shown time has passed sessionResetTime, show it again
//     setTimeout(() => {
//       adModalAdTitle(sessionAds[currentSessionAdIndex].adTitle);
//       showAdModal(sessionAds[currentSessionAdIndex].sessionAd);
//       localStorage.setItem(lastAdTimeKey, now);

//       if(currentSessionAdIndex + 1 <= sessionAds.length) {
//         localStorage.setItem(sessionAdIndexKey, currentSessionAdIndex + 1)
//       } else {
//         localStorage.setItem(sessionAdIndexKey, 0);
//       }

//     }, sessionTimeInterval * 1000);
//   }
// }

function handleSessionAd(streamId, sessionAds) {
  const sessionAdsCount = sessionAds.length;
  const sessionAdIndexKey = `sessionIndex_${streamId}`;
  const sessionAdIndex = localStorage.getItem(sessionAdIndexKey);
  const currentSessionAdIndex = sessionAdIndex ? parseInt(sessionAdIndex) : 0;

  for(let i = currentSessionAdIndex; i < sessionAdsCount; i++) {
    alert('check');
    const sessionAdIntervalMs = parseInt(sessionAds[i].sessionAdTimeInterval) * 1000;
    createSessionAdTimeout(sessionAds[i].adTitle, sessionAds[i].sessionAd, sessionAdIntervalMs, sessionAdIndexKey, i, sessionAdsCount);
  }
}

function createSessionAdTimeout(modalTitle, adContent, delay, sessionAdIndexKey, currentIndex, sessionAdsCount) {
  setTimeout(() => {
    adModalTitle(modalTitle);
    showAdModal(adContent);
    if(currentIndex+1 == sessionAdsCount) {
      localStorage.removeItem(sessionAdIndexKey);
    } else {
      localStorage.setItem(sessionAdIndexKey, currentIndex+1)
    }
  }, delay); 
}


function adModalTitle(title) {
  document.getElementById('adTitle').textContent = title;
}

function showAdModal(adContent) {
  pauseStream();

  const adContainer = document.querySelector('.modal-ad');
  const modifiedAdContent = addOnClickToAnchor(adContent);
  loadAdScript(adContainer, modifiedAdContent);

  adModalInstance.show();
}

function closeAdModal() {  
  adModalInstance.hide();

  // Reset content for the next ad
  document.querySelector('.modal-ad').style.display = 'block';
  document.getElementById('adTitle').textContent = "Click on the image to load the ad";
}

function pauseStream() {
  const player = document.querySelector("media-player");
  player.pause();
}

function playStream() {
  const player = document.querySelector("media-player");
  player.addEventListener('canplay', () => {
      player.play();
  });
}

// Helper function to add an onclick event to anchor tags in the ad content
function addOnClickToAnchor(adContent) {
  return adContent.replace(
    /<a /g,
    '<a onclick="startTimer(10);" '
  );
}

function startTimer(seconds) {
  const adTitle = document.getElementById('adTitle');
  let remainingTime = seconds;

  const interval = setInterval(() => {
    const minutes = Math.floor(remainingTime / 60);
    const displayTime = minutes > 0 ? `${minutes}m ${remainingTime % 60}s` : `${remainingTime}s`;
    adTitle.innerText = displayTime;

    remainingTime -= 1;
    if (remainingTime < 0) {
      clearInterval(interval);      
      closeAdModal();
      playStream();
    }
  }, 1000);
}

window.onload = function() {
  init();
};

window.closeAdModal = closeAdModal;
window.startTimer = startTimer;
