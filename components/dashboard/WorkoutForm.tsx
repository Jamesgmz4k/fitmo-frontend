import { Dumbbell, Edit3, Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface WorkoutFormProps {
  exercisesDatabase: Record<string, string[]>;
  editingId: number | null;
  onCancelEdit: () => void;
  onSubmit: (data: any) => void;
  initialData?: any; // Para cargar datos cuando editas
}

export default function WorkoutForm({ 
  exercisesDatabase, 
  editingId, 
  onCancelEdit, 
  onSubmit,
  initialData 
}: WorkoutFormProps) {
  const [muscleGroup, setMuscleGroup] = useState('');
  const [exerciseType, setExerciseType] = useState('');
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState([{ id: Date.now(), reps: '' }]);

  // Efecto para cargar datos si entramos en modo edición
  useEffect(() => {
    if (editingId && initialData) {
      setMuscleGroup(initialData.muscle);
      setExerciseType(initialData.exercise);
      setWeight(initialData.weight);
      setSets(initialData.sets);
    } else if (!editingId) {
      // Limpiar si salimos de edición
      setMuscleGroup('');
      setExerciseType('');
      setWeight('');
      setSets([{ id: Date.now(), reps: '' }]);
    }
  }, [editingId, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ muscleGroup, exerciseType, weight, sets });
  };

  return (
    <section className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${editingId ? 'bg-cyan-500/5 border-cyan-500/30' : 'bg-white/2 border-white/5 shadow-xl'}`}>
      <h2 className={`font-black mb-6 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 ${editingId ? 'text-cyan-400' : 'text-violet-400'}`}>
        {editingId ? <Edit3 size={16} /> : <Dumbbell size={16} />} 
        {editingId ? 'Editando Entrenamiento' : 'Registrar Entrenamiento'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <select 
            className="bg-white/5 p-4 rounded-2xl border border-white/5 text-sm outline-none text-slate-300 font-bold appearance-none" 
            value={muscleGroup} 
            onChange={(e) => { setMuscleGroup(e.target.value); setExerciseType(''); }}
          >
            <option value="" className="bg-[#0a0a0a]">Músculo</option>
            {Object.keys(exercisesDatabase).map(g => (
              <option key={g} value={g} className="bg-[#0a0a0a]">{g}</option>
            ))}
          </select>
          
          <select 
            className="bg-white/5 p-4 rounded-2xl border border-white/5 text-sm outline-none text-slate-300 font-bold appearance-none disabled:opacity-30" 
            value={exerciseType} 
            onChange={(e) => setExerciseType(e.target.value)} 
            disabled={!muscleGroup}
          >
            <option value="" className="bg-[#0a0a0a]">Ejercicio</option>
            {muscleGroup && exercisesDatabase[muscleGroup]?.map(ex => (
              <option key={ex} value={ex} className="bg-[#0a0a0a]">{ex}</option>
            ))}
          </select>
        </div>

        <input 
          type="number" 
          className="w-full bg-white/5 p-4 rounded-2xl border border-white/5 text-sm outline-none text-white font-bold" 
          placeholder="Peso total (kg)" 
          value={weight} 
          onChange={(e) => setWeight(e.target.value)} 
          required 
        />

        <div className="space-y-2">
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Series y Repeticiones</p>
           {sets.map((set, i) => (
             <div key={set.id} className="flex gap-2">
               <input 
                 className="flex-1 bg-white/5 p-3 rounded-xl border border-white/5 text-xs outline-none text-white font-bold focus:border-violet-500/30" 
                 placeholder={`Reps Set #${i+1}`} 
                 value={set.reps} 
                 onChange={(e) => {
                   const ns = [...sets];
                   ns[i].reps = e.target.value;
                   setSets(ns);
                 }} 
                 required 
               />
               {sets.length > 1 && (
                 <button 
                  type="button" 
                  onClick={() => setSets(sets.filter(s => s.id !== set.id))}
                  className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                 >
                   <X size={14} />
                 </button>
               )}
             </div>
           ))}
           <button 
             type="button" 
             onClick={() => setSets([...sets, { id: Date.now(), reps: '' }])} 
             className="w-full py-3 border border-dashed border-white/10 rounded-xl text-[9px] font-black text-slate-500 hover:border-white/20 hover:text-slate-400 transition-all uppercase tracking-widest"
           >
             + Añadir Set
           </button>
        </div>

        <div className="flex gap-2 pt-2">
          <button 
            disabled={!exerciseType || !weight} 
            className={`flex-1 p-4 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all text-white shadow-lg ${(!exerciseType || !weight) ? 'bg-slate-800 opacity-50 cursor-not-allowed' : editingId ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/20' : 'bg-violet-600 hover:bg-violet-500 shadow-violet-900/20'}`}
          >
            {editingId ? 'Actualizar Entrenamiento' : 'Guardar Entrenamiento'}
          </button>
          
          {editingId && (
            <button 
              type="button" 
              onClick={onCancelEdit} 
              className="bg-white/5 px-6 rounded-2xl text-[10px] font-black text-slate-400 uppercase hover:bg-white/10 transition-all border border-white/5"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </section>
  );
}