import React, { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import {
  AlertCircle,
  Bot,
  HelpCircle,
  MessageSquare,
  Package,
  RefreshCw,
  Send,
  UserCheck,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useChatStream } from "../hooks/useChatStream";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isStreaming, isGuidedMode, sendMessage } = useChatStream();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    const textToSend = inputText;
    setInputText("");
    await sendMessage(textToSend);
  };

  const handleQuickAction = async (intent: string) => {
    if (isStreaming) return;
    await sendMessage(intent);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-500/30"
          aria-label="Open SellerShield Assistant chat"
        >
          <MessageSquare className="h-7 w-7" />
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[92vw] sm:w-[420px] h-[580px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-navy-900 text-white p-4 flex items-center justify-between border-b border-navy-800">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm tracking-tight">SellerShield Assistant</h3>
                  <span className="bg-teal-900 text-teal-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-teal-700">
                    AI Support
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">Simulated AI Playground Agent</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              aria-label="Close chat window"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Guided Mode Banner (shows when live agent endpoint is offline / fallback) */}
          {isGuidedMode && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span className="font-medium">Guided mode</span>
                <span className="text-amber-700 hidden sm:inline">&bull; Assistant offline, quick actions active</span>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60"
            aria-live="polite"
            role="log"
          >
            {messages.length === 0 && (
              <div className="text-center py-6 px-4">
                <div className="h-12 w-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                  <Bot className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">How can I help you today?</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Ask questions about orders, returns, and shipments, or select a quick action below.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "customer" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === "customer"
                      ? "bg-teal-600 text-white rounded-br-none whitespace-pre-wrap break-words"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm"
                  }`}
                >
                  {msg.sender === "customer" ? (
                    // Customer text is strictly rendered as plain escaped text
                    <span>{msg.text}</span>
                  ) : (
                    // Assistant response is sanitized with DOMPurify
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 text-slate-800">
                      <ReactMarkdown>
                        {DOMPurify.sanitize(msg.text)}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}

            {isStreaming && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs italic px-2">
                <div className="h-2 w-2 rounded-full bg-teal-500 animate-ping"></div>
                <span>SellerShield is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions Bar */}
          <div className="bg-white border-t border-slate-200 px-3 py-2 flex items-center space-x-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleQuickAction("Track order")}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium whitespace-nowrap transition-colors"
            >
              <Package className="h-3.5 w-3.5 text-teal-600" />
              <span>Track order</span>
            </button>
            <button
              onClick={() => handleQuickAction("Start a return")}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium whitespace-nowrap transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 text-teal-600" />
              <span>Start a return</span>
            </button>
            <button
              onClick={() => handleQuickAction("Refund status")}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium whitespace-nowrap transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5 text-teal-600" />
              <span>Refund status</span>
            </button>
            <button
              onClick={() => handleQuickAction("Talk to a human")}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium whitespace-nowrap transition-colors"
            >
              <UserCheck className="h-3.5 w-3.5 text-teal-600" />
              <span>Talk to a human</span>
            </button>
          </div>

          {/* Input & Character Counter Form */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-slate-200 flex flex-col space-y-2"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                maxLength={1000}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask SellerShield a question..."
                className="w-full text-xs sm:text-sm pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                disabled={isStreaming}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isStreaming}
                className="absolute right-1.5 p-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 text-white disabled:text-slate-400 transition-colors"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            <div className="flex justify-between items-center px-1 text-[11px] text-slate-400">
              <span>Press Enter to send</span>
              <span className={inputText.length >= 950 ? "text-amber-600 font-semibold" : ""}>
                {inputText.length} / 1000
              </span>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

