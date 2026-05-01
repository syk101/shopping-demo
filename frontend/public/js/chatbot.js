/**
 * Shoppo Premium AI Concierge - Frontend Logic
 */
class ShopChatbot {
    constructor() {
        this.isOpen = false;
        this.history = [];
        this.allProducts = [];
        this.selectedImage = null;
        
        this.chatWindow = null;
        this.chatMessages = null;
        this.chatInput = null;
        this.imageInput = null;
        this.previewContainer = null;
        
        this.init();
        this.loadProducts();
    }

    async loadProducts() {
        try {
            const res = await fetch('/api/products');
            this.allProducts = await res.json();
        } catch (err) {
            console.error("Failed to load products for chatbot:", err);
        }
    }

    init() {
        // 1. Create Premium Widget HTML
        const widget = document.createElement('div');
        widget.id = 'ai-chatbot-widget';
        widget.innerHTML = `
            <div id="chat-icon" class="chat-icon">
                <i class="fas fa-comment-dots"></i>
                <span class="chat-badge">PRO</span>
            </div>
            <div id="chat-window" class="chat-window">
                <div class="chat-header">
                    <div class="header-info">
                        <div class="bot-avatar">SH</div>
                        <div>
                            <h4>Shoppo Concierge</h4>
                            <span>Always Online | Elite Assistant</span>
                        </div>
                    </div>
                    <button id="close-chat" title="Close"><i class="fas fa-times"></i></button>
                </div>
                <div id="chat-messages" class="chat-messages">
                    <div class="message bot">
                        Welcome to Weary Premium. I am Shoppo, your personal style concierge. To help you find the perfect look, may I ask what occasion brings you to us today?
                    </div>
                </div>
                <div class="chat-input-area">
                    <div id="image-preview-area"></div>
                    <div class="input-row">
                        <div class="input-actions">
                            <button class="action-btn" id="upload-photo-btn" title="Upload Photo for Visual Search">
                                <i class="fas fa-camera"></i>
                            </button>
                        </div>
                        <input type="text" id="chat-input" placeholder="Inquire about styles, trends...">
                        <button id="send-chat" title="Send Message">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    <input type="file" id="chat-image-input" accept="image/*" style="display:none">
                </div>
            </div>
        `;
        document.body.appendChild(widget);

        // 2. Elements
        this.chatWindow = document.getElementById('chat-window');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.imageInput = document.getElementById('chat-image-input');
        this.previewContainer = document.getElementById('image-preview-area');

        // 3. Events
        document.getElementById('chat-icon').onclick = () => this.toggleChat();
        document.getElementById('close-chat').onclick = () => this.toggleChat();
        document.getElementById('send-chat').onclick = () => this.sendMessage();
        document.getElementById('upload-photo-btn').onclick = () => this.imageInput.click();
        
        this.chatInput.onkeypress = (e) => { if (e.key === 'Enter') this.sendMessage(); };
        this.imageInput.onchange = (e) => this.handleImageSelect(e);
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.chatWindow.classList.toggle('active', this.isOpen);
        if (this.isOpen) this.chatInput.focus();
    }

    handleImageSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            this.selectedImage = event.target.result;
            this.showImagePreview(file.name);
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(fileName) {
        this.previewContainer.innerHTML = `
            <div class="image-preview-container">
                <img src="${this.selectedImage}">
                <span>${fileName} ready for visual search</span>
                <i class="fas fa-times remove-img" id="remove-preview"></i>
            </div>
        `;
        document.getElementById('remove-preview').onclick = () => {
            this.selectedImage = null;
            this.previewContainer.innerHTML = '';
            this.imageInput.value = '';
        };
    }

    async sendMessage() {
        const msg = this.chatInput.value.trim();
        if (!msg && !this.selectedImage) return;

        // Add user message to UI
        if (msg) {
            this.addMessage(msg, 'user');
        } else if (this.selectedImage) {
            this.addMessage("Searching based on this photo...", 'user');
        }

        const currentMsg = msg;
        const currentImg = this.selectedImage;

        this.chatInput.value = '';
        this.selectedImage = null;
        this.previewContainer.innerHTML = '';
        this.imageInput.value = '';

        const typingId = this.showTyping();

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: currentMsg, 
                    image: currentImg,
                    history: this.history 
                })
            });
            const data = await res.json();
            
            this.removeTyping();

            if (data.success) {
                this.addMessage(data.reply, 'bot');
                this.history.push({ role: "user", parts: [{ text: currentMsg || "Visual Search" }] });
                this.history.push({ role: "model", parts: [{ text: data.reply }] });
            } else {
                this.addMessage("I'm momentarily unavailable. How else may I serve you?", 'bot');
            }
        } catch (err) {
            this.removeTyping();
            this.addMessage("Our servers are experiencing high demand. Please try again shortly.", 'bot');
        }
    }

    addMessage(text, side) {
        const div = document.createElement('div');
        div.className = `message ${side}`;
        
        // Parse [PRODUCT:id] tags
        let html = text.replace(/\n/g, '<br>');
        
        const productRegex = /\[PRODUCT:(\d+)\]/g;
        let match;
        const productsFound = [];

        if (!this.allProducts || this.allProducts.length === 0) {
            div.innerHTML = html;
            this.chatMessages.appendChild(div);
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            return;
        }

        while ((match = productRegex.exec(text)) !== null) {
            const pid = match[1];
            const product = this.allProducts.find(p => p.id == pid);
            if (product) {
                console.log("Shoppo identified:", product.name);
                productsFound.push(product);
            }
        }

        // Clean text of the tags if they are rendered as cards
        html = html.replace(productRegex, (match, id) => {
            const p = this.allProducts.find(p => p.id == id);
            return p ? `<strong class="product-mention">${p.name}</strong>` : match;
        });

        div.innerHTML = html;
        this.chatMessages.appendChild(div);

        // Append product cards
        productsFound.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card-mini';
            card.innerHTML = `
                <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
                <div class="card-info">
                    <h5>${p.name}</h5>
                    <div class="price">$${parseFloat(p.price).toFixed(2)}</div>
                    <div class="actions">
                        <button class="btn-chat btn-buy" onclick="window.aiChatbot.addToCart(${p.id})">Add to Cart</button>
                        <button class="btn-chat btn-view" onclick="window.aiChatbot.viewProduct(${p.id})">View</button>
                    </div>
                </div>
            `;
            this.chatMessages.appendChild(card);
        });

        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    async addToCart(productId) {
        try {
            const res = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: productId, quantity: 1 })
            });
            const data = await res.json();
            if (data.success) {
                if (window.updateCartCount) window.updateCartCount();
                if (window.showNotification) window.showNotification("Exquisite choice! Added to your cart.", "success");
                else alert("Added to cart!");
            }
        } catch (err) {
            console.error("Cart error:", err);
        }
    }

    viewProduct(productId) {
        // Find which collection/category this product belongs to and redirect
        const p = this.allProducts.find(item => item.id === productId);
        if (p) {
            window.location.href = `products.html?category=${p.category}`;
        }
    }

    showTyping() {
        const div = document.createElement('div');
        div.id = 'typing-indicator';
        div.className = 'typing';
        div.innerHTML = '<span></span><span></span><span></span>';
        this.chatMessages.appendChild(div);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        return div.id;
    }

    removeTyping() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }
}

// Auto-init
window.addEventListener('load', () => {
    window.aiChatbot = new ShopChatbot();
});
