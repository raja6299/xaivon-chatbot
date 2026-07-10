import { ChatWidget } from "@/components/chat/ChatWidget";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B0F19] text-[#F9FAFB] flex flex-col items-center justify-center p-8">
      <div className="max-w-3xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Welcome to <span className="text-violet-500">XAIVON</span>
        </h1>
        <p className="text-lg text-gray-400">
          Your intelligent architect assistant is ready. Click the chat bubble in the bottom right to get started.
        </p>
      </div>
      
      {/* Render the chat widget */}
      <ChatWidget />
    </main>
  );
}
