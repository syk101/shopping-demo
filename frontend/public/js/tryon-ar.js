/**
 * Advanced AI Virtual Try-On AR System
 * Uses MediaPipe for body/face tracking and client-side stylization.
 */
class TryOnAR {
    constructor() {
        this.poseLandmarker = null;
        this.faceLandmarker = null;
        this.isInitialized = false;
        this.currentStream = null;
        this.categoryAnchors = {
            'clothing': ['LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT_HIP', 'RIGHT_HIP'],
            'eyewear': ['LEFT_EYE', 'RIGHT_EYE', 'NOSE_BRIDGE'],
            'headwear': ['LEFT_EAR', 'RIGHT_EAR', 'FOREHEAD'],
            'watches': ['LEFT_WRIST', 'RIGHT_WRIST'],
            'footwear': ['LEFT_ANKLE', 'RIGHT_ANKLE']
        };
    }

    async init() {
        if (this.isInitialized) return;
        
        // Load MediaPipe via CDN dynamically if not already loaded
        await this.loadScripts([
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js'
        ]);

        const mpVision = window.tasksVision || window.vision || (window.MediaPipe && window.MediaPipe.tasks && window.MediaPipe.tasks.vision);
        if (!mpVision) {
             console.warn("MediaPipe global not found directly. Throwing error to trigger backend fallback.");
             throw new Error("MediaPipe not loaded.");
        }

        const vision = await mpVision.FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );

        this.poseLandmarker = await mpVision.PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                delegate: "GPU"
            },
            runningMode: "IMAGE",
            numPoses: 1
        });

        this.isInitialized = true;
        console.log("Try-On AR Initialized with MediaPipe");
    }

    loadScripts(urls) {
        return Promise.all(urls.map(url => {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${url}"]`)) return resolve();
                const script = document.createElement('script');
                script.src = url;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }));
    }

    async getAnchors(imageElement, category) {
        if (!this.isInitialized) await this.init();

        // MediaPipe global is usually tasksVision or vision
        const mpVision = window.tasksVision || window.vision;
        if (!mpVision) {
            console.error("MediaPipe Tasks Vision not found");
            return null;
        }

        const result = await this.poseLandmarker.detect(imageElement);
        if (!result || !result.landmarks || result.landmarks.length === 0) {
            return null;
        }

        const landmarks = result.landmarks[0];
        // MediaPipe Pose Indices: 
        // 11: L_SHOULDER, 12: R_SHOULDER, 23: L_HIP, 24: R_HIP, 15: L_WRIST, 16: R_WRIST
        
        const anchors = {};
        const lowerCategory = category.toLowerCase();
        
        // More inclusive check for upper body clothing
        if (lowerCategory.includes('shirt') || 
            lowerCategory.includes('sweater') || 
            lowerCategory.includes('jacket') || 
            lowerCategory.includes('wear') || 
            lowerCategory.includes('clothing') ||
            lowerCategory.includes('suit')) {
            
            anchors.center = {
                x: (landmarks[11].x + landmarks[12].x) / 2,
                y: (landmarks[11].y + landmarks[12].y + landmarks[23].y + landmarks[24].y) / 4
            };
            anchors.width = Math.abs(landmarks[11].x - landmarks[12].x) * 1.5;
        } else if (lowerCategory.includes('watch') || lowerCategory.includes('accessory')) {
            // Use wrist
            const wrist = landmarks[15]; // Default to left
            anchors.center = { x: wrist.x, y: wrist.y };
            anchors.width = 0.1; // Small relative scale
        }

        return anchors;
    }
    renderSlider(container, beforeImg, afterImg, productId) {
        // Store results globally to avoid massive inline string injection
        window.currentTryOnResult = afterImg;
        window.currentTryOnSource = beforeImg;
        
        container.style.border = 'none';
        container.innerHTML = `
            <div class="ba-slider">
                <div class="ai-badge"><i class="fas fa-magic"></i> GENAI PREVIEW</div>
                <div class="ba-after"><img id="tryon-result-img" src=""></div>
                <div class="ba-before"><img id="tryon-source-img" src=""></div>
                <div class="ba-handle"><i class="fas fa-arrows-alt-h"></i></div>
            </div>
            <div class="result-toolbar">
                <button class="btn btn-primary" onclick="window.aiChatbot.addToCart(${productId})">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
                <button class="btn btn-secondary" onclick="window.tryOnSystem.downloadResult(window.currentTryOnResult)">
                    <i class="fas fa-download"></i> Save Photo
                </button>
                <button class="btn btn-outline" onclick="window.tryOnSystem.showPreview(window.currentTryOnSource)">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
        
        // Safely assign massive base64 strings after DOM creation
        const resultImg = container.querySelector('#tryon-result-img');
        const sourceImg = container.querySelector('#tryon-source-img');
        if (resultImg) resultImg.src = afterImg;
        if (sourceImg) sourceImg.src = beforeImg;

        this.initSliderLogic(container);
    }

    initSliderLogic(container) {
        const slider = container.querySelector('.ba-slider');
        const before = container.querySelector('.ba-before');
        const handle = container.querySelector('.ba-handle');
        
        const move = (e) => {
            const rect = slider.getBoundingClientRect();
            let xPos = 0;
            
            if (e.type === 'touchstart' || e.type === 'touchmove') {
                if (e.touches && e.touches.length > 0) {
                    xPos = e.touches[0].pageX - rect.left;
                    e.preventDefault(); // Prevent scrolling while sliding
                } else return;
            } else {
                xPos = e.pageX - rect.left;
            }

            let percent = (xPos / rect.width) * 100;
            if (percent < 0) percent = 0;
            if (percent > 100) percent = 100;
            
            before.style.width = `${percent}%`;
            handle.style.left = `${percent}%`;
        };

        ['mousemove', 'touchmove', 'touchstart'].forEach(evt => {
            slider.addEventListener(evt, move, { passive: false });
        });
    }
}

window.tryOnAR = new TryOnAR();
