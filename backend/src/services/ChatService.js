const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

class ChatService {
    constructor() {
        this.genAI = null;
        this.model = null;
        this.apiKey = process.env.GEMINI_API_KEY;
    }

    init() {
        this.apiKey = process.env.GEMINI_API_KEY;
        if (!this.apiKey || this.apiKey.includes('REPLACE_WITH_YOUR_ACTUAL_KEY')) {
            return false;
        }
        try {
            this.genAI = new GoogleGenerativeAI(this.apiKey);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            return true;
        } catch (e) {
            console.error("Gemini Init Error:", e);
            return false;
        }
    }

    async getSalesmanResponse(userInput, productData, chatHistory = [], imageBase64 = null) {
        const isInitialized = this.model || this.init();
        
        if (!isInitialized) {
            return this.getMockResponse(userInput, productData);
        }

        const systemPrompt = `
        You are "Shoppo", an elite AI Sales Concierge for "Weary Premium Shop".
        Your goal is to DRIVE SALES by being a proactive, sophisticated, and helpful personal shopper.
        
        INVENTORY CONTEXT:
        ${JSON.stringify(productData)}
        
        PROACTIVE SALES STRATEGY:
        1. **Engagement**: Start by understanding the user's intent. Ask "What brings you to Weary today?" or "Are you looking for a specific occasion?"
        2. **Visual Analysis**: If the user provides an image, ANALYZE it. Identify the style, color, and mood. Suggest matching items from the inventory.
        3. **Preference Mapping**: If they say "wedding", ask about their role (guest, groom, etc.) or the dress code.
        4. **Product Pairing**: Always try to recommend a "Look" (2-3 items). Use the [PRODUCT:id] format for every item.
        5. **Persuasion**: Use phrases like "This is a staple for any modern wardrobe" or "We've seen a lot of interest in this particular piece recently."
        6. **Urgency**: If stock is low, highlight it.
        
        CRITICAL RULES:
        - Use [PRODUCT:id] for ALL product recommendations.
        - Be elite, professional, and slightly persuasive.
        - Always end your response with a question to keep the sales conversation moving.
        
        RESPONSE FORMAT:
        Luxury concierge tone. Always include at least one [PRODUCT:id] if relevant.
        `;

        try {
            const parts = [{ text: userInput || "I've uploaded an image for your analysis." }];
            
            if (imageBase64) {
                parts.push({
                    inlineData: {
                        mimeType: "image/jpeg",
                        data: imageBase64.split(',')[1]
                    }
                });
            }

            const chat = this.model.startChat({
                history: [
                    { role: "user", parts: [{ text: systemPrompt }] },
                    { role: "model", parts: [{ text: "Understood. I am Shoppo, your premium fashion concierge. How may I assist you with our collections today?" }] },
                    ...chatHistory
                ],
            });

            const result = await chat.sendMessage(parts);
            const response = await result.response;
            return response.text();
        } catch (err) {
            console.error("Gemini API Error:", err);
            return this.getMockResponse(userInput, productData);
        }
    }

    getMockResponse(userInput, productData) {
        const query = userInput.toLowerCase();
        
        // Handle "no", "nothing", etc.
        if (query === "no" || query === "nothing" || query === "none") {
            return "No problem at all! If you're just browsing, why not take a look at our [PRODUCT:${productData[0].id}] or [PRODUCT:${productData[1].id}]? They are quite popular this season. Would you like to see more details on these?";
        }

        // Handle "suggest", "recommend", "u suggest"
        if (query.includes("suggest") || query.includes("recommend") || query.includes("what else")) {
            const random = productData.sort(() => 0.5 - Math.random()).slice(0, 3);
            return `I would be delighted to suggest some of our finest pieces. Our [PRODUCT:${random[0].id}], [PRODUCT:${random[1].id}], and [PRODUCT:${random[2].id}] are currently trending. Do any of these catch your eye?`;
        }

        // Simple keyword matching
        const matches = productData.filter(p => 
            query.includes(p.name.toLowerCase()) || 
            query.includes(p.category.toLowerCase()) ||
            (p.description && query.includes(p.description.toLowerCase()))
        );

        if (matches.length > 0) {
            const p = matches[0];
            return `I've selected the [PRODUCT:${p.id}] specifically for you. It's a hallmark of our current collection. Would you like to know more about its craftsmanship, or shall I add it to your ensemble?`;
        }

        if (query.includes("hello") || query.includes("hi")) {
            return "Welcome to Weary Premium. I am Shoppo, your dedicated concierge. To help me curate the perfect selection, could you share the occasion or style you have in mind today?";
        }

        if (query.includes("wedding") || query.includes("gala") || query.includes("event") || query.includes("suit")) {
            const formal = productData.filter(p => p.category.toLowerCase().includes('premium') || p.price > 80).slice(0, 2);
            if (formal.length > 0) {
                return `For a sophisticated event like that, I highly recommend our [PRODUCT:${formal[0].id}] or the [PRODUCT:${formal[1].id}]. They exude elegance. Are you looking for a particular color palette?`;
            }
        }

        if (query.includes("stock") || query.includes("have")) {
            const randomProducts = productData.slice(0, 2);
            return `We have a magnificent collection in stock right now, including the [PRODUCT:${randomProducts[0].id}] and [PRODUCT:${randomProducts[1].id}]. Are you shopping for a specific gender or category today?`;
        }

        return "That is a fascinating direction! To provide you with the most relevant recommendations, would you like to explore our Men's, Women's, or Kids' premium collections?";
    }
}

module.exports = new ChatService();
