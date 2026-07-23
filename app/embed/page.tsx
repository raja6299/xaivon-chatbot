"use client";

import { useEffect } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function Embed() {
  useEffect(() => {
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";
    return () => {
      document.body.style.background = "";
      document.documentElement.style.background = "";
    };
  }, []);

  // Post message to parent when closed from inside the iframe
  const handleClose = () => {
    if (window.parent !== window) {
      // Derive the target origin from environment variable, falling back to the domains already approved in CSP
      const targetOrigin = process.env.NEXT_PUBLIC_WEBSITE_URL || 
        (process.env.NODE_ENV === "production" ? "https://xaivon.com" : "http://localhost:5173");
        
      window.parent.postMessage({ type: "XAIVON_CHAT_CLOSE" }, targetOrigin);
    }
  };

  return (
    <main className="h-full w-full bg-transparent overflow-hidden">
      <div className="absolute inset-0 flex flex-col p-2">
        <div className="flex-1 relative rounded-2xl shadow-xl border border-violet-500/20 overflow-hidden bg-[#0a0e1a]">
          <ChatWindow onClose={handleClose} />
        </div>
      </div>
    </main>
  );
}
