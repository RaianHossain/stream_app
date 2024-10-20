// Function to get the stream ID from URL query parameter
        function getStreamIdFromURL() {
          const urlParams = new URLSearchParams(window.location.search);
          return urlParams.get('id'); // assuming the param is 'id'
        }

        // Fetch stream data from the API
        async function fetchStreamData(streamId) {
          try {
            const response = await fetch(`http://localhost:3000/api/streams/${streamId}`);
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
          const videoTitle = document.getElementById('videoTitle');

          videoTitle.textContent = streamData.title;

          // Initialize P2P Loader with HLS.js
          if (Hls.isSupported()) {
            const hls = new Hls();
            const p2pLoader = new p2pml.hlsjs.Engine();
            hls.config.loader = p2pLoader.createLoaderClass();
            hls.loadSource(streamData.stream);
            hls.attachMedia(videoPlayer);
          } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            // For Safari
            videoPlayer.src = streamData.stream;
          }

          hls.on(Hls.Events.ERROR, function (event, data) {
            console.error('HLS.js Error:', event, data);
        
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.error("Fatal network error encountered, trying to recover...");
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.error("Fatal media error encountered, trying to recover...");
                        hls.recoverMediaError();
                        break;
                    default:
                        console.error("Cannot recover from this error:", data);
                        hls.destroy();
                        break;
                }
            }
        });
        

          // Update ads dynamically
          const ad1Container = document.getElementById('ad1');
          const ad2Container = document.getElementById('ad2');

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
          }
        }

        // Initialize the page when loaded
        window.onload = init;