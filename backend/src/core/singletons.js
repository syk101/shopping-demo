const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fetch = require('node-fetch');
const Jimp = require('jimp');

class Database {
    constructor() {
        if (Database.instance) return Database.instance;
        this.db = new sqlite3.Database(path.resolve(__dirname, '../../../database/shop.db'));
        Database.instance = this;
    }
    query(sql, params = []) {
        return new Promise((res, rej) => this.db.all(sql, params, (err, rows) => err ? rej(err) : res(rows)));
    }
    run(sql, params = []) {
        return new Promise((res, rej) => this.db.run(sql, params, function (err) { err ? rej(err) : res({ id: this.lastID, changes: this.changes }); }));
    }
}

const geminiAgent = require('../services/GeminiTryOnAgent');
const fs = require('fs');

class AIService {
    constructor() {
        if (AIService.instance) return AIService.instance;
        this.apiKey = process.env.GEMINI_API_KEY;
        AIService.instance = this;
    }

    async tryOn(avatarBase64, productImageUrl, anchors = null) {
        try {
            console.log("[AIService] AntiGravity_Generative_Agent Initiating Synthesis...");

            // 1. Generate High-Fidelity Prompt via Gemini 3
            let resultAgent = await geminiAgent.analyzeAndGenerate(avatarBase64, productImageUrl, anchors);
            let prompt = resultAgent.instructions.generative_prompt || "A professional portrait of a person wearing premium clothing";
            
            console.log("[AIService] Generative AI Prompt Crafted:", prompt);

            // 2. Synthesize New Image via Pollinations (Flux/Stable Diffusion)
            const seed = Math.floor(Math.random() * 1000000);
            const encodedPrompt = encodeURIComponent(prompt);
            const genUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;
            
            let response;
            let retryCount = 0;
            const maxRetries = 2;
            
            while (retryCount <= maxRetries) {
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
                    
                    response = await fetch(genUrl, { signal: controller.signal });
                    clearTimeout(timeout);
                    
                    if (response.ok) break;
                    throw new Error(`Pollinations returned ${response.status}`);
                } catch (pErr) {
                    retryCount++;
                    console.warn(`[AIService] Synthesis attempt ${retryCount} failed:`, pErr.message);
                    if (retryCount > maxRetries) throw pErr;
                    await new Promise(r => setTimeout(r, 2000)); // Wait before retry
                }
            }

            const buffer = await response.buffer();
            const resultBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;

            return {
                success: true,
                image: resultBase64,
                message: "Generative AI Synthesis Complete"
            };
        } catch (err) {
            console.error("[AIService] Generative Synthesis Error:", err);
            return { success: false, error: err.message, image: avatarBase64 };
        }
    }
}

module.exports = {
    db: new Database(),
    ai: new AIService()
};
