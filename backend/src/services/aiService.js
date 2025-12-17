const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI = null;

const initializeAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
        try {
            genAI = new GoogleGenerativeAI(apiKey);
            console.log('✅ AI Service initialized');
        } catch (error) {
            console.error('❌ Failed to initialize AI Service:', error);
        }
    } else {
        console.warn('⚠️ GEMINI_API_KEY missing in environment variables');
    }
};

const generateBio = async (title, company, keywords) => {
    // Initialize on first use if not ready (lazy load)
    if (!genAI) initializeAI();

    if (!genAI) {
        throw new Error("AI Service not available (Missing API Key)");
    }

    try {
        const prompt = `Escribe una biografía profesional, concisa y atractiva (max 40 palabras) para un ${title} que trabaja en ${company}. Habilidades clave: ${keywords}. Tono: Profesional pero cercano. Idioma: Español.`;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error in generateBio:", error);
        throw new Error("Failed to generate content");
    }
};

module.exports = {
    generateBio
};
