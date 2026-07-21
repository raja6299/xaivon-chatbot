export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B0F19] text-[#F9FAFB] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-3xl text-center space-y-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-300 text-xs font-medium mb-4">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
          AI-Powered Solutions
        </div>
        <h1 className="text-5xl font-bold tracking-tight">
          Welcome to <span className="bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">XAIVON</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
          Your intelligent architect assistant is ready. Click the chat bubble in the bottom right to get started.
        </p>
      </div>
    </main>
  );
}

