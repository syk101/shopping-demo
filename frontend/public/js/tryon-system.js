// AI Virtual Try-On System
class TryOnSystem {
    constructor() {
        this.userImage = null;
        this.selectedProductId = null;
        this.modal = document.getElementById('tryon-modal');
        this.previewContainer = document.getElementById('tryon-preview');
        this.uploadInput = document.getElementById('avatar-upload');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Use a more robust way to attach listeners
        const attach = (id, event, fn) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, fn);
        };

        attach('avatar-upload', 'change', (e) => this.handleUpload(e));
        attach('open-camera', 'click', () => this.startCamera());
        attach('close-tryon', 'click', () => this.toggleModal(false));
        attach('start-tryon', 'click', () => this.executeTryOn());
    }

    toggleModal(force = null, productId = null) {
        if (!this.modal) {
            this.modal = document.getElementById('tryon-modal');
            if (!this.modal) return;
        }
        this.selectedProductId = productId;
        const show = force !== null ? force : !this.modal.classList.contains('active');
        if (show) {
            this.modal.classList.add('active');
            this.setupEventListeners();
            
            // PREDICTIVE LOADING: Start AR initialization in background immediately
            if (window.tryOnAR && typeof window.tryOnAR.init === 'function') {
                console.log("[TryOnSystem] Predictive AR init started...");
                window.tryOnAR.init().catch(err => console.warn("Predictive AR init failed:", err));
            }
        }
        else this.modal.classList.remove('active');
    }

    handleUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.userImage = event.target.result;
                this.showPreview(this.userImage);
            };
            reader.readAsDataURL(file);
        }
    }

    async executeTryOn() {
        console.log("[TryOnSystem] Starting executeTryOn...");
        if (!this.userImage || !this.selectedProductId) {
            console.warn("[TryOnSystem] Missing userImage or selectedProductId");
            window.showNotification('Please upload or capture a photo first', 'error');
            return;
        }

        const startBtn = document.getElementById('start-tryon');
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GENERATING...';
        }

        const container = this.previewContainer;
        container.innerHTML += `
            <div class="ar-processing" id="processing-overlay">
                <div class="ar-scan-line"></div>
                <div class="ai-status-pulse">
                    <i class="fas fa-brain fa-2x" style="color: #fff;"></i>
                </div>
                <h3 id="ai-status-text" style="letter-spacing: 4px; font-weight: 800; text-transform: uppercase; margin-bottom: 5px;">Analyzing Pose...</h3>
                <p id="ai-status-subtext" style="color: rgba(255,255,255,0.6); font-size: 0.8rem;">Gemini Multimodal Vision Active</p>
            </div>
        `;

        // Status update helper
        const updateStatus = (text, subtext) => {
            const t = document.getElementById('ai-status-text');
            const s = document.getElementById('ai-status-subtext');
            if (t) t.innerText = text;
            if (s) s.innerText = subtext;
        };

        try {
            // 1. Get Product Info
            updateStatus("FETCHING ASSETS...", "Preparing high-res product data");
            const resProd = await fetch('/api/products');
            const products = await resProd.json();
            const product = products.find(p => p.id == this.selectedProductId);
            const category = product?.category || 'clothing';

            let anchors = null;
            try {
                // 2. Initialize AR and Get Anchors (with timeout)
                console.log("[TryOnSystem] Initializing AR...");
                if (window.tryOnAR && typeof window.tryOnAR.init === 'function') {
                    const initPromise = window.tryOnAR.init();
                    const timeoutPromise = new Promise((_, rej) => setTimeout(() => rej(new Error("AR Init Timeout")), 10000));
                    
                    await Promise.race([initPromise, timeoutPromise]);
                    console.log("[TryOnSystem] AR Initialized. Fetching anchors...");
                    
                    const tempImg = new Image();
                    tempImg.src = this.userImage;
                    await new Promise((res, rej) => {
                        tempImg.onload = res;
                        tempImg.onerror = () => rej(new Error("Failed to load user image into DOM"));
                    });
                    
                    // Add strict 3-second timeout for MediaPipe processing
                    const anchorPromise = window.tryOnAR.getAnchors(tempImg, category);
                    const anchorTimeout = new Promise((_, rej) => setTimeout(() => rej(new Error("AR getAnchors Timeout")), 3000));
                    
                    anchors = await Promise.race([anchorPromise, anchorTimeout]);
                    console.log("[TryOnSystem] Anchors mapping result:", anchors ? "Success" : "Failed (Fallback will be used)");
                } else {
                    console.warn("[TryOnSystem] tryOnAR not found, skipping AR alignment");
                }
            } catch (arErr) {
                console.warn('[TryOnSystem] AR Alignment process error:', arErr.message);
                anchors = null; // Ensure anchors is null so backend uses default positioning
            }

            // 3. Call Backend (with anchors if available)
            updateStatus("GEMINI ORCHESTRATION...", "Generating fusion instructions");
            console.log("[TryOnSystem] Calling backend /api/ai/tryon...");
            const res = await fetch('/api/ai/tryon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    image: this.userImage, 
                    product_id: this.selectedProductId,
                    anchors: anchors
                })
            });
            
            updateStatus("EXECUTING FUSION...", "Applying lighting and perspective");
            console.log("[TryOnSystem] Backend response status:", res.status);
            const data = await res.json();
            console.log("[TryOnSystem] Backend response data:", data);
            
            if (data.success) {
                // 4. Render Professional Slider
                if (window.tryOnAR && typeof window.tryOnAR.renderSlider === 'function') {
                    window.tryOnAR.renderSlider(container, this.userImage, data.result_url, this.selectedProductId);
                } else {
                    container.innerHTML = `<img id="fallback-tryon-img" alt="Try-on Result" style="max-width: 100%; border-radius: 12px;">`;
                    const fallbackImg = container.querySelector('#fallback-tryon-img');
                    if (fallbackImg) fallbackImg.src = data.result_url;
                }
                
                // RESET BUTTON ON SUCCESS
                if (startBtn) {
                    startBtn.disabled = false;
                    startBtn.innerHTML = '<i class="fas fa-redo"></i> TRY ANOTHER';
                    startBtn.classList.remove('pulse');
                }
                
                window.showNotification('AI Styled Successfully!', 'success');
            } else {
                throw new Error(data.error || 'Backend failed to generate preview');
            }
        } catch (err) {
            console.error('AR Try-on failed:', err);
            window.showNotification('AI Alignment failed. Try a clearer photo.', 'error');
            this.showPreview(this.userImage); // Revert to preview
        } finally {
            // ALWAYS RESET BUTTON
            const startBtn = document.getElementById('start-tryon');
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.classList.remove('pulse');
                if (startBtn.innerHTML.includes('GENERATING')) {
                    startBtn.innerHTML = '<i class="fas fa-redo"></i> TRY AGAIN';
                }
            }
        }
    }

    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            
            this.previewContainer.innerHTML = '';
            this.previewContainer.appendChild(video);
            this.previewContainer.innerHTML += `
                <div class="snap-ui">
                    <button class="snap-btn" id="take-snap"></button>
                    <p class="text-white">Align your body in the frame</p>
                </div>
            `;
            
            document.getElementById('take-snap').onclick = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0);
                this.userImage = canvas.toDataURL('image/jpeg');
                stream.getTracks().forEach(t => t.stop());
                this.showPreview(this.userImage);
            };
        } catch (err) {
            window.showNotification('Camera access denied', 'error');
        }
    }

    showPreview(imgSrc) {
        if (this.previewContainer) {
            this.userImage = imgSrc;
            this.previewContainer.innerHTML = `
                <div class="ba-slider" style="animation: fadeIn 0.5s ease-out;">
                    <img src="${imgSrc}" alt="Avatar Preview" style="width: 100%; height: 100%; object-fit: contain;">
                    <div class="ai-badge" style="top: 20px; right: 20px;">
                        <i class="fas fa-camera"></i> SOURCE CAPTURED
                    </div>
                </div>
            `;
            
            // Ensure the Generate button is prominent
            const startBtn = document.getElementById('start-tryon');
            if (startBtn) {
                startBtn.innerHTML = '<i class="fas fa-sparkles"></i> GENERATE PREVIEW';
                startBtn.classList.add('pulse');
                startBtn.disabled = false;
            }
        }
    }

    downloadResult(url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `shoppo_tryon_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.showNotification('Photo saved to your gallery!', 'success');
    }
}

window.tryOnSystem = new TryOnSystem();
window.openTryOn = (productId, event) => {
    if (event) event.stopPropagation();
    window.tryOnSystem.toggleModal(true, productId);
};
