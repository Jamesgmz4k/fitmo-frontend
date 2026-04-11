import { Trophy, Star } from 'lucide-react';

interface RecordItem {
  name: string;
  weight: number;
}

interface PersonalRecordsProps {
  records: RecordItem[];
}

export default function PersonalRecords({ records }: PersonalRecordsProps) {
  return (
    <section className="bg-gradient-to-br from-violet-600/10 to-transparent p-8 rounded-[2.5rem] border border-violet-500/20 shadow-2xl">
      <h2 className="text-violet-400 font-black mb-6 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
        <Trophy size={16} /> Personal Records
      </h2>
      <div className="space-y-3">
        {records.map((pr) => (
          <div key={pr.name} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 group hover:border-violet-500/40 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/20 rounded-lg text-violet-400">
                <Star size={14} fill="currentColor" />
              </div>
              <span className="text-xs font-bold text-slate-200">{pr.name}</span>
            </div>
            <span className="text-sm font-black text-white">
              {pr.weight} <span className="text-[10px] text-violet-400 uppercase">KG</span>
            </span>
          </div>
        ))}
        {records.length === 0 && (
          <p className="text-xs text-slate-500 text-center italic mt-4">Aún no hay récords registrados.</p>
        )}
      </div>
    </section>
  );
}