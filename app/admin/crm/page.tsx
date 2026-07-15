import { Search, Filter, Download, MoreVertical, UserCheck } from 'lucide-react';

const LEADS = [
  { id: 'LD-1029', name: 'Sarah Jenkins', company: 'TechCorp Inc.', email: 'sarah@techcorp.com', phone: '+1 (555) 019-2831', status: 'Qualified', score: 92, intent: 'Enterprise Plan', date: '2026-07-15' },
  { id: 'LD-1028', name: 'Michael Chen', company: 'Nexus Dynamics', email: 'm.chen@nexus.io', phone: '+1 (555) 928-1122', status: 'Discovery', score: 78, intent: 'API Integration', date: '2026-07-14' },
  { id: 'LD-1027', name: 'Emma Wilson', company: 'Global Solutions', email: 'emma.w@globalsol.com', phone: '+44 7700 900077', status: 'New', score: 45, intent: 'General Inquiry', date: '2026-07-14' },
  { id: 'LD-1026', name: 'David Kumar', company: 'Innovate AI', email: 'david@innovate.ai', phone: '+91 98765 43210', status: 'Proposal', score: 88, intent: 'Custom LLM', date: '2026-07-13' },
];

export default function CRMManagement() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CRM Leads</h1>
          <p className="text-sm text-slate-400 mt-1">Manage, score, and convert AI-generated leads</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="bg-black/20 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/30 w-64"
            />
          </div>
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-violet-500/20">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Lead Info</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Intent</th>
                <th className="px-6 py-4 font-medium">Score</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {LEADS.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{lead.name}</div>
                        <div className="text-xs text-slate-500">{lead.company}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-300">{lead.email}</span>
                      <span className="text-xs text-slate-500">{lead.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${
                      lead.status === 'Qualified' ? 'bg-emerald-400/10 text-emerald-400' :
                      lead.status === 'Proposal' ? 'bg-blue-400/10 text-blue-400' :
                      lead.status === 'Discovery' ? 'bg-violet-400/10 text-violet-400' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{lead.intent}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${lead.score >= 80 ? 'bg-emerald-400' : lead.score >= 50 ? 'bg-blue-400' : 'bg-slate-500'}`} 
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className="text-xs">{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{lead.date}</td>
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
      </div>
    </div>
  );
}
