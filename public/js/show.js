import { HlsJsP2PEngine } from "p2p-media-loader-hlsjs";
import { API_BASE_URL } from './constant.js';


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
  const videoPlayer = document.getElementById('videoPlayer');
  const videoTitle = document.getElementById('videoTitle');
  const videoDescription = document.getElementById('videoDescription');

  videoPlayer.src = streamData.stream;
  videoTitle.textContent = streamData.title;
  videoDescription.textContent = streamData.description;

  const player = document.querySelector("media-player");
  const HlsWithP2P = HlsJsP2PEngine.injectMixin(window.Hls);

  player.addEventListener("provider-change", (event) => {
    const provider = event.detail;

    if (provider?.type === "hls") {
      provider.library = HlsWithP2P;
      provider.config = {
        p2p: {
          core: {
            swarmId: "test893648527354",
          },
          onHlsJsCreated: (hls) => {
            hls.p2pEngine.addEventListener("onPeerConnect", (params) => {
              console.log("Peer connected:", params.peerId);
            });
            hls.p2pEngine.addEventListener("onPeerDisconnect", (params) => {
              console.log("Peer disconnected:", params.peerId);
            });
          },
        },
      };
    }
  });

  const ad1Container = document.getElementById('ad1');
  const ad2Container = document.getElementById('ad2');

  loadAdScript(ad1Container, streamData.adOne);
  loadAdScript(ad2Container, streamData.adTwo);
}

function loadAdScript(container, adContent, sessionTimer=undefined) {
  const streamId = getStreamIdFromURL();
  const streamUrl = `${API_BASE_URL}/show.html?id=${streamId}`;

  container.innerHTML = adContent;

  const adLink = container.querySelector('a');
  if (adLink) {
    adLink.addEventListener('click', function(event) {
      event.preventDefault();

      if(sessionTimer !== undefined) {
        // Store ad content, countdown, and ad state in localStorage for the new tab
        localStorage.setItem("isCountdownActive", "true");
        localStorage.setItem("countdownSeconds", sessionTimer); // Set your countdown duration here
        localStorage.setItem("adContent", adContent); // Store ad content
      }

      // Open the ad in a new tab, and set the stream in the current tab
      window.open(adLink.href, '_blank');
      window.location.href = streamUrl;
    });
  }
}

// Code in the new tab (stream page) to check for countdown state and start timer if needed
window.addEventListener('load', function() {
  const isCountdownActive = localStorage.getItem("isCountdownActive");
  const countdownSeconds = localStorage.getItem("countdownSeconds");
  const adContent = localStorage.getItem("adContent");

  if (isCountdownActive === "true" && adContent) {
    const seconds = parseInt(countdownSeconds);

    // Insert ad content into the modal
    const adContainer = document.querySelector('.modal-ad');
    adContainer.innerHTML = adContent;

    // Show the modal with the countdown timer
    adModalInstance.show();
    startTimer(seconds);

    // Clear the countdown state to avoid restarting it on refresh
    localStorage.removeItem("isCountdownActive");
    localStorage.removeItem("countdownSeconds");
    localStorage.removeItem("adContent");
  }
});


// function loadAdScript(container, adContent) {
//   container.innerHTML = adContent;
// }

function handlePopupAds(createdAt, popupAds) {
  const creationTime = new Date(createdAt).getTime(); 
  const now = Date.now();

  popupAds.forEach((popupAd, index) => {
    const popupAdTimeMs = parseInt(popupAd.popupAdTimeInterval) * 60 * 1000;
    const adShowTime = creationTime + popupAdTimeMs;

    if (now < adShowTime) {
      adModalTitle(popupAd.adTitle);
      createPopupAdTimeout(popupAd.popupAd, adShowTime - now, popupAd.timer);
    }
  });
}

function createPopupAdTimeout(adContent, delay, timer) {
  setTimeout(() => {
    showAdModal(adContent, timer);
  }, delay); 
}

function handleSessionAd(streamId, sessionAds) {
  const sessionAdsCount = sessionAds.length;
  const sessionAdIndexKey = `sessionIndex_${streamId}`;
  const sessionAdIndex = localStorage.getItem(sessionAdIndexKey);
  const currentSessionAdIndex = sessionAdIndex ? parseInt(sessionAdIndex) : 0;

  for(let i = currentSessionAdIndex; i < sessionAdsCount; i++) {
    const sessionAdIntervalMs = parseInt(sessionAds[i].sessionAdTimeInterval) * 1000;
    createSessionAdTimeout(sessionAds[i].adTitle, sessionAds[i].sessionAd, sessionAdIntervalMs, sessionAds[i].timer, sessionAdIndexKey, i, sessionAdsCount);
  }
}

function createSessionAdTimeout(modalTitle, adContent, delay, sessionTimer, sessionAdIndexKey, currentIndex, sessionAdsCount) {
  setTimeout(() => {
    adModalTitle(modalTitle);
    showAdModal(adContent, sessionTimer);
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

function showAdModal(adContent, sessionTimer) {
  pauseStream();

  const adContainer = document.querySelector('.modal-ad');
  const modifiedAdContent = addOnClickToAnchor(adContent, sessionTimer);
  loadAdScript(adContainer, modifiedAdContent, sessionTimer);

  // Exit fullscreen if currently active, to ensure ad visibility
  exitFullscreen();
  adModalInstance.show();
}

// Call playStream once page loads and stream is ready
document.querySelector("media-player").addEventListener('canplay', () => {
  playStream();
});

function closeAdModal() {  
  adModalInstance.hide();

  document.querySelector('.modal-ad').style.display = 'block';
  document.getElementById('adTitle').textContent = "Click on the image to load the ad";
}

function pauseStream() {
  const player = document.querySelector("media-player");
  player.pause();
}

function playStream() {
  const player = document.querySelector("media-player");
  if (player) {
    // Try playing only after the media is confirmed to be ready
    setTimeout(() => {
      player.addEventListener('loadeddata', () => {
      player.play().catch(error => {
        console.error("Playback failed:", error);
      });
    }, { once: true }); 
    }, 3000);
  }
}

function addOnClickToAnchor(adContent, sessionTimer) {
  return adContent.replace(
    /<a /g,
    `<a onclick="startOnceTimer(event, ${sessionTimer});" `
  );
}

function startOnceTimer(event, seconds) {
  // Use event.currentTarget to access the clicked element
  const element = event.currentTarget;
  
  // Remove the onclick attribute to disable further clicks
  element.removeAttribute('onclick');  
  
  // Start the timer for the countdown
  startTimer(seconds);
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

function enterFullscreen(player) {
  if (player.requestFullscreen) {
    player.requestFullscreen();
  } else if (player.webkitRequestFullscreen) {
    player.webkitRequestFullscreen();
  }
}

// Exit fullscreen only if currently in fullscreen
function exitFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(error => {
      console.warn("Failed to exit fullscreen:", error);
    });
  }
}

window.onload = function() {
  init();
};

// Call playStream once page loads and stream is ready
document.querySelector("media-player").addEventListener('canplay', () => {
  playStream();
});

window.closeAdModal = closeAdModal;
window.startTimer = startTimer;
window.startOnceTimer = startOnceTimer;
