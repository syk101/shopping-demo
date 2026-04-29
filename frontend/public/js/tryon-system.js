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
        this.uploadInput?.addEventListener('change', (e) => this.handleUpload(e));
        document.getElementById('open-camera')?.addEventListener('click', () => this.startCamera());
        document.getElementById('close-tryon')?.addEventListener('click', () => this.toggleModal(false));
        document.getElementById('start-tryon')?.addEventListener('click', () => this.executeTryOn());
    }

    toggleModal(force = null, productId = null) {
        if (!this.modal) return;
        this.selectedProductId = productId;
        const show = force !== null ? force : !this.modal.classList.contains('active');
        if (show) this.modal.classList.add('active');
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

    showPreview(imgSrc) {
        if (this.previewContainer) {
            this.previewContainer.innerHTML = `<img src="${imgSrc}" alt="Avatar Preview" style="max-width: 100%; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">`;
        }
    }

    async executeTryOn() {
        if (!this.userImage || !this.selectedProductId) {
            window.showNotification('Please upload or capture a photo first', 'error');
            return;
        }

        const container = this.previewContainer;
        container.innerHTML += `<div class="ar-processing"><div class="ar-scan-line"></div><i class="fas fa-microchip fa-spin fa-3x mb-3"></i><h3>AI MAPPING BODY...</h3></div>`;

        try {
            // 1. Get Product Info
            const product = window.currentProducts?.find(p => p.id === this.selectedProductId);
            const category = product?.category || 'clothing';

            // 2. Initialize AR and Get Anchors
            await window.tryOnAR.init();
            const tempImg = new Image();
            tempImg.src = this.userImage;
            await new Promise(r => tempImg.onload = r);
            
            const anchors = await window.tryOnAR.getAnchors(tempImg, category);

            // 3. Call Enhanced Backend
            const res = await fetch('/api/ai/tryon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    image: this.userImage, 
                    product_id: this.selectedProductId,
                    anchors: anchors
                })
            });
            const data = await res.json();
            
            if (data.success) {
                // 4. Render Before/After Slider
                window.tryOnAR.renderSlider(container, this.userImage, data.result_url);
                window.showNotification('AR Stylized Successfully!', 'success');
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error('AR Try-on failed:', err);
            window.showNotification('AI Alignment failed. Try a clearer photo.', 'error');
            this.showPreview(this.userImage); // Revert to preview
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
}
    downloadResult(url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = 'my-ai-avatar.jpg';
        link.click();
    }
}

window.tryOnSystem = new TryOnSystem();
window.openTryOn = (productId, event) => {
    if (event) event.stopPropagation();
    window.tryOnSystem.toggleModal(true, productId);
};
