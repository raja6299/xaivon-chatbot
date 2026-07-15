import { Search, Bell } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-violet-500/10 sticky top-0 z-40">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search across conversations, leads, documents..." 
            className="w-full bg-black/20 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/20 transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 pl-4">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors text-slate-400 hover:text-white">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0a0e1a]"></span>
        </button>
      </div>
    </header>
  );
}
