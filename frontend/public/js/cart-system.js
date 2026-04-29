// Cart System for ShopManager
class CartSystem {
    constructor() {
        this.cart = [];
        this.cartItemsCount = document.getElementById('cart-count');
        this.cartModal = document.getElementById('cart-sidebar');
        this.cartItemsList = document.getElementById('cart-items-list');
        this.cartSubtotal = document.getElementById('cart-subtotal');
        this.cartTotal = document.getElementById('cart-total');
        
        this.init();
    }

    async init() {
        await this.fetchCart();
        this.setupEventListeners();
        this.renderCart();
    }

    async fetchCart() {
        try {
            const res = await fetch('/api/cart');
            this.cart = await res.json();
            this.updateBadge();
        } catch (err) {
            console.error('Failed to fetch cart:', err);
        }
    }

    async addToCart(productId, quantity = 1) {
        try {
            const res = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: productId, quantity })
            });
            const data = await res.json();
            if (data.success) {
                await this.fetchCart();
                this.renderCart();
                this.toggleCart(true);
                window.showNotification('Product added to cart!', 'success');
            }
        } catch (err) {
            console.error('Failed to add to cart:', err);
        }
    }

    async removeFromCart(id) {
        try {
            const res = await fetch(`/api/cart/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                await this.fetchCart();
                this.renderCart();
            }
        } catch (err) {
            console.error('Failed to remove from cart:', err);
        }
    }

    updateBadge() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        if (this.cartItemsCount) {
            this.cartItemsCount.textContent = totalItems;
            this.cartItemsCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }

    toggleCart(forceOpen = null) {
        if (!this.cartModal) return;
        const isOpen = forceOpen !== null ? forceOpen : !this.cartModal.classList.contains('active');
        if (isOpen) {
            this.cartModal.classList.add('active');
            document.getElementById('cart-overlay')?.classList.add('active');
        } else {
            this.cartModal.classList.remove('active');
            document.getElementById('cart-overlay')?.classList.remove('active');
        }
    }

    renderCart() {
        if (!this.cartItemsList) return;
        
        if (this.cart.length === 0) {
            this.cartItemsList.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>Your cart is empty</p></div>';
            this.updateTotals();
            return;
        }

        this.cartItemsList.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-img">
                    <img src="${item.image || 'https://via.placeholder.com/80'}" alt="${item.name}">
                </div>
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>$${item.price.toFixed(2)}</p>
                    <div class="cart-item-qty">
                        <button onclick="cartSystem.updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="cartSystem.updateQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <button class="remove-item" onclick="cartSystem.removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        this.updateTotals();
    }

    updateTotals() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const delivery = subtotal > 0 ? 10.00 : 0;
        const total = subtotal + delivery;

        if (this.cartSubtotal) this.cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
        if (this.cartTotal) this.cartTotal.textContent = `$${total.toFixed(2)}`;
    }

    async updateQuantity(id, delta) {
        const item = this.cart.find(i => i.id === id);
        if (item) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) {
                await this.removeFromCart(id);
            } else {
                await this.addToCart(item.product_id, delta);
            }
        }
    }

    setupEventListeners() {
        document.getElementById('cart-toggle')?.addEventListener('click', () => this.toggleCart());
        document.getElementById('close-cart')?.addEventListener('click', () => this.toggleCart(false));
        document.getElementById('cart-overlay')?.addEventListener('click', () => this.toggleCart(false));
        document.getElementById('checkout-btn')?.addEventListener('click', () => {
            if (this.cart.length > 0) window.location.href = 'checkout.html';
            else window.showNotification('Your cart is empty!', 'error');
        });
    }
}

const cartSystem = new CartSystem();
window.addToCart = (id) => cartSystem.addToCart(id);
