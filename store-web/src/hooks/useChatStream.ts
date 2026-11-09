import { useCallback, useRef, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { getAccessToken } from "../api/client";

export interface ChatMessage {
  id: string;
  sender: "customer" | "assistant" | "system";
  text: string;
  timestamp: Date;
  status?: "sending" | "sent" | "error";
  quickActions?: string[];
}

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  /**
   * Send a chat message. Attempts the SSE stream to /agent/v1/chat/stream.
   * If the agent is unreachable (since it is a placeholder in Document 1),
   * falls back to Guided mode with structured deterministic responses.
   */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const customerMsgId = `cust-${Date.now()}`;
      const customerMsg: ChatMessage = {
        id: customerMsgId,
        sender: "customer",
        text: trimmed,
        timestamp: new Date(),
        status: "sent",
      };

      setMessages((prev) => [...prev, customerMsg]);
      setIsStreaming(true);

      const assistantMsgId = `asst-${Date.now()}`;
      let accumulatedText = "";

      // Check if already in guided mode
      if (isGuidedMode) {
        setTimeout(() => {
          const reply = getGuidedResponse(trimmed);
          setMessages((prev) => [
            ...prev,
            {
              id: assistantMsgId,
              sender: "assistant",
              text: reply,
              timestamp: new Date(),
            },
          ]);
          setIsStreaming(false);
        }, 400);
        return;
      }

      // Try streaming from agent
      abort();
      const ctrl = new AbortController();
      abortControllerRef.current = ctrl;

      const token = getAccessToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      try {
        await fetchEventSource("/agent/v1/chat/stream", {
          method: "POST",
          headers,
          body: JSON.stringify({ message: trimmed }),
          signal: ctrl.signal,
          async onopen(response) {
            if (!response.ok) {
              // Agent endpoint not ready or returned error -> switch to Guided mode
              throw new Error(`Agent unavailable (${response.status})`);
            }
          },
          onmessage(msg) {
            if (msg.data) {
              try {
                const parsed = JSON.parse(msg.data);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                }
              } catch {
                accumulatedText += msg.data;
              }

              setMessages((prev) => {
                const existing = prev.find((m) => m.id === assistantMsgId);
                if (existing) {
                  return prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, text: accumulatedText } : m,
                  );
                } else {
                  return [
                    ...prev,
                    {
                      id: assistantMsgId,
                      sender: "assistant",
                      text: accumulatedText,
                      timestamp: new Date(),
                    },
                  ];
                }
              });
            }
          },
          onclose() {
            setIsStreaming(false);
          },
          onerror(err) {
            // Unreachable or connection error -> activate Guided mode fallback
            setIsGuidedMode(true);
            const fallbackReply = getGuidedResponse(trimmed);
            setMessages((prev) => {
              const withoutEmpty = prev.filter((m) => m.id !== assistantMsgId);
              return [
                ...withoutEmpty,
                {
                  id: assistantMsgId,
                  sender: "assistant",
                  text: fallbackReply,
                  timestamp: new Date(),
                },
              ];
            });
            setIsStreaming(false);
            // Throw to prevent infinite reconnection attempts to nonexistent agent
            throw err;
          },
        });
      } catch {
        setIsGuidedMode(true);
        setIsStreaming(false);
      }
    },
    [abort, isGuidedMode],
  );

  return {
    messages,
    isStreaming,
    isGuidedMode,
    sendMessage,
    addMessage,
    abort,
    setIsGuidedMode,
  };
}

/**
 * Deterministic local replies for Guided Mode when the live AI Agent is unavailable.
 */
export function getGuidedResponse(intentOrText: string): string {
  const lower = intentOrText.toLowerCase();

  if (lower.includes("track") || lower.includes("where is my order")) {
    return (
      "**Order Tracking**\n\n" +
      "You can view live shipment milestones for your orders directly on your **My Orders** page. " +
      "Click on any order to view its real-time carrier timeline and estimated delivery date."
    );
  }

  if (lower.includes("return") || lower.includes("start a return")) {
    return (
      "**Returns Policy**\n\n" +
      "• **7-Day Window**: Eligible items can be returned within 7 days of delivery.\n" +
      "• **Defective Items**: Covered with free reverse shipping.\n" +
      "• **Hygiene & Final Sale**: Personal care and hygiene items cannot be returned.\n\n" +
      "Self-service return requests can be initiated from your order details page once delivered."
    );
  }

  if (lower.includes("refund") || lower.includes("refund status")) {
    return (
      "**Refund Status**\n\n" +
      "All approved refunds are processed back to your original payment method via **SimPay** within 3–5 business days. " +
      "You will receive a simulated confirmation email in your Inbox once released."
    );
  }

  if (lower.includes("human") || lower.includes("talk to a human") || lower.includes("agent")) {
    return (
      "**Escalation to Support Specialist**\n\n" +
      "I have flagged your inquiry for priority human review. A support specialist typically replies within **2 hours** during business hours (9:00 AM – 6:00 PM IST)."
    );
  }

  return (
    "I have received your request. In **Guided Mode**, you can use the quick action buttons below " +
    "to track shipments, review return guidelines, check refund timelines, or request human support."
  );
}

