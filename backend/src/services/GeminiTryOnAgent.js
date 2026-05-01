const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');

class GeminiTryOnAgent {
    constructor() {
        this.genAI = null;
        if (process.env.GEMINI_API_KEY) {
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        }
    }

    async compressImage(base64Str) {
        try {
            const buffer = Buffer.from(base64Str.split(',')[1], 'base64');
            const image = await Jimp.read(buffer);
            // Resize to 512px max while maintaining aspect ratio
            image.resize(512, Jimp.AUTO);
            const compressedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
            return compressedBuffer.toString('base64');
        } catch (err) {
            console.warn("[AntiGravity_TryOn_Agent] Compression failed, using original:", err.message);
            return base64Str.split(',')[1];
        }
    }

    async analyzeAndGenerate(userImageBase64, productImagePath, anchors = null) {
        // AGENT: AntiGravity_Generative_Agent
        let anchorContext = "";
        if (anchors) {
            anchorContext = `
            The following body anchors were detected via MediaPipe:
            - Center: (${anchors.center?.x.toFixed(2)}, ${anchors.center?.y.toFixed(2)})
            - Width: ${anchors.width?.toFixed(2)}
            Use these coordinates to ensure the product is perfectly aligned and draped over the person's torso.
            `;
        }

        const systemPrompt = `
            You are a Generative AI Prompt Engineer (AntiGravity_Generative_Agent). 
            Analyze Image 1 (user) and Image 2 (product).
            Create a high-fidelity prompt for an image generator (like Stable Diffusion/Flux).
            The prompt MUST describe Image 1 wearing the item in Image 2.
            Describe the person's face, hair, and pose from Image 1 exactly.
            Describe the product from Image 2 exactly (color, texture, fit).
            ${anchorContext}
        `;

        const executionPrompt = `
            Return a JSON object with:
            {
                "generative_prompt": "A hyper-realistic, professional DSLR studio photograph of [detailed description of person from Image 1] wearing [detailed description of product from Image 2]. Photorealistic, 8k, ultra-detailed skin texture, sharp focus, natural studio lighting, high fidelity.",
                "product_analysis": "brief description of product"
            }
        `;

        // Optimize: Compress user image to save tokens and avoid quota issues
        const compressedUserBase64 = await this.compressImage(userImageBase64);
        const userPart = { inlineData: { data: compressedUserBase64, mimeType: "image/jpeg" } };
        
        const fullProductPath = path.join(__dirname, '../../../frontend/public', productImagePath);
        const productBuffer = fs.readFileSync(fullProductPath);
        const productPart = { inlineData: { data: productBuffer.toString('base64'), mimeType: "image/jpeg" } };

        const productName = path.basename(productImagePath, path.extname(productImagePath)).replace(/_/g, ' ');
        let instructions = {
            generative_prompt: `A hyper-realistic, professional DSLR portrait of the person wearing ${productName}, studio lighting, ultra-detailed skin and fabric texture, 8k resolution.`,
            product_analysis: productName
        };
        
        const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
        
        for (const modelName of models) {
            try {
                if (!this.genAI) throw new Error("GEMINI_API_KEY missing");
                console.log(`[AntiGravity_TryOn_Agent] Attempting analysis with ${modelName}...`);
                
                const model = this.genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: systemPrompt + "\n" + executionPrompt }, userPart, productPart] }],
                    generationConfig: { responseMimeType: "application/json" }
                });
                
                const responseText = result.response.text();
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    instructions = JSON.parse(jsonMatch[0]);
                    console.log(`[AntiGravity_TryOn_Agent] Analysis successful with ${modelName}`);
                    break; // Success!
                }
            } catch (err) {
                console.warn(`[AntiGravity_TryOn_Agent] ${modelName} failed:`, err.message);
                if (err.message.includes("429") || err.message.includes("quota")) {
                    continue; // Try next model
                } else {
                    break; // Non-quota error, don't retry
                }
            }
        }

        return {
            success: true,
            instructions: instructions,
            message: "AI Agent Orchestration Complete."
        };
    }
}

module.exports = new GeminiTryOnAgent();
