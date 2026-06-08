import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialization of GoogleGenAI client with error handling
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in your Secrets / Env variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. AI EMAIL DRAFTER ENDPOINT
app.post("/api/draft-email", async (req, res) => {
  try {
    const { businessName, category, city, secp, topic } = req.body;
    if (!businessName || !topic) {
      return res.status(400).json({ error: "Missing required fields: businessName and topic are needed." });
    }

    const ai = getGeminiClient();

    const systemInstruction = 
      "You are a professional business communication assistant specialized in Pakistani corporate writing.";

    const prompt = `Write a professional, highly polished business email to the company/institution "${businessName}" (Sector: ${category || "N/A"}, Location: ${city || "N/A"}, SECP ID: ${secp || "N/A"}). 
    
The user wishes to email them about: "${topic}".
    
Format it cleanly inside Markdown with a distinct "Subject:" line, and the "Dear [Recipient / Team]," salutation, and then the email body. Leave easy template blanks like [Your Name], [Your Designation], [Your Contact] or other context-dependent parameters cleanly encapsulated in square brackets so the user can easily find and replace them. Keep the tone executive, dignified, standard for Pakistani corporate/administrative affairs, and polite. Do not append extra conversational chit-chat outside the email. Output only the email.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ draft: response.text || "Could not generate a response." });
  } catch (error: any) {
    console.error("Error in draft-email endpoint:", error);
    res.status(500).json({ error: error.message || "An internal error occurred." });
  }
});

// 2. AI CHAT WIDGET ENDPOINT
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Missing 'message' field." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are the highly professional, polite AI Assistant for Yellow Pages Pakistan (Pry-Gold Index). 

You represent a robust directory of over 10,200+ registered institutions, including government schools, colleges, public & private hospitals, and small scale manufacturing units across Punjab, Sindh, KPK, Balochistan, and Islamabad Capital Territory.

Answer user queries elegantly and concisely:
- If they look for specific district listings (e.g. Khanpur, Bahawalpur, Rahim Yar Khan, Sahiwal, Abbottabad, Swat, Peshawar), validate that the regional registry has thousands of verified local schools, colleges, and clinics on tap.
- Always encourage them to use the side filter controls (Provinces, Cities, and Sectors) to narrow down listings immediately.
- Adopt a supportive, respectful, corporate Pakistani business representative tone. Say 'Assalam-o-Alaikum!' or 'Greeting!' when welcoming or parting.
- If asked about PTCL dialing landline area codes of Pakistan, list them correctly:
  * Karachi: '021'
  * Lahore: '042'
  * Islamabad / Rawalpindi: '051'
  * Khanpur / Rahim Yar Khan: '068'
  * Bahawalpur: '062'
  * Sahiwal: '040'
  * Peshawar: '091'
  * Quetta: '081'`;

    // Process optional chat history for multi-turn conversations
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((turn: any) => {
        if (turn.role && turn.text) {
          contents.push({
            role: turn.role,
            parts: [{ text: turn.text }]
          });
        }
      });
    }

    // Append the current message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    res.json({ reply: response.text || "Sorry, I am unable to process that at the moment." });
  } catch (error: any) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({ error: error.message || "An internal error occurred." });
  }
});

// Serve frontend assets & configure Dev vs Prod modes
const setupVite = async () => {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
};

setupVite().catch((error) => {
  console.error("Failed to start Vite middleware server:", error);
});
