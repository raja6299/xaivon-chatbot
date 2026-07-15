import { Calendar as CalendarIcon, Video, CheckCircle2, XCircle } from 'lucide-react';

const MEETINGS = [
  { id: 'MTG-1', title: 'Discovery Call', user: 'Sarah Jenkins', date: 'Today, 2:00 PM', duration: '30m', status: 'Upcoming' },
  { id: 'MTG-2', title: 'Enterprise Demo', user: 'Michael Chen', date: 'Tomorrow, 10:00 AM', duration: '45m', status: 'Upcoming' },
  { id: 'MTG-3', title: 'Strategy Session', user: 'Emma Wilson', date: 'Yesterday', duration: '60m', status: 'Completed' },
  { id: 'MTG-4', title: 'Discovery Call', user: 'David Kumar', date: 'Yesterday', duration: '30m', status: 'Cancelled' },
];

export default function CalendarManagement() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Calendar & Meetings</h1>
          <p className="text-sm text-slate-400 mt-1">Manage booked meetings from the AI Consultant</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Meeting</th>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MEETINGS.map(mtg => (
                <tr key={mtg.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Video className="w-4 h-4 text-violet-400" />
                      </div>
                      <span className="font-medium text-white">{mtg.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{mtg.user}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white">{mtg.date}</span>
                      <span className="text-xs text-slate-500">{mtg.duration}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {mtg.status === 'Upcoming' && <span className="inline-flex items-center gap-1 text-blue-400"><CalendarIcon className="w-3 h-3"/> Upcoming</span>}
                    {mtg.status === 'Completed' && <span className="inline-flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3 h-3"/> Completed</span>}
                    {mtg.status === 'Cancelled' && <span className="inline-flex items-center gap-1 text-rose-400"><XCircle className="w-3 h-3"/> Cancelled</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 h-fit">
          <h3 className="font-semibold text-white mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="text-sm text-slate-400">Meetings This Week</span>
              <span className="font-semibold text-white">42</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="text-sm text-slate-400">Completion Rate</span>
              <span className="font-semibold text-emerald-400">88%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Total Hours</span>
              <span className="font-semibold text-blue-400">31.5 hrs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
