import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini Client
// For Vite, use import.meta.env or process.env (defined in vite.config)
const apiKey = process.env.REACT_APP_API_KEY || process.env.API_KEY || import.meta.env.VITE_GEMINI_API_KEY; 

// Safely initialize to prevent runtime crashes if API Key is missing or invalid
let genAI: GoogleGenerativeAI | null = null;

try {
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  } else {
    console.warn("Gemini API Key is missing. AI features will run in Demo Mode.");
  }
} catch (e) {
  console.warn("Failed to initialize GoogleGenerativeAI client:", e);
}

export const generateProfessionalBio = async (
  title: string, 
  company: string, 
  keywords: string
): Promise<string> => {
  
  if (!genAI) {
    // Simulate network delay for realistic UI feel even in mock mode
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `[DEMO] ${title} experto en ${company}. Especialista en ${keywords} con enfoque en innovación y liderazgo estratégico.`;
  }

  try {
    const prompt = `Escribe una biografía profesional, concisa y atractiva (max 40 palabras) para un ${title} que trabaja en ${company}. Habilidades clave: ${keywords}. Tono: Profesional pero cercano. Idioma: Español.`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text || "No se pudo generar la biografía.";
  } catch (error) {
    console.error("Error generating bio:", error);
    return "Error conectando con el servicio de IA. Intente más tarde.";
  }
};