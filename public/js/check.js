

import { HlsJsP2PEngine } from "p2p-media-loader-hlsjs";
import { API_BASE_URL } from './constant.js';

const adModalInstance = new bootstrap.Modal(document.getElementById('adModal'), {
  backdrop: 'static',
  keyboard: false
});

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

// Function to dynamically load and execute an ad's content
function loadAdScript(container, adContent) {
  // Clean up any escaped characters
  adContent = adContent.replace(/\\"/g, '"');

  // Check if the ad content includes <script> tags
  const scriptMatches = [...adContent.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  const anchorMatches = adContent.match(/<a\b[^>]*>([\s\S]*?)<\/a>/gi);

  // Clear the container before inserting new content
  container.innerHTML = '';

  // Process each <script> tag separately if any exist
  if (scriptMatches.length > 0) {
    scriptMatches.forEach((match) => {
      const inlineContent = match[1]; // Inline content inside <script> tags, if any
      const scriptSrcMatch = match[0].match(/src="([^"]+)"/);

      // Create a new script element
      const scriptElement = document.createElement('script');
      scriptElement.type = 'text/javascript';

      if (scriptSrcMatch && scriptSrcMatch[1]) {
        // If the script tag has a src attribute, set it as the src of the script element
        scriptElement.src = scriptSrcMatch[1];
        scriptElement.async = true;
      } else if (inlineContent) {
        // If there is inline script content, set it as the innerHTML of the script element
        scriptElement.innerHTML = inlineContent;
      }

      // Append the script element to the container
      container.appendChild(scriptElement);
    });
  }

  // Insert anchor tags or other HTML tags directly
  if (anchorMatches) {
    anchorMatches.forEach(anchorTag => {
      container.insertAdjacentHTML('beforeend', anchorTag);
    });
  }
}

function handleSessionAd(sessionAds) {
  const lastAdTime = localStorage.getItem('lastAdTime');
  const now = Date.now();

  if(!lastAdTime || now - lastAdTime > 24 * 60 * 60 * 1000) {
    setTimeout(() => {
      showAdModal(sessionAds[0].sessionAd);
      localStorage.setItem('lastAdTime', now);
    }, 1 * 60 * 1000);
  }
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
    handleSessionAd(streamData.sessionAds);
    handlePopupAds(streamData.createdAt, streamData.popupAds);
  }
}

document.getElementById('adModal').addEventListener('hidden.bs.modal', () => {
  playStream();
})

//handlePopupAds
let currentAdContent = null; // Store current ad content globally

// Function to initialize a popup ad based on interval
function handlePopupAds(createdAt, popupAds) {
  const creationTime = Date.now() - 1 * 60 * 1000; // Adjusted to test
  const now = Date.now();

  popupAds.forEach(popupAd => {
    const popupAdTimeMs = parseInt(popupAd.popupAdTimeInterval) * 60 * 1000;
    const adShowTime = creationTime + popupAdTimeMs;
    if (now < adShowTime) {
      createPopupAdTimeout({
        imgSrc: popupAd.imgSrc,
        iFrameSrc: popupAd.iFrameSrc,
        title: popupAd.adTitle,
        timer: popupAd.timer
      }, adShowTime - now);
    }
  });
}

// Function to trigger ad display with delay
function createPopupAdTimeout(adContent, delay) {
  setTimeout(() => {
    currentAdContent = adContent; // Set the ad content globally
    showAdModal(adContent);
  }, delay);
}

// Function to show the modal and load the initial ad image
function showAdModal(adContent) {
  pauseStream();
  document.getElementById('adTitle').textContent = adContent.title;
  document.getElementById('adIframe').style.display = 'none';

  const adImage = document.querySelector('.ad-image');  

  adImage.src = adContent.imgSrc;
  adImage.addEventListener('click', () => loadAdContent(adContent)); // Load iframe on click

  adModalInstance.show();
}

function loadAdContent(adContent) {
    const iframe = document.getElementById('adIframe');
    const adTitle = document.getElementById('adTitle');
    const spinner = document.getElementById('spinner');

    adTitle.textContent = '';
    document.querySelector('.modal-ad').style.display = 'none';

    // Set iframe source and wait for it to load before starting the timer
    spinner.style.display = 'block';
    iframe.src = adContent.iFrameSrc;
    iframe.style.display = 'block';

    // Start the timer once the iframe has loaded
    iframe.onload = () => {
        adTitle.style.display = 'block';
        spinner.style.display = 'none'; // Hide the spinner
        iframe.style.display = 'block'; // Show iframe content when fully loaded
        startTimer(adContent.timer);    // Start the countdown timer
    }
}

// Timer function with countdown and modal close
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
    }
  }, 1000);
}

// Close the ad modal
function closeAdModal() {  
  adModalInstance.hide();

  // Reset content for the next ad
  document.querySelector('.modal-ad').style.display = 'block';
  document.getElementById('adIframe').style.display = 'none';
  document.getElementById('adTitle').textContent = "Click on the image to load the ad";
}

//
window.onload = function() {
  init();
};

window.closeAdModal = closeAdModal;
window.loadAdContent = loadAdContent;