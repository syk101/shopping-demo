const { GoogleGenerativeAI } = require("@google/generative-ai");

class VisionAdapter {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.genAI = new GoogleGenerativeAI(this.apiKey);
    }

    async search(imageBase64, products) {
        try {
            console.log("[VisionAdapter] Analyzing search image via Gemini...");
            const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            
            const imagePart = {
                inlineData: {
                    data: imageBase64.split(',')[1],
                    mimeType: "image/jpeg"
                }
            };

            const prompt = `
                Analyze this product image. 
                Identify the type of clothing, color, style, and key features.
                Return a JSON object with:
                {
                    "tags": ["tag1", "tag2"],
                    "description": "short description",
                    "category": "men/women/kids"
                }
            `;

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();
            
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { tags: [], description: text };

            console.log("[VisionAdapter] AI Analysis:", analysis);

            // Match against products using text similarity (since we don't have embeddings for all products yet)
            const searchTerms = [...analysis.tags, analysis.description.toLowerCase()];
            
            return products.map(p => {
                let score = 0;
                const pName = p.name.toLowerCase();
                const pDesc = (p.description || "").toLowerCase();
                
                searchTerms.forEach(term => {
                    if (pName.includes(term)) score += 2;
                    if (pDesc.includes(term)) score += 1;
                });

                return { ...p, similarity: score / 10 }; // Normalize score
            }).sort((a, b) => b.similarity - a.similarity).slice(0, 10);

        } catch (err) {
            console.error("[VisionAdapter] Gemini Search Error:", err);
            return products.slice(0, 10); // Fallback to first 10
        }
    }

    cosineSimilarity(v1, v2) {
        // Kept for backward compatibility if AISearchStrategy uses it
        let dot = 0, n1 = 0, n2 = 0;
        for (let i = 0; i < v1.length; i++) {
            dot += v1[i] * v2[i];
            n1 += v1[i] * v1[i];
            n2 += v2[i] * v2[i];
        }
        return dot / (Math.sqrt(n1) * Math.sqrt(n2)) || 0;
    }
}

module.exports = VisionAdapter;
