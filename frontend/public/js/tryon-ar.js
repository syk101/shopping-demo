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

        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );

        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
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

        const result = await this.poseLandmarker.detect(imageElement);
        if (!result || !result.landmarks || result.landmarks.length === 0) {
            return null;
        }

        const landmarks = result.landmarks[0];
        // MediaPipe Pose Indices: 
        // 11: L_SHOULDER, 12: R_SHOULDER, 23: L_HIP, 24: R_HIP, 15: L_WRIST, 16: R_WRIST
        
        const anchors = {};
        if (category.includes('shirt') || category.includes('sweater') || category.includes('jacket')) {
            anchors.center = {
                x: (landmarks[11].x + landmarks[12].x) / 2,
                y: (landmarks[11].y + landmarks[12].y + landmarks[23].y + landmarks[24].y) / 4
            };
            anchors.width = Math.abs(landmarks[11].x - landmarks[12].x) * 1.5;
        } else if (category.includes('watch')) {
            // Use wrist
            const wrist = landmarks[15]; // Default to left
            anchors.center = { x: wrist.x, y: wrist.y };
            anchors.width = 0.1; // Small relative scale
        }

        return anchors;
    }

    renderSlider(container, beforeImg, afterImg) {
        container.innerHTML = `
            <div class="ba-slider">
                <div class="ba-after"><img src="${afterImg}"></div>
                <div class="ba-before"><img src="${beforeImg}"></div>
                <div class="ba-handle"></div>
            </div>
        `;
        this.initSliderLogic(container);
    }

    initSliderLogic(container) {
        const slider = container.querySelector('.ba-slider');
        const before = container.querySelector('.ba-before');
        const handle = container.querySelector('.ba-handle');
        
        const move = (e) => {
            const rect = slider.getBoundingClientRect();
            const x = (e.pageX || e.touches[0].pageX) - rect.left;
            const percent = (x / rect.width) * 100;
            if (percent >= 0 && percent <= 100) {
                before.style.width = `${percent}%`;
                handle.style.left = `${percent}%`;
            }
        };

        slider.addEventListener('mousemove', move);
        slider.addEventListener('touchmove', move);
    }
}

window.tryOnAR = new TryOnAR();
