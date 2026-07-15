import { FileText, Image as ImageIcon, Search } from 'lucide-react';

const USER_DOCS = [
  { id: 'UD-101', type: 'image', name: 'error-screenshot.png', user: 'Visitor-492', size: '1.2 MB', parseStatus: 'Success', date: '2026-07-15' },
  { id: 'UD-102', type: 'doc', name: 'requirements.pdf', user: 'Sarah Jenkins', size: '4.5 MB', parseStatus: 'Success', date: '2026-07-15' },
];

export default function UserDocuments() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">User Documents</h1>
        <p className="text-sm text-slate-400 mt-1">Review files and images uploaded by users during conversations</p>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search uploaded documents..." 
              className="w-full bg-black/20 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/30"
            />
          </div>
        </div>
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-6 py-4 font-medium">File</th>
              <th className="px-6 py-4 font-medium">Uploaded By</th>
              <th className="px-6 py-4 font-medium">Size</th>
              <th className="px-6 py-4 font-medium">Parse Status</th>
              <th className="px-6 py-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {USER_DOCS.map(doc => (
              <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      {doc.type === 'image' ? <ImageIcon className="w-4 h-4 text-blue-400" /> : <FileText className="w-4 h-4 text-rose-400" />}
                    </div>
                    <span className="font-medium text-white">{doc.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{doc.user}</td>
                <td className="px-6 py-4">{doc.size}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-emerald-400/10 text-emerald-400">
                    {doc.parseStatus}
                  </span>
                </td>
                <td className="px-6 py-4">{doc.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
