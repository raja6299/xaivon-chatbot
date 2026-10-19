"use client";

import { useEffect, useCallback, useState } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";

const APPROVED_PARENT_ORIGINS = [
  "https://xaivon.com",
  "https://www.xaivon.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

export default function Embed() {
  const [initialPrompt, setInitialPrompt] = useState<string>("");

  useEffect(() => {
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";

    // Notify parent that embed is ready
    if (window.parent !== window) {
      try {
        const referrerOrigin = document.referrer ? new URL(document.referrer).origin : null;
        const targetOrigin = referrerOrigin && APPROVED_PARENT_ORIGINS.includes(referrerOrigin)
          ? referrerOrigin
          : "https://xaivon.com";

        window.parent.postMessage({ type: "XAIVON_CHAT_READY" }, targetOrigin);
      } catch {
        // Safe fallback
      }
    }

    // Inbound postMessage listener with strict origin and source verification
    const handleInboundMessage = (event: MessageEvent) => {
      // 1. Strict Origin verification
      if (!APPROVED_PARENT_ORIGINS.includes(event.origin)) {
        return;
      }
      // 2. Strict Source verification
      if (event.source !== window.parent) {
        return;
      }

      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "XAIVON_THEME_CHANGE") {
        if (data.theme === "dark" || data.theme === "light") {
          document.documentElement.setAttribute("data-theme", data.theme);
          if (data.theme === "dark") {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");
          } else {
            document.documentElement.classList.add("light");
            document.documentElement.classList.remove("dark");
          }
        }
      } else if (data.type === "XAIVON_OPEN_WITH_PROMPT") {
        if (typeof data.prompt === "string" && data.prompt.trim()) {
          setInitialPrompt(data.prompt.trim());
          window.dispatchEvent(new CustomEvent("xaivon:set-prompt", { detail: data.prompt.trim() }));
        }
      }
    };

    window.addEventListener("message", handleInboundMessage);

    return () => {
      window.removeEventListener("message", handleInboundMessage);
      document.body.style.background = "";
      document.documentElement.style.background = "";
    };
  }, []);

  const handleClose = useCallback(() => {
    if (window.parent !== window) {
      try {
        const referrerOrigin = document.referrer ? new URL(document.referrer).origin : null;
        const targetOrigin = referrerOrigin && APPROVED_PARENT_ORIGINS.includes(referrerOrigin)
          ? referrerOrigin
          : "https://xaivon.com";

        window.parent.postMessage({ type: "XAIVON_CHAT_CLOSE" }, targetOrigin);
      } catch {
        window.parent.postMessage({ type: "XAIVON_CHAT_CLOSE" }, "https://xaivon.com");
      }
    }
  }, []);

  return (
    <main className="h-full w-full bg-transparent overflow-hidden">
      <div className="absolute inset-0 flex flex-col p-1 sm:p-2">
        <div className="flex-1 relative rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-panel)]">
          <ChatWindow onClose={handleClose} isEmbed={true} initialPrompt={initialPrompt} />
        </div>
      </div>
    </main>
  );
}
