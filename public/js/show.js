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

// On page load, resume any active ad countdown
window.addEventListener('load', function () {
  const isCountdownActive = localStorage.getItem("isCountdownActive");
  const countdownSeconds = localStorage.getItem("countdownSeconds");
  const adContent = localStorage.getItem("adContent");
  const tabChange = localStorage.getItem("tabChange") === "true";

  if (isCountdownActive === "true" && adContent) {
    const seconds = parseInt(countdownSeconds);
    isTabChangeEnabled = tabChange;

    const adContainer = document.querySelector('.modal-ad');
    adContainer.innerHTML = adContent;

    adModalInstance.show();
    startCountdown(seconds);
    if (isTabChangeEnabled) checkForWindowChange();

    localStorage.removeItem("isCountdownActive");
    localStorage.removeItem("countdownSeconds");
    localStorage.removeItem("adContent");
    localStorage.removeItem("tabChange");
  }
});

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

let intervalId;
let countdownSecondsRemaining;
let isTabChangeEnabled = false;
let isCountingDown = false;
let windowChangeCatcherInterval;
let isWindowFocused = document.hasFocus();
let sessionAds = []; // List of ad objects
let currentIndex = 0;
let sessionAdIndexKey;
let sessionAdsCount;

// Function to handle session ads
function handleSessionAd(streamId) {
  sessionAdsCount = sessionAds.length;
  sessionAdIndexKey = `sessionIndex_${streamId}`;

  // Fetch the index from localStorage or default to 0
  const sessionAdIndex = localStorage.getItem(sessionAdIndexKey);
  currentIndex = sessionAdIndex ? parseInt(sessionAdIndex) : 0;

  // Get the current ad's delay
  const sessionAdIntervalMs = parseInt(sessionAds[currentIndex].sessionAdTimeInterval) * 1000;

  // Start displaying the current ad
  createSessionAdTimeout(
    sessionAds[currentIndex].adTitle, 
    sessionAds[currentIndex].sessionAd, 
    sessionAdIntervalMs, 
    sessionAds[currentIndex].timer, 
    sessionAds[currentIndex].tabChange
  );
}

// Function to create the timeout and show the ad
function createSessionAdTimeout(modalTitle, adContent, delay, sessionTimer, tabChange) {
  setTimeout(() => {
    adModalTitle(modalTitle);
    showAdModal(adContent, sessionTimer, tabChange, modalTitle);
  }, delay);
}

function showAdModal(adContent, sessionTimer, tabChange, modalTitle) {
  // Pause the stream and prepare the modal
  pauseStream();
  const adContainer = document.querySelector('.modal-ad');
  loadAdScript(adContainer, adContent, sessionTimer, tabChange, modalTitle);

  // Set the ad title and show the modal
  const adTitleElement = document.getElementById('adTitle');
  adTitleElement.textContent = modalTitle;
  exitFullscreen();
  adModalInstance.show();
}

// Function to load the ad content and set up click behavior
function loadAdScript(container, adContent, sessionTimer, tabChange, modalTitle) {
  const streamId = getStreamIdFromURL();
  const streamUrl = `${API_BASE_URL}/show.html?id=${streamId}`;

  container.innerHTML = adContent;
  isTabChangeEnabled = tabChange;

  const adLink = container.querySelector('a');
  if (adLink) {
    adLink.addEventListener('click', function (event) {
      event.preventDefault();

      if (sessionTimer !== undefined) {
        // Set up countdown
        countdownSecondsRemaining = sessionTimer;
        startCountdown(sessionTimer);
        localStorage.setItem("isCountdownActive", "true");
        localStorage.setItem("countdownSeconds", sessionTimer);
        localStorage.setItem("adContent", adContent);
        localStorage.setItem("tabChange", tabChange);
      }

      // Open the ad link in a new window
      openLinks(streamUrl, adLink.href);
    });
  }
}

// Function to open the ad link and focus on the popup
function openLinks(streamLink, adLink) {
  const popupWindow = window.open(adLink, '_blank', 'width=600,height=400');

  setTimeout(() => {
    if (popupWindow) {
      popupWindow.focus();
    }
    window.location.href = streamLink;
  }, 100);
}

// Function to start the countdown
function startCountdown(seconds) {
  countdownSecondsRemaining = seconds;

  function countdownStep() {
    const countdownElement = document.getElementById('countdownDisplay');
    if (countdownElement) {
      if (countdownSecondsRemaining <= 0) {
        clearInterval(intervalId);

        if (currentIndex + 1 === sessionAdsCount) {
          // Last ad, remove session index from localStorage
          localStorage.removeItem(sessionAdIndexKey); // Remove session index
        } else {
          // Proceed to the next ad
          currentIndex++;
          localStorage.setItem(sessionAdIndexKey, currentIndex);

          const nextAd = sessionAds[currentIndex];
          const sessionAdIntervalMs = parseInt(nextAd.sessionAdTimeInterval) * 1000;
          createSessionAdTimeout(nextAd.adTitle, nextAd.sessionAd, sessionAdIntervalMs, nextAd.timer, nextAd.tabChange);
        }
        adModalInstance.hide();
      } else {
        countdownElement.textContent = countdownSecondsRemaining;
        countdownSecondsRemaining--;
      }
    }
  }

  countdownStep(); // Run countdown step immediately
  intervalId = setInterval(countdownStep, 1000);
  isCountingDown = true;

  if (isTabChangeEnabled) {
    checkForWindowChange(); // Watch for tab change if needed
  }
}

function pauseCountdown() {
  if (isCountingDown) {
    clearInterval(intervalId);
    isCountingDown = false;
    console.log("Countdown paused");
  }
}

function resumeCountdown() {
  if (!isCountingDown && countdownSecondsRemaining > 0) {
    intervalId = setInterval(() => {
      if (countdownSecondsRemaining > 0) {
        document.getElementById('countdownDisplay').textContent = countdownSecondsRemaining;
        countdownSecondsRemaining--;
      } else {
        clearInterval(intervalId);
        clearInterval(windowChangeCatcherInterval);
        adModalInstance.hide();
      }
    }, 1000);
    isCountingDown = true;
    console.log("Countdown resumed");
  }
}

// Function to monitor window focus
function checkForWindowChange() {
  windowChangeCatcherInterval = setInterval(() => {
    if (document.hasFocus() && !isWindowFocused) {
      pauseCountdown();
      console.log("User returned to the stream tab.");
      isWindowFocused = true;
    } else if (!document.hasFocus() && isWindowFocused) {
      resumeCountdown();
      console.log("User left the stream tab.");
      isWindowFocused = false;
    }
  }, 1000);
}

// Handle page reload
window.addEventListener('load', function () {
  sessionAdsCount = sessionAds.length;
  const isCountdownActive = localStorage.getItem("isCountdownActive");
  const countdownSeconds = localStorage.getItem("countdownSeconds");
  const adContent = localStorage.getItem("adContent");
  const tabChange = localStorage.getItem("tabChange") === "true";

  if (isCountdownActive === "true" && adContent) {
    const seconds = parseInt(countdownSeconds);
    isTabChangeEnabled = tabChange;

    const adContainer = document.querySelector('.modal-ad');
    adContainer.innerHTML = adContent;

    const adTitleContainer = document.querySelector('.modal-title');
    adTitleContainer.textContent = adTitle;

    adModalInstance.show();
    startCountdown(seconds);
    pauseCountdown();
    checkForWindowChange();

    // Clear localStorage flags after reload
    localStorage.removeItem("isCountdownActive");
    localStorage.removeItem("countdownSeconds");
    localStorage.removeItem("adContent");
    localStorage.removeItem("tabChange");
  }
});


/////////session ads/////////////////


window.closeAdModal = closeAdModal;
