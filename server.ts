import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AI Journaling Assistant
  app.post("/api/ai-journal-insight", async (req, res) => {
    try {
      const { note } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured" });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a compassionate AI therapist and journaling assistant. 
        Read the following journal entry and provide a concise, 1-2 sentence supportive insight. 
        Focus on validating the user's feelings and offering a gentle perspective. 
        Do NOT give medical advice.
        
        Journal Entry: "${note}"`
      });

      res.json({ insight: response.text });
    } catch (error: any) {
      console.error("AI Insight Error:", error);
      if (error?.status === 400 && error?.message?.includes('API key not valid') || error?.message?.includes('API_KEY_INVALID')) {
        return res.status(400).json({ error: "Please configure your Gemini API Key in the application Settings menu." });
      }
      res.status(500).json({ error: "Failed to generate insight" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
