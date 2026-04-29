/**
 * AI Salesman Chatbot Frontend Logic
 */
class ShopChatbot {
    constructor() {
        this.isOpen = false;
        this.history = [];
        this.chatWindow = null;
        this.chatMessages = null;
        this.chatInput = null;
        
        this.init();
    }

    init() {
        // 1. Create Chat Widget HTML
        const widget = document.createElement('div');
        widget.id = 'ai-chatbot-widget';
        widget.innerHTML = `
            <div id="chat-icon" class="chat-icon">
                <i class="fas fa-comment-dots"></i>
                <span class="chat-badge">AI</span>
            </div>
            <div id="chat-window" class="chat-window">
                <div class="chat-header">
                    <div class="header-info">
                        <div class="bot-avatar">SM</div>
                        <div>
                            <h4>AI Salesman</h4>
                            <span>Online | Store Expert</span>
                        </div>
                    </div>
                    <button id="close-chat"><i class="fas fa-times"></i></button>
                </div>
                <div id="chat-messages" class="chat-messages">
                    <div class="message bot">
                        Hello! I'm your AI Salesman. Looking for a new look today?
                    </div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chat-input" placeholder="Ask about products, styles...">
                    <button id="send-chat"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        `;
        document.body.appendChild(widget);

        // 2. Elements
        this.chatWindow = document.getElementById('chat-window');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');

        // 3. Events
        document.getElementById('chat-icon').onclick = () => this.toggleChat();
        document.getElementById('close-chat').onclick = () => this.toggleChat();
        document.getElementById('send-chat').onclick = () => this.sendMessage();
        this.chatInput.onkeypress = (e) => { if (e.key === 'Enter') this.sendMessage(); };
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.chatWindow.classList.toggle('active', this.isOpen);
    }

    async sendMessage() {
        const msg = this.chatInput.value.trim();
        if (!msg) return;

        this.addMessage(msg, 'user');
        this.chatInput.value = '';
        
        // Show typing indicator
        const typingId = this.showTyping();

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, history: this.history })
            });
            const data = await res.json();
            
            this.removeTyping(typingId);

            if (data.success) {
                this.addMessage(data.reply, 'bot');
                this.history.push({ role: "user", parts: [{ text: msg }] });
                this.history.push({ role: "model", parts: [{ text: data.reply }] });
            } else {
                this.addMessage("I'm having a little trouble thinking. Can you repeat that?", 'bot');
            }
        } catch (err) {
            this.removeTyping(typingId);
            this.addMessage("Store is a bit busy! Try again in a second.", 'bot');
        }
    }

    addMessage(text, side) {
        const div = document.createElement('div');
        div.className = `message ${side}`;
        div.innerHTML = text.replace(/\n/g, '<br>');
        this.chatMessages.appendChild(div);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showTyping() {
        const div = document.createElement('div');
        div.id = 'typing-indicator';
        div.className = 'message bot typing';
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
