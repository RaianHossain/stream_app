

import { HlsJsP2PEngine } from "p2p-media-loader-hlsjs";
import { API_BASE_URL } from './constant.js';
// Function to get the stream ID from URL query parameter
function getStreamIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id'); // assuming the param is 'streamId'
}

// Fetch stream data from the API
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

// Dynamically update the video player and ads
function updateUIWithStreamData(streamData) {
  // Update video player
  const videoPlayer = document.getElementById('videoPlayer');
  // const videoSource = document.getElementById('videoSource');
  // const videoTitle = document.getElementById('videoTitle');

  videoPlayer.src = streamData.stream;
  videoTitle.textContent = streamData.title;

  // // Load the new video source
  // videoPlayer.load();

  //
  const player = document.querySelector("media-player");
  // Inject P2P capabilities into Hls.js
  const HlsWithP2P = HlsJsP2PEngine.injectMixin(window.Hls);

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
              console.log("Peer connected:", params.peerId);
            });
            // Subscribe to P2P engine and Hls.js events here
          },
        },
      };
    }
  });
  //

  // Update ads dynamically
  const ad1Container = document.getElementById('ad1');
  const ad2Container = document.getElementById('ad2');

  // Load the ad scripts properly by creating <script> elements
  loadAdScript(ad1Container, streamData.adOne);
  loadAdScript(ad2Container, streamData.adTwo);
}

// Function to dynamically load and execute a script
function loadAdScript(container, adScriptContent) {
  // Create a script element
  const scriptElement = document.createElement('script');
  scriptElement.type = 'text/javascript';

  // Extract the src from the script content (if needed)
  const srcMatch = adScriptContent.match(/src="([^"]+)"/);
  if (srcMatch && srcMatch[1]) {
    scriptElement.src = srcMatch[1];
    scriptElement.async = true;
    container.innerHTML = ''; // Clear any existing content
    container.appendChild(scriptElement); // Append the script to execute it
  }
}

// Main function to initialize the dynamic page
async function init() {
  const streamId = getStreamIdFromURL();

  if (!streamId) {
    console.error('Stream ID not found in URL');
    return;
  }

  const streamData = await fetchStreamData(streamId);

  if (streamData) {
    updateUIWithStreamData(streamData);
    handleSessionAd(streamData.sessionAd);
    handlePopupAds(streamData.popupAds);
  }
}

// Initialize the page when loaded
// window.onload = init;
// Show modal 5 seconds after the session starts
window.onload = function() {
  init();
  // setTimeout(function() {
  //     var adModal = new bootstrap.Modal(document.getElementById('adModal'));
  //     adModal.show();
  // }, 1000);
};

function showAdModal(adContent) {
  document.querySelector('.modal-ad').innerHTML = adContent;
  const adModal = new bootstrap.Modal(document.getElementById('adModal'));
  adModal.show();
}

function handleSessionAd(sessionAd) {
  const lastAdTime = localStorage.getItem('lastAdTime');
  const now = Date.now();

  if(!lastAdTime || now - lastAdTime > 24 * 60 * 60 * 1000) {
    setTimeout(() => {
      showAdModal(sessionAd);
      localStorage.setItem('lastAdTime', now);
    }, 1 * 60 * 1000);
  }
}

function handlePopupAds(popupAds) {
  // const creationTime = new Date(createdAt).getTime();
  const creationTime = Date.now() - 1 * 60 * 1000;
  const now = Date.now();

  popupAds.forEach(popupAd => {
    const popupAdTimeMs = parseInt(popupAd.popupAdTimeInterval) * 60 * 1000;
    const adShowTime = creationTime + popupAdTimeMs;
    console.log("now", now);
    console.log("adShowTime", adShowTime);
    if (now < adShowTime) {
      createPopupAdTimeout(popupAd.popupAd, adShowTime - now);
    }
  })
}

function createPopupAdTimeout(adContent, delay) {
  setTimeout(() => {
    showAdModal(adContent);
  }, delay); // Delay is in milliseconds
}
