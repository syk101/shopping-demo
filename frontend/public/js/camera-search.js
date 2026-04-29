/**
 * AI Camera Search Module
 * Can be included in any page to enable visual search.
 */

const CAMERA_MODAL_HTML = `
    <div id="cameraModal" class="modal-overlay">
        <div class="modal-container">
            <div class="modal-header">
                <h3>AI Camera Search</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div id="camera-view-container">
                    <video id="camera-video" autoplay playsinline></video>
                    <canvas id="camera-canvas" style="display:none;"></canvas>
                    <div class="camera-controls">
                        <button id="capture-btn" class="btn btn-primary">
                            <i class="fas fa-circle"></i> CAPTURE
                        </button>
                        <div class="upload-fallback">
                            <span>or</span>
                            <label for="image-upload" class="upload-label">
                                <i class="fas fa-upload"></i> UPLOAD IMAGE
                            </label>
                            <input type="file" id="image-upload" accept="image/*" style="display:none;">
                        </div>
                    </div>
                </div>
                
                <div id="search-loading" style="display:none;">
                    <div class="shimmer-container">
                        <div class="shimmer-line"></div>
                        <div class="shimmer-line"></div>
                        <div class="shimmer-line"></div>
                    </div>
                    <p>AI is analyzing your image...</p>
                </div>

                <div id="search-results-container" style="display:none;">
                    <h4>Similar Products Found</h4>
                    <div class="results-grid" id="search-results-grid"></div>
                    <div id="no-results" style="display:none; text-align: center; padding: 2rem;">
                        <i class="fas fa-search-minus" style="font-size: 3rem; opacity: 0.5;"></i>
                        <p>Product not found. Try a clearer photo!</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

function initCameraSearch() {
    // 1. Inject Modal if not present
    if (!document.getElementById('cameraModal')) {
        document.body.insertAdjacentHTML('beforeend', CAMERA_MODAL_HTML);
    }

    const cameraBtn = document.getElementById('camera-search-btn');
    const modal = document.getElementById('cameraModal');
    if (!cameraBtn || !modal) return;

    const closeModal = modal.querySelector('.close-modal');
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const captureBtn = document.getElementById('capture-btn');
    const imageUpload = document.getElementById('image-upload');
    const resultsContainer = document.getElementById('search-results-container');
    const resultsGrid = document.getElementById('search-results-grid');
    const loading = document.getElementById('search-loading');
    const noResults = document.getElementById('no-results');
    const cameraView = document.getElementById('camera-view-container');

    let stream = null;

    // Toggle Modal
    cameraBtn.addEventListener('click', async () => {
        modal.classList.add('active');
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            video.srcObject = stream;
        } catch (err) {
            console.error("Error accessing camera:", err);
            if (typeof showNotification === 'function') {
                showNotification("Could not access camera. Please use upload option.", "error");
            } else {
                alert("Could not access camera. Please use upload option.");
            }
        }
    });

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        modal.classList.remove('active');
        resetSearchUI();
    };

    closeModal.addEventListener('click', stopCamera);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) stopCamera();
    });

    function resetSearchUI() {
        resultsContainer.style.display = 'none';
        loading.style.display = 'none';
        cameraView.style.display = 'block';
        noResults.style.display = 'none';
        resultsGrid.innerHTML = '';
    }

    // Capture from Camera
    captureBtn.addEventListener('click', () => {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg');
        performAISearch(imageData);
    });

    // Handle File Upload
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                performAISearch(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    let extractor = null;
    let processor = null;

    async function getExtractor() {
        if (!extractor && window.AI_VISION_MODEL && window.AI_PROCESSOR) {
            console.log("Loading browser-side AI model (CLIP)...");
            try {
                processor = await window.AI_PROCESSOR.from_pretrained('Xenova/clip-vit-base-patch32');
                extractor = await window.AI_VISION_MODEL.from_pretrained('Xenova/clip-vit-base-patch32');
                console.log("AI model loaded successfully.");
            } catch (err) {
                console.error("Failed to load AI model:", err);
            }
        }
        return extractor;
    }

    async function performAISearch(base64Image) {
        cameraView.style.display = 'none';
        loading.style.display = 'block';
        resultsContainer.style.display = 'none';
        noResults.style.display = 'none';

        try {
            let requestBody = { image: base64Image };

            // If we are on production and transformers.js is available, generate vector in browser
            if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                try {
                    const model = await getExtractor();
                    if (model && processor) {
                        console.log("Generating vector in browser...");
                        const inputs = await processor(base64Image);
                        const { image_embeds } = await model(inputs);
                        
                        // Normalize vector (L2 norm)
                        const data = image_embeds.data;
                        let sumSq = 0;
                        for (let i = 0; i < data.length; i++) sumSq += data[i] * data[i];
                        const norm = Math.sqrt(sumSq);
                        
                        requestBody.vector = Array.from(data).map(x => x / norm);
                        console.log("Vector generated (" + requestBody.vector.length + " dimensions), sending to backend...");
                    } else {
                        console.warn("AI Model not ready, sending raw image...");
                    }
                } catch (aiErr) {
                    console.error("Browser AI failed, falling back to basic search:", aiErr);
                }
            }

            const response = await fetch('/api/search-by-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error('Search failed');

            const results = await response.json();
            displaySearchResults(results);
        } catch (err) {
            console.error("AI Search Error:", err);
            loading.style.display = 'none';
            cameraView.style.display = 'block';
            if (typeof showNotification === 'function') {
                showNotification("AI Search failed. Please try again.", "error");
            }
        }
    }

    function displaySearchResults(products) {
        loading.style.display = 'none';
        resultsContainer.style.display = 'block';
        resultsGrid.innerHTML = '';

        if (products.length === 0) {
            noResults.style.display = 'block';
            return;
        }

        products.forEach(product => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.style.cssText = `
                background: #f8fafc;
                border-radius: 12px;
                padding: 10px;
                text-align: center;
                border: 1px solid #e2e8f0;
                transition: transform 0.3s ease;
            `;
            
            const imageUrl = product.image || 'https://via.placeholder.com/150';
            
            // Find the appropriate add to cart function
            const cartFuncName = window.addToCart ? 'addToCart' : (window.cartAction ? 'cartAction' : 'console.log');
            
            resultItem.innerHTML = `
                <img src="${imageUrl}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">
                <h5 style="font-size: 0.9rem; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${product.name}</h5>
                <div style="font-weight: 700; color: #8b5cf6;">$${parseFloat(product.price).toFixed(2)}</div>
                <button class="btn btn-primary btn-small" style="width: 100%; margin-top: 8px; font-size: 0.7rem; padding: 5px;" onclick="${cartFuncName}(${product.id}, event)">
                    ADD TO CART
                </button>
            `;
            
            resultItem.addEventListener('mouseenter', () => resultItem.style.transform = 'translateY(-5px)');
            resultItem.addEventListener('mouseleave', () => resultItem.style.transform = 'translateY(0)');
            
            resultsGrid.appendChild(resultItem);
        });
    }
}

// Auto-initialize if button is found
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('camera-search-btn')) {
        initCameraSearch();
    }
});
