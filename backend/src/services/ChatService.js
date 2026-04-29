const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

class ChatService {
    constructor() {
        this.genAI = null;
        this.model = null;
        this.apiKey = process.env.GEMINI_API_KEY;
    }

    async init() {
        if (!this.apiKey) {
            console.error("GEMINI_API_KEY not found in environment variables.");
            return;
        }
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    async getSalesmanResponse(userInput, productData, chatHistory = []) {
        if (!this.model) await this.init();
        if (!this.model) return "I'm sorry, I'm having trouble connecting to my brain right now. Can I help you with something else?";

        const systemPrompt = `
        You are a professional, friendly, and persuasive AI Salesman for "ShopManager" (also known as Weary Premium Shop).
        Your goal is to help customers find products, answer questions, and encourage them to buy.
        
        INVENTORY CONTEXT:
        ${JSON.stringify(productData)}
        
        RULES:
        1. Only recommend products from the inventory above.
        2. If a product is low on stock (less than 5), use urgency to convince them.
        3. Be conversational and helpful. Use phrases like "Great choice!", "This would look amazing on you!", "We only have a few left!"
        4. If they ask for something not in stock, suggest the closest alternative.
        5. When recommending a product, mention its name and price.
        6. Keep responses concise and engaging.
        7. If the user wants to buy or see their cart, guide them to the cart icon or checkout.
        
        RESPONSE FORMAT:
        Always respond in a natural conversational tone.
        `;

        const chat = this.model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Understood. I am your expert ShopManager salesman. How can I help you style your wardrobe today?" }] },
                ...chatHistory
            ],
        });

        const result = await chat.sendMessage(userInput);
        const response = await result.response;
        return response.text();
    }
}

module.exports = new ChatService();
