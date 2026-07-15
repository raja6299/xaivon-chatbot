import { ShieldAlert, ShieldCheck, ShieldBan } from 'lucide-react';

const SECURITY_EVENTS = [
  { id: 'SEC-101', type: 'Spam Attempt', ip: '192.168.1.44', details: 'Honeypot hit on Lead Form', time: '5m ago', action: 'Blocked' },
  { id: 'SEC-102', type: 'Rate Limit', ip: '10.0.0.12', details: 'Exceeded 50 msgs/min in Chat', time: '12m ago', action: 'Throttled' },
  { id: 'SEC-103', type: 'Validation Error', ip: '172.16.0.5', details: 'Invalid file type .exe upload', time: '1h ago', action: 'Rejected' },
];

export default function SecurityDashboard() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Security Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Monitor anti-spam, rate limits, and security events</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-rose-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 text-rose-400 mb-2">
            <ShieldBan className="w-4 h-4" />
            <span className="text-sm font-medium">Blocked Requests</span>
          </div>
          <p className="text-3xl font-bold text-white mt-2">1,204</p>
        </div>
        <div className="bg-white/[0.02] border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 text-amber-400 mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-sm font-medium">Spam Attempts</span>
          </div>
          <p className="text-3xl font-bold text-white mt-2">842</p>
        </div>
        <div className="bg-white/[0.02] border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm font-medium">System Status</span>
          </div>
          <p className="text-xl font-bold text-white mt-2">Secure & Protected</p>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-semibold text-white">Recent Security Events</h3>
        </div>
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-6 py-4 font-medium">Event Type</th>
              <th className="px-6 py-4 font-medium">IP Address</th>
              <th className="px-6 py-4 font-medium">Details</th>
              <th className="px-6 py-4 font-medium">Action Taken</th>
              <th className="px-6 py-4 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {SECURITY_EVENTS.map(ev => (
              <tr key={ev.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 font-medium text-white">{ev.type}</td>
                <td className="px-6 py-4 font-mono text-xs">{ev.ip}</td>
                <td className="px-6 py-4">{ev.details}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400">
                    {ev.action}
                  </span>
                </td>
                <td className="px-6 py-4">{ev.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
