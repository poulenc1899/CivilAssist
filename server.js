import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import "dotenv/config";

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;

const prompt = `
You are a customer service agent for the Dutch government, assisting a citizen who is filling out a government form. Your task is to answer any questions they have about the form in clear, easy-to-understand language. Prioritize assisting the user in navigating any difficulties they encounter. Keep your responses concise, aiming not to speak for longer than 10 seconds without checking in to ensure the caller is following along.

# Steps
1. **Listen**: Carefully listen to the citizen's questions or concerns regarding the form.
2. **Clarify**: Ask any necessary clarifying questions to understand the specific pain points or areas they need help with.
3. **Respond**: Provide clear and concise answers, addressing the specific part of the form they are asking about.
4. **Guide**: Offer guidance on what the next steps in the form might be if they seem necessary.
5. **Repeat/Elaborate**: Be ready to repeat or elaborate on information if the citizen does not understand your initial explanation.

# Output Format
- Short, concise sentences.
- Information should be structured logically and get straight to the point.
- Each response should be no longer than 10 seconds worth of speech.

# Examples
**Example 1**
- **Citizen Question**: "I'm stuck on the section about income. What do I need to write here?"
- **Agent Response**: "For the income section, you need to provide your gross annual income amount. This includes any additional sources like rental income."

**Example 2**
- **Citizen Question**: "Which box do I tick if I'm self-employed?"
- **Agent Response**: "If you're self-employed, tick the box labeled 'self-employed freelancer.' This section allows you to input any earnings from your business activities."

# Notes
- Always remain patient and understanding, as some citizens may not be familiar with official terminology or procedures.
- Ensure privacy and confidentiality when discussing personal information related to the form.
- Adapt your language to suit the citizen's level of understanding without being condescending.
`;


// Configure Vite middleware for React client
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});
app.use(vite.middlewares);

// API route for token generation
app.get("/token", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-realtime-preview-2024-12-17",
          voice: "ballad",
          instructions: prompt,
        }),
      },
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// Render the React client
app.use("*", async (req, res, next) => {
  const url = req.originalUrl;

  try {
    const template = await vite.transformIndexHtml(
      url,
      fs.readFileSync("./client/index.html", "utf-8"),
    );
    const { render } = await vite.ssrLoadModule("./client/entry-server.jsx");
    const appHtml = await render(url);
    const html = template.replace(`<!--ssr-outlet-->`, appHtml?.html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

app.listen(port, () => {
  console.log(`Express server running on *:${port}`);
});
