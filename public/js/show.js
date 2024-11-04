

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
    handleSessionAd(streamData.sessionAds);
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
      adModalAdTitle(popupAd.adTitle);
      createPopupAdTimeout(popupAd.popupAd, adShowTime - now);
    }
  });
}

function handleSessionAd(sessionAds) {
  const lastAdTime = localStorage.getItem('lastAdTime');
  const now = Date.now();

  if (!lastAdTime || now - lastAdTime > 24 * 60 * 60 * 1000) {
    setTimeout(() => {
      adModalAdTitle(sessionAds[0].adTitle);
      showAdModal(sessionAds[0].sessionAd);
      localStorage.setItem('lastAdTime', now);
    }, 1 * 60 * 1000); 
  }
}

function createPopupAdTimeout(adContent, delay) {
  setTimeout(() => {
    showAdModal(adContent);
  }, delay); 
}

function adModalAdTitle(title) {
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

function addOnClickToAnchor(adContent) {
    const modifiedAdContent = adContent.replace(
        /<a /,
        '<a onclick="startTimer(10)" '
    );
    return modifiedAdContent;
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
