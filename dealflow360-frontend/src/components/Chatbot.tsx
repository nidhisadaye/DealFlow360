import { useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";

type Message = {
  sender: "bot" | "user";
  text: string;
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Hi! I'm DealFlow Assistant 👋 How can I help you with DealFlow360?",
    },
  ]);

  const sendMessage = async () => {
    const text = message.trim();

    if (!text || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/chatbot",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to get AI response");
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            data.reply ||
            "Sorry, I couldn't generate a response.",
        },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            "I'm having trouble connecting to the AI service. Please make sure the DealFlow360 backend is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div
          style={{
            position: "fixed",
            right: "24px",
            bottom: "92px",
            width: "360px",
            height: "500px",
            background: "#ffffff",
            borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(15, 23, 42, 0.18)",
            border: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              padding: "17px 18px",
              background: "linear-gradient(135deg, #2563eb, #4f46e5)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bot size={21} />
              </div>

              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize: "15px",
                  }}
                >
                  DealFlow Assistant
                </strong>

                <span
                  style={{
                    fontSize: "11px",
                    opacity: 0.85,
                  }}
                >
                  AI Sales Copilot
                </span>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              style={{
                border: "none",
                background: "transparent",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div
            style={{
              flex: 1,
              padding: "18px",
              overflowY: "auto",
              background: "#f8fafc",
            }}
          >
            {messages.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent:
                    item.sender === "user"
                      ? "flex-end"
                      : "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "11px 13px",
                    borderRadius:
                      item.sender === "user"
                        ? "15px 15px 4px 15px"
                        : "15px 15px 15px 4px",
                    background:
                      item.sender === "user"
                        ? "#2563eb"
                        : "#ffffff",
                    color:
                      item.sender === "user"
                        ? "#ffffff"
                        : "#334155",
                    fontSize: "13px",
                    lineHeight: 1.5,
                    boxShadow:
                      item.sender === "user"
                        ? "none"
                        : "0 2px 8px rgba(15,23,42,0.06)",
                  }}
                >
                  {item.text}
                </div>
              </div>
            ))}

            {loading && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    padding: "11px 14px",
                    borderRadius: "15px 15px 15px 4px",
                    background: "#ffffff",
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  DealFlow Assistant is thinking...
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              padding: "12px",
              borderTop: "1px solid #e5e7eb",
              background: "#ffffff",
              display: "flex",
              gap: "8px",
            }}
          >
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Ask about deals..."
              disabled={loading}
              style={{
                flex: 1,
                border: "1px solid #dbe2ea",
                borderRadius: "10px",
                padding: "10px 12px",
                outline: "none",
                fontSize: "13px",
              }}
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                width: "40px",
                height: "40px",
                border: "none",
                borderRadius: "10px",
                background: loading ? "#94a3b8" : "#2563eb",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          right: "24px",
          bottom: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #2563eb, #4f46e5)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 10px 30px rgba(37, 99, 235, 0.35)",
          zIndex: 10000,
        }}
        aria-label="Open DealFlow Assistant"
      >
        {open ? <X size={23} /> : <MessageCircle size={23} />}
      </button>
    </>
  );
}