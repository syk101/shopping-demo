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
            window.showNotification('Please upload a photo first', 'error');
            return;
        }

        const btn = document.getElementById('start-tryon');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing AI...';
        btn.disabled = true;

        try {
            const res = await fetch('/api/ai/tryon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    image: this.userImage, 
                    product_id: this.selectedProductId 
                })
            });
            const data = await res.json();
            
            if (data.success) {
                this.showResult(data.result_url);
                window.showNotification('AI Visualization Ready!', 'success');
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error('Try-on failed:', err);
            window.showNotification('AI Processing failed. Try again.', 'error');
        } finally {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    }

    showResult(resultUrl) {
        if (this.previewContainer) {
            this.previewContainer.innerHTML = `
                <div class="tryon-result">
                    <h3>AI Visualization</h3>
                    <img src="${resultUrl}" alt="Try-on Result">
                    <p>Visualizing product on your avatar...</p>
                </div>
            `;
        }
    }
}

window.tryOnSystem = new TryOnSystem();
window.openTryOn = (productId) => window.tryOnSystem.toggleModal(true, productId);
