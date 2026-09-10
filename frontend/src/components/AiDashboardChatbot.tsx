"use client";

import React, { useState, useEffect, useRef } from "react";
import { getAiDashboardContext, AiDashboardContext } from "@/app/actions/aiChat";
import { askPuterAi, loadPuterScript } from "@/lib/puterAi";
import FormattedAiMessage from "@/components/FormattedAiMessage";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const ROLE_THEMES: Record<string, {
  gradient: string;
  badgeBg: string;
  badgeText: string;
  accentText: string;
  ringColor: string;
  userBubble: string;
  quickChip: string;
}> = {
  manufacturer: {
    gradient: "from-blue-600 to-indigo-700",
    badgeBg: "bg-blue-100 text-blue-800 border-blue-200",
    badgeText: "Manufacturer Intelligence",
    accentText: "text-blue-600",
    ringColor: "ring-blue-500",
    userBubble: "bg-blue-600 text-white",
    quickChip: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200",
  },
  distributor: {
    gradient: "from-violet-600 to-purple-700",
    badgeBg: "bg-violet-100 text-violet-800 border-violet-200",
    badgeText: "Distribution Intelligence",
    accentText: "text-violet-600",
    ringColor: "ring-violet-500",
    userBubble: "bg-violet-600 text-white",
    quickChip: "bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200",
  },
  retailer: {
    gradient: "from-emerald-600 to-teal-700",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
    badgeText: "Pharmacy & Retail Intelligence",
    accentText: "text-emerald-600",
    ringColor: "ring-emerald-500",
    userBubble: "bg-emerald-600 text-white",
    quickChip: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  disposer: {
    gradient: "from-orange-600 to-amber-700",
    badgeBg: "bg-orange-100 text-orange-800 border-orange-200",
    badgeText: "Bio-Destruction Intelligence",
    accentText: "text-orange-600",
    ringColor: "ring-orange-500",
    userBubble: "bg-orange-600 text-white",
    quickChip: "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200",
  },
  host: {
    gradient: "from-rose-600 to-red-700",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-200",
    badgeText: "Regulatory Oversight Intelligence",
    accentText: "text-rose-600",
    ringColor: "ring-rose-500",
    userBubble: "bg-rose-600 text-white",
    quickChip: "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200",
  },
};

export default function AiDashboardChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<AiDashboardContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [puterReady, setPuterReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Puter and load dashboard context
  useEffect(() => {
    loadPuterScript().then((ready) => {
      setPuterReady(ready);
    });

    setLoadingContext(true);
    getAiDashboardContext()
      .then((ctx) => {
        if (ctx) {
          setContext(ctx);
          // Initial greeting tailored to role
          setMessages([
            {
              id: "welcome-1",
              role: "assistant",
              content: `Hello **${ctx.userName}**! 👋 I am your **PharmaTrack AI Copilot**.\n\nI have analyzed your live **${ctx.role.toUpperCase()}** dashboard. Ask me anything about:\n- 📊 **Sales & inventory summaries**\n- 🔮 **Stockout risk & depletion predictions**\n- 💡 **Reorder recommendations & quantities**\n- ⚠️ **Near-expiry risks & returns**`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        }
      })
      .finally(() => {
        setLoadingContext(false);
      });
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isThinking]);

  const handleSend = async (customText?: string) => {
    const query = (customText || input).trim();
    if (!query || isThinking || !context) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    try {
      // Re-fetch latest context snapshot on each message for fresh real-time accuracy
      const freshContext = (await getAiDashboardContext()) || context;
      setContext(freshContext);

      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const reply = await askPuterAi(query, freshContext, history);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "⚠️ An error occurred while analyzing your data. Please try asking again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const role = context?.role || "retailer";
  const theme = ROLE_THEMES[role] || ROLE_THEMES.retailer;

  // Role-tailored Quick Prompts
  const quickPrompts = [
    { label: "📊 Sales & Movement Summary", query: "Summarize my current sales, inventory, and movement data." },
    { label: "🔮 Stockout & Depletion Prediction", query: "Predict which drugs will sell out first and when will stock deplete?" },
    { label: "💡 Reorder Recommendations", query: "Which drugs do you recommend I reorder right now, and what quantities?" },
    { label: "⚠️ Near-Expiry Risk Audit", query: "Are any of my medicines near expiry, and what actions should I take?" },
  ];

  return (
    <>
      {/* ─── FLOATING LAUNCHER BUTTON ─── */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3">
        {!isOpen && (
          <div className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 shadow-lg text-xs font-semibold text-slate-700 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>PharmaTrack AI Copilot</span>
          </div>
        )}

        <button
          id="ai-chatbot-toggle-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`relative p-3.5 sm:p-4 rounded-full bg-gradient-to-r ${theme.gradient} text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-4 ${theme.ringColor}/40`}
          aria-label="Open PharmaTrack AI Copilot"
          title="Open PharmaTrack AI Intelligence Copilot"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 border border-white"></span>
              </span>
            </div>
          )}
        </button>
      </div>

      {/* ─── CHAT DRAWER / WINDOW ─── */}
      {isOpen && (
        <div className="fixed bottom-20 right-3 sm:right-5 z-50 w-[calc(100vw-24px)] sm:w-[480px] max-w-[500px] h-[600px] max-h-[calc(100vh-100px)] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200 font-sans">
          {/* Header */}
          <div className={`p-4 bg-gradient-to-r ${theme.gradient} text-white flex items-center justify-between shadow-md`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white font-bold text-lg shadow-inner">
                ✨
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base leading-tight">PharmaTrack AI</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 text-white font-semibold border border-white/20">
                    Copilot
                  </span>
                </div>
                <p className="text-[11px] text-white/80 mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  Grounded in your {context?.role.toUpperCase()} data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (context) {
                    setMessages([
                      {
                        id: "welcome-reset",
                        role: "assistant",
                        content: `Chat cleared. Ask me anything regarding your **${context.role.toUpperCase()}** inventory, sales, predictions, or reorders.`,
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      },
                    ]);
                  }
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors text-xs"
                title="Clear conversation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                title="Close chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p.query)}
                disabled={isThinking}
                className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${theme.quickChip} disabled:opacity-50`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Message Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} max-w-full`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                    m.role === "user"
                      ? `${theme.userBubble} rounded-tr-none font-medium max-w-[85%]`
                      : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-none w-full max-w-[96%] shadow-xs"
                  }`}
                >
                  {m.role === "user" ? (
                    <div className="whitespace-pre-wrap font-sans break-words">{m.content}</div>
                  ) : (
                    <FormattedAiMessage content={m.content} />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">{m.timestamp}</span>
              </div>
            ))}

            {isThinking && (
              <div className="flex flex-col items-start max-w-full">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-xs text-slate-600 font-medium ml-1">PharmaTrack AI is analyzing your dashboard...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask PharmaTrack AI about your ${role} data...`}
                disabled={isThinking}
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white text-slate-800 placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isThinking}
                className={`p-2.5 rounded-xl bg-gradient-to-r ${theme.gradient} text-white shadow-md hover:opacity-95 active:scale-95 disabled:opacity-40 transition-all`}
                title="Send Message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-slate-400">
              <span>Grounded in your live authenticated records</span>
              <span className="font-mono font-medium text-slate-500">PharmaTrack AI</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
