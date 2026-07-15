import { Upload, RefreshCw, Trash2, Database, Search } from 'lucide-react';

const DOCS = [
  { id: 'KB-001', title: 'Product Pricing 2026.pdf', status: 'Indexed', chunks: 142, size: '2.4 MB', date: '2026-07-10' },
  { id: 'KB-002', title: 'Enterprise SLA.docx', status: 'Indexing', chunks: 0, size: '1.1 MB', date: '2026-07-15' },
  { id: 'KB-003', title: 'API Documentation.md', status: 'Indexed', chunks: 856, size: '8.5 MB', date: '2026-07-12' },
];

export default function KnowledgeBase() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Knowledge Base</h1>
          <p className="text-sm text-slate-400 mt-1">Manage documents used for AI Retrieval-Augmented Generation (RAG)</p>
        </div>
        <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-violet-500/20">
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Database className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Total Vectors</p>
            <p className="text-2xl font-bold text-white">45,291</p>
          </div>
        </div>
        {/* other stats can go here */}
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search knowledge base..." 
              className="w-full bg-black/20 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/30"
            />
          </div>
          <button className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white" title="Re-index all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-6 py-4 font-medium">Document</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Chunks</th>
              <th className="px-6 py-4 font-medium">Size</th>
              <th className="px-6 py-4 font-medium">Last Indexed</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {DOCS.map(doc => (
              <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 font-medium text-white">{doc.title}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${
                    doc.status === 'Indexed' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400'
                  }`}>
                    {doc.status}
                  </span>
                </td>
                <td className="px-6 py-4">{doc.chunks}</td>
                <td className="px-6 py-4">{doc.size}</td>
                <td className="px-6 py-4">{doc.date}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><RefreshCw className="w-4 h-4" /></button>
                  <button className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
