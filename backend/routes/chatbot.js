const express = require("express");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content: `
You are DealFlow Assistant, the AI sales copilot for DealFlow360.

DealFlow360 is a sales operations platform that helps users manage:
- Customers
- Deals
- Deal Builder
- Approvals
- Fulfillment
- Billing
- Inventory
- Warehouses
- Customer information
- Sales operations

Your job is to help users understand and use the DealFlow360 platform.

Answer questions clearly and professionally.
Keep answers concise but useful.
If the user asks about DealFlow360 features, explain them in simple language.
If the user asks what they can do, suggest relevant modules.
If you do not know something, say so instead of inventing information.

You are interacting directly with a DealFlow360 user.
              `,
            },
            {
              role: "user",
              content: message.trim(),
            },
          ],
          temperature: 0.4,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", data);

      return res.status(response.status).json({
        error: data?.error?.message || "AI service request failed",
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    res.json({
      reply,
    });
  } catch (error) {
    console.error("Chatbot error:", error);

    res.status(500).json({
      error: "Unable to connect to AI assistant",
    });
  }
});

module.exports = router;