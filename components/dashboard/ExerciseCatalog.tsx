import { Plus } from 'lucide-react';
import { useState } from 'react';

interface ExerciseCatalogProps {
  databaseCategories: string[];
  onAddExercise: (category: string, name: string) => Promise<void>;
}

export default function ExerciseCatalog({ databaseCategories, onAddExercise }: ExerciseCatalogProps) {
  const [customMuscleGroup, setCustomMuscleGroup] = useState('');
  const [newExerciseName, setNewExerciseName] = useState('');

  const handleAdd = async () => {
    if (!newExerciseName || !customMuscleGroup) return;
    await onAddExercise(customMuscleGroup, newExerciseName);
    setNewExerciseName(''); // Limpiamos el input después de guardar
  };

  return (
    <section className="bg-white/2 p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
      <h2 className="text-cyan-400 font-black mb-6 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
        <Plus size={16} /> Expandir Catálogo
      </h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <select 
            className="bg-white/5 p-3 rounded-xl border border-white/5 text-[10px] outline-none text-slate-300 font-bold"
            value={customMuscleGroup}
            onChange={(e) => setCustomMuscleGroup(e.target.value)}
          >
            <option value="" className="bg-[#0a0a0a]">Músculo</option>
            {databaseCategories.map(g => (
              <option key={g} value={g} className="bg-[#0a0a0a]">{g}</option>
            ))}
          </select>
          <input 
            type="text" 
            className="bg-white/5 p-3 rounded-xl border border-white/5 text-[10px] outline-none text-white font-bold" 
            placeholder="Nombre ej. Muscle Up" 
            value={newExerciseName}
            onChange={(e) => setNewExerciseName(e.target.value)}
          />
        </div>
        <button 
          type="button"
          onClick={handleAdd} 
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-cyan-400"
        >
          Agregar a mi Catálogo
        </button>
      </div>
    </section>
  );
}