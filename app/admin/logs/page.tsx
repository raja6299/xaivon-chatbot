import { ScrollText, Search, Filter } from 'lucide-react';

const LOGS = [
  { id: 'LOG-88312', event: 'Lead Submitted', user: 'System', details: 'Sarah Jenkins created a new lead via Chat Form.', time: '2 mins ago' },
  { id: 'LOG-88311', event: 'Admin Login', user: 'admin@xaivon.com', details: 'Successful login from 192.168.1.1', time: '15 mins ago' },
  { id: 'LOG-88310', event: 'Knowledge Indexed', user: 'System', details: 'Enterprise SLA.docx was successfully chunked and embedded.', time: '1 hour ago' },
  { id: 'LOG-88309', event: 'Meeting Booked', user: 'System', details: 'Demo booked with Michael Chen for tomorrow.', time: '2 hours ago' },
  { id: 'LOG-88308', event: 'Settings Updated', user: 'admin@xaivon.com', details: 'Updated RAG similarity threshold to 0.75.', time: '3 hours ago' },
];

export default function AuditLogs() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Audit Logs</h1>
          <p className="text-sm text-slate-400 mt-1">Comprehensive enterprise activity log</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="bg-black/20 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/30 w-64"
            />
          </div>
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
        <div className="space-y-6">
          {LOGS.map((log) => (
            <div key={log.id} className="flex gap-4 group">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-violet-500/30 transition-colors">
                  <ScrollText className="w-4 h-4 text-slate-400 group-hover:text-violet-400" />
                </div>
                <div className="flex-1 w-px bg-white/5 mt-2 group-last:hidden" />
              </div>
              <div className="flex-1 pb-6 group-last:pb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-white">{log.event}</h4>
                    <p className="text-sm text-slate-400 mt-1">{log.details}</p>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap ml-4">{log.time}</span>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  User: <span className="text-slate-300">{log.user}</span> | ID: {log.id}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
