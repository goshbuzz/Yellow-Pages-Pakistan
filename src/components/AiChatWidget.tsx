import React, { useState, useEffect, useRef } from "react";
import { X, Send, Bot, Loader2 } from "lucide-react";
import { ChatMessage } from "../types";

export const AiChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Assalam-o-Alaikum! I am your YellowPages PK AI Assistant. I represent an index of over 10,250 verified Pakistani institutions and firms across cities like Sahiwal, Khanpur, Abbottabad, Bahawalpur, Rahim Yar Khan, Karachi, Lahore, and Peshawar.\n\nAsk me to locate government colleges, tehsil hospitals, small scale ginning/flour mills, or explain public and business contact directories!",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", text: inputText };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMsg.text,
          history: messages.slice(-10), // Pass recent conversation context
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to contact chat server.");
      }

      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Forgive me, I'm experiencing temporary trouble connecting to the Pakistani directory index. Please verify your connection or try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating launcher trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 ${
          isOpen ? "bg-red-500 rotate-90" : "bg-gray-950 hover:bg-amber-500"
        } text-white border-2 border-white cursor-pointer`}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-7 h-7" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-5 sm:right-6 w-[calc(100vw-2.5rem)] sm:w-[380px] md:w-[410px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden h-[520px] animate-slide-up">
          {/* Header */}
          <div className="bg-gray-950 p-4 flex items-center gap-3 border-b border-gray-800">
            <div className="bg-amber-400 p-1.5 rounded-full shrink-0">
              <Bot className="w-5 h-5 text-gray-950" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-extrabold text-sm truncate font-sans">YellowPages AI Assistant</h3>
              <p className="text-[10px] text-gray-400 flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span>10,250+ National Indexes Verified</span>
              </p>
            </div>
          </div>

          {/* Messages Port */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4 font-sans">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs shadow-2xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-amber-400 text-gray-950 rounded-tr-none font-bold"
                      : "bg-white text-gray-700 border border-gray-200 rounded-tl-none font-medium"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-2xs">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Panel */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Find government high schools in Khanpur..."
                className="w-full bg-gray-150 text-gray-900 placeholder-gray-400 rounded-full pl-4 pr-12 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 font-sans border-none"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || loading}
                className="absolute right-1.5 p-2 bg-gray-950 text-white rounded-full hover:bg-amber-500 hover:text-gray-950 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
