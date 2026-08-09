//*************************************************************************
// Import Express library
const express = require("express");

// Allow browser to talk to Node.js
const cors = require("cors");

// Create Node.js server
const app = express();

// Allow requests from webpage
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

// Allow server to read JSON requests
app.use(express.json());

// Simple test route
// Open: http://localhost:3000
// This only checks Node.js is alive
app.get("/", (req, res) => {
    res.send("Node.js server is alive!");
});

// Main AI route
// We send text here and Node sends it to Ollama
app.post("/chat", async (req, res) => {

    console.log("🔥 CHAT REQUEST ARRIVED");

    try {
        // Get user message
        const { prompt } = req.body;

        console.log("--------------------------------");
        console.log("📨 User sent:");
        console.log(prompt);
        console.log("➡️ Sending request to Ollama...");

        // Talk to Ollama
        const response = await fetch(
            "http://localhost:11434/api/generate",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    // TEST WITH THIS FIRST:
                    // Change this to gemma3:1b after testing
                    model: "gemma3:1b",

                    // Instruction for the AI
                    prompt: `
                    Fix grammar and punctuation.
                    Keep the meaning the same.
                    Return only corrected text.

                    Text:
                    ${prompt}
                    `,

                    // Wait for complete response
                    stream: false
                })
            }
        );

        console.log("✅ Ollama responded");

        // Convert Ollama reply to JSON
        const data = await response.json();

        // VERY IMPORTANT:
        // Shows exactly what Ollama returned
        console.log("===== FULL OLLAMA RESPONSE =====");
        console.log(data);
        console.log("================================");

        // If Ollama returned an error
        if (data.error) {
            throw new Error(data.error);
        }
        console.log("🤖 Gemma answer:");
        console.log(data.response);


        // Send answer back
        res.json({
            response: data.response
        });

    } catch (error) {
        console.log("❌ ERROR:");
        console.log(error.message);

        res.status(500).json({
            error: error.message
        });
    }
});

// Start server
app.listen(3000, () => {
    console.log("🚀 Node.js server is running");
    console.log("Listening on http://localhost:3000");
});
//*************************************************************************
