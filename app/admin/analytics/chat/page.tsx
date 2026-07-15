import { Search, Filter, MessageSquare, MoreVertical, Clock } from 'lucide-react';

const CONVERSATIONS = [
  { id: 'CONV-8821', user: 'Visitor-492', status: 'Active', lang: 'EN', intent: 'Pricing Query', score: 85, time: '2m ago', length: '14 msgs' },
  { id: 'CONV-8820', user: 'Sarah Jenkins', status: 'Handoff', lang: 'EN', intent: 'Enterprise Sales', score: 92, time: '15m ago', length: '45 msgs' },
  { id: 'CONV-8819', user: 'Visitor-991', status: 'Ended', lang: 'HI', intent: 'Support', score: 45, time: '1h ago', length: '8 msgs' },
  { id: 'CONV-8818', user: 'Michael Chen', status: 'Ended', lang: 'EN', intent: 'API Integration', score: 78, time: '2h ago', length: '24 msgs' },
  { id: 'CONV-8817', user: 'Visitor-112', status: 'Active', lang: 'HI', intent: 'General Query', score: 30, time: 'Just now', length: '2 msgs' },
];

export default function LiveChatAnalytics() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Live Chat Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Monitor real-time conversations and AI interactions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="bg-black/20 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/30 w-64"
            />
          </div>
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium">Active Now</span>
          </div>
          <p className="text-3xl font-bold text-white">42</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">Today&apos;s Total</span>
          </div>
          <p className="text-3xl font-bold text-white">1,284</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 text-amber-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Avg. Duration</span>
          </div>
          <p className="text-3xl font-bold text-white">4m 12s</p>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Conversation ID</th>
                <th className="px-6 py-4 font-medium">User / Session</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Language</th>
                <th className="px-6 py-4 font-medium">Intent</th>
                <th className="px-6 py-4 font-medium">Lead Score</th>
                <th className="px-6 py-4 font-medium">Activity</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {CONVERSATIONS.map((conv) => (
                <tr key={conv.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{conv.id}</td>
                  <td className="px-6 py-4">{conv.user}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${
                      conv.status === 'Active' ? 'bg-emerald-400/10 text-emerald-400' :
                      conv.status === 'Handoff' ? 'bg-amber-400/10 text-amber-400' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {conv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{conv.lang}</td>
                  <td className="px-6 py-4">{conv.intent}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${conv.score >= 80 ? 'bg-emerald-400' : conv.score >= 50 ? 'bg-blue-400' : 'bg-slate-500'}`} 
                          style={{ width: `${conv.score}%` }}
                        />
                      </div>
                      <span className="text-xs">{conv.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white">{conv.time}</span>
                      <span className="text-xs text-slate-500">{conv.length}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between text-sm text-slate-400">
          <span>Showing 1 to 5 of 12,492 entries</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-white/5 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50">Previous</button>
            <button className="px-3 py-1 border border-white/5 hover:bg-white/5 rounded-lg transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
