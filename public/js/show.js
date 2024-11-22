import { HlsJsP2PEngine } from "p2p-media-loader-hlsjs";
import { API_BASE_URL } from './constant.js';

export const adModalInstance = new bootstrap.Modal(document.getElementById('adModal'), {
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
    sessionAds = streamData.sessionAds;
    updateUIWithStreamData(streamData);
    handleSessionAd(streamId);
    handlePopupAds(streamData.createdAt, streamData.popupAds);
  }
}

export function getStreamIdFromURL() {
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

function handlePopupAds(createdAt, popupAds) {
  const creationTime = new Date(createdAt).getTime(); 
  const now = Date.now();

  popupAds.forEach((popupAd, index) => {
    const popupAdTimeMs = parseInt(popupAd.popupAdTimeInterval) * 60 * 1000;
    const adShowTime = creationTime + popupAdTimeMs;

    if (now < adShowTime) {
      adModalTitle(popupAd.adTitle);
      createPopupAdTimeout(popupAd.popupAd, adShowTime - now, popupAd.timer, popupAd.adTitle);
    }
  });
}

function createPopupAdTimeout(adContent, delay, timer, modalTitle) {
  setTimeout(() => {
    showAdModal(adContent, timer, modalTitle);
  }, delay); 
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

export function pauseStream() {
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

// Exit fullscreen only if currently in fullscreen
export function exitFullscreen() {
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

// Update modal title
function adModalTitle(title) {
  const titleElement = document.getElementById('adTitle');
  if (titleElement) {
    titleElement.textContent = title;
  }
}

/////////session ads/////////////////

// function loadAdScript(container, adContent, sessionTimer, tabChange, modalTitle) {
//   const streamId = getStreamIdFromURL();
//   const streamUrl = `${API_BASE_URL}/show.html?id=${streamId}`;

//   container.innerHTML = adContent;
// }

function loadAdScript(container, adContent) {
  container.innerHTML = adContent;
}

let sessionAds = [];
let sessionAdIndexKey;
let currentAdIndex;
let isPaused = false;
let intervalId; 
let isWindowFocused = document.hasFocus();
let windowChangeCatcherInterval;
let sessionAdsCount;


function handleSessionAd(streamId) {
  sessionAdsCount = sessionAds.length;
  sessionAdIndexKey = `sessionIndex_${streamId}`;

  const storageValue = localStorage.getItem(sessionAdIndexKey);

  currentAdIndex = storageValue ? parseInt(storageValue) : 0;

  createSessionAdTimeout(sessionAds[currentAdIndex]);
}

function createSessionAdTimeout(sessionAd) {
  sessionAd.sessionAd = addOnClickToAnchor(sessionAd.sessionAd, sessionAd.timer, sessionAd.tabChange);
  const adContainer = document.querySelector('.modal-ad');
  setTimeout(() => {
    adModalTitle(sessionAd.adTitle);
    showAdModal(sessionAd.sessionAd);
  }, parseInt(sessionAd.sessionAdTimeInterval) * 1000)
}

function addOnClickToAnchor(adContent, timerInSeconds, tabChange) {
  const hrefMatch = adContent.match(/href="([^"]*)"/);
  const adLink = hrefMatch ? hrefMatch[1] : null;

  if (adLink) {
    return adContent
      .replace(/href="[^"]*"/, '') 
      .replace(
        /<a /g,
        `<a onclick="startTimer(${timerInSeconds}, '${adLink}', ${tabChange});" `
      );
  }
  return adContent;
}

function showAdModal(adContent) {
  pauseStream();
  exitFullscreen();

  const adContainer = document.querySelector('.modal-ad');
  loadAdScript(adContainer, adContent);

  adModalInstance.show();
}

function startTimer(seconds, adLink, tabChange) {
  clearInterval(intervalId);
  clearInterval(windowChangeCatcherInterval);
  if(tabChange) {
    document.getElementById('must-watch').hidden = false;
    isPaused = true;
  }
  openLink(adLink);   

  startCountdown(seconds);

  if(tabChange) {
    checkForWindowChange();
  } 

  
}

function startCountdown(countdownValue) {
  document.getElementById("countdownDisplay").textContent = countdownValue;
  intervalId = setInterval(() => {
    if (!isPaused) { 
      countdownValue--;
      document.getElementById("countdownDisplay").textContent = countdownValue;

      if (countdownValue <= 0) {        
        clearInterval(intervalId);
        clearInterval(windowChangeCatcherInterval);
        isPaused = false;
        adModalInstance.hide();
        document.getElementById('must-watch').hidden = false;
        document.getElementById("countdownDisplay").textContent = "";
        if(parseInt(currentAdIndex)+1 === sessionAdsCount) {
          localStorage.removeItem(sessionAdIndexKey);
        } else {
          localStorage.setItem(sessionAdIndexKey, ++currentAdIndex);
          createSessionAdTimeout(sessionAds[currentAdIndex]);
        }            
      }
    }
  }, 1000);
}

function openLink(adLink) {
  const popupWindow = window.open(adLink, '_blank', 'width=600,height=400');
  setTimeout(() => {
    if (popupWindow) {
      popupWindow.focus();
    }
  }, 100);
}


// Function to monitor window focus
function checkForWindowChange() {
  windowChangeCatcherInterval = setInterval(() => {
    if (document.hasFocus()) {
      isPaused = true;
    } else if (!document.hasFocus()) {
      isPaused = false;
    }
  }, 1000);
}




/////////session ads/////////////////


window.closeAdModal = closeAdModal;
window.startTimer = startTimer;
