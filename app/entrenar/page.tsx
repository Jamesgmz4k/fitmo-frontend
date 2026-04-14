'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Search, Zap, Target, BookOpen, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../lib/apiClient'; // Importamos tu cliente API

// --- DEFINICIÓN DE TIPOS ---
interface Exercise {
  id: string;
  name: string;
  muscle_group: string; // Django usa muscle_group, no group
  equipment: string;
  description?: string;
}

interface TemplateExercise {
  id: string; // ID temporal/local para Next.js
  exerciseId: string; // ID real en la DB
  exerciseName: string;
  sets: number;
  reps: number | null;
  weight: number | null;
  rpe: number | null;
  muscle_group: string;
}

export default function TrainPage() {
  const router = useRouter();

  // --- ESTADO MAESTRO ---
  const [templateName, setTemplateName] = useState('Mi Nueva Rutina');
  const [exercisesInTemplate, setExercisesInTemplate] = useState<TemplateExercise[]>([]);
  const [allCatalogExercises, setAllCatalogExercises] = useState<Exercise[]>([]); // El catálogo completo de la DB
  const [activeMuscleGroup, setActiveMuscleGroup] = useState<string | null>('Pecho'); // Accordion abierto por defecto

  // --- ESTADO DEL MODAL "NUEVO EJERCICIO" ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMuscleForAdd, setSelectedMuscleForAdd] = useState<string | null>(null);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [isCreatingExercise, setIsCreatingExercise] = useState(false); // Loading state del botón

  const muscleGroups = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Abdomen', 'Cardio'];

  // --- CARGAR CATÁLOGO INICIAL (Desde Django) ---
  useEffect(() => {
    async function loadCatalog() {
      try {
        const response = await apiClient('/api/exercises/', { method: 'GET' }); // Tu endpoint GET
        const data = await response.json();
        setAllCatalogExercises(data); // Asumimos que Django devuelve la lista de Exercise
      } catch (error) {
        console.error("Error cargando catálogo:", error);
        alert("Error de conexión al cargar el catálogo.");
      }
    }
    loadCatalog();
  }, []); // Solo corre una vez al montar

  // --- HANDLERS: AGREGAR EXISTENTE AL TEMPLATE ---
  const handleAddExistingToTemplate = (exercise: Exercise) => {
    const newTemplateExercise: TemplateExercise = {
      id: `temp-${Date.now()}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscle_group: exercise.muscle_group,
      sets: 3,
      reps: 10,
      weight: 60,
      rpe: 8,
    };
    setExercisesInTemplate([...exercisesInTemplate, newTemplateExercise]);
  };

  // --- HANDLERS: CREAR Y AGREGAR NUEVO EJERCICIO ---
  
  // 1. Abrir el modal y guardar el grupo muscular destino
  const openNewExerciseModal = (muscle: string) => {
    setSelectedMuscleForAdd(muscle);
    setNewExerciseName('');
    setIsAddModalOpen(true);
  };

  // 2. Cerrar el modal
  const closeNewExerciseModal = () => {
    setIsAddModalOpen(false);
    setSelectedMuscleForAdd(null);
  };

  // 3. La función crítica: Llama a Django POST
  const handleAddNewExercise = async () => {
    if (!newExerciseName.trim() || !selectedMuscleForAdd) return;
    
    setIsCreatingExercise(true); // Encendemos el loading

    try {
      // LLAMADA A TU BACKEND (DJANGO)
      const response = await apiClient('/api/exercises/', {
        method: 'POST',
        body: JSON.stringify({
          name: newExerciseName.trim(),
          muscle_group: selectedMuscleForAdd, // Mismo formato que Django
          equipment: 'Variado', // Valor por defecto para el MVP
          description: `Ejercicio creado por el usuario en FITMO.`
        }),
      });

      const newExerciseFromDB = await response.json();

      if (response.ok) {
        // A) Actualizamos el catálogo local para que aparezca en el accordion
        setAllCatalogExercises([...allCatalogExercises, newExerciseFromDB]);

        // B) Lo agregamos automáticamente al template para que el usuario no tenga que buscarlo
        handleAddExistingToTemplate(newExerciseFromDB);

        // C) Cerramos el modal
        closeNewExerciseModal();
      } else {
        alert("Error al crear el ejercicio: " + (newExerciseFromDB.error || "Desconocido"));
      }
    } catch (error) {
      console.error("Error en la petición POST:", error);
      alert("Error de conexión al servidor Django.");
    } finally {
      setIsCreatingExercise(false); // Apagamos el loading
    }
  };

  // --- HANDLERS: MODIFICAR / ELIMINAR DEL TEMPLATE ---
  const handleRemoveFromTemplate = (id: string) => {
    setExercisesInTemplate(exercisesInTemplate.filter((ex) => ex.id !== id));
  };

  const updateSetParam = (id: string, param: 'sets' | 'reps' | 'weight' | 'rpe', value: number | null) => {
    setExercisesInTemplate(exercisesInTemplate.map(ex => 
      ex.id === id ? { ...ex,: value } : ex
    ));
  };

  const saveTemplate = () => {
    // Aquí iría tu lógica para hacer el POST a /api/templates/
    console.log("Guardando template:", { name: templateName, exercises: exercisesInTemplate });
    alert(`Template "${templateName}" guardado localmente (simulación).`);
  };

  // --- RENDERING: FILTRAR CATÁLOGO ---
  const exercisesInCatalogByMuscle = (muscle: string) => {
    return allCatalogExercises.filter(ex => ex.muscle_group === muscle);
  };

  return (
    <main className="min-h-screen bg-[#050505] text-slate-200 font-sans relative selection:bg-violet-500/30">
      
      {/* --- MODAL "AGREGAR NUEVO EJERCICIO" (Overlay) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[2rem] shadow-2xl w-full max-w-md space-y-6 transform animate-in fade-in zoom-in duration-300">
            
            <div className="flex items-center gap-4 text-violet-400">
              <BookOpen size={24} />
              <h3 className="text-xl font-black italic uppercase text-white tracking-tight">Expandir Catálogo</h3>
            </div>

            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Crea un nuevo ejercicio para el grupo <span className="text-white font-bold">{selectedMuscleForAdd}</span>. Este ejercicio estará disponible para tus futuras rutinas.
            </p>

            <input
              type="text"
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              placeholder="Ej: Press Francés con Mancuerna"
              className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white placeholder:text-slate-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-semibold"
            />

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={closeNewExerciseModal}
                className="flex-1 bg-white/5 hover:bg-white/10 p-4 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNewExercise}
                disabled={!newExerciseName.trim() || isCreatingExercise}
                className="flex-1 bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/50 p-4 rounded-xl font-bold text-xs uppercase tracking-widest text-white transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isCreatingExercise ? 'Guardando...' : '➕ Crear Ejercicio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- NAVEGACIÓN PRINCIPAL --- */}
      <nav className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-[11px] font-black uppercase tracking-widest">
            <ArrowLeft size={16} /> Volver
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-violet-500/10 border border-violet-500/20 text-violet-400 p-2.5 rounded-full"><Target size={18} /></div>
            <h1 className="text-2xl font-black italic tracking-tighter text-white">CREAR TEMPLATE</h1>
          </div>
          <button onClick={saveTemplate} className="bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest text-white hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            Guardar Rutina
          </button>
        </div>
      </nav>

      {/* --- LAYOUT DE 2 COLUMNAS --- */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-12 items-start">

        {/* --- COLUMNA IZQUIERDA: EL TEMPLATE (Lista de Series) --- */}
        <section className="space-y-8">
          {/* Header del Template */}
          <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 shadow-inner">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="text-3xl font-black italic uppercase tracking-tighter bg-transparent text-white w-full focus:outline-none focus:ring-0 p-0 border-none"
            />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">{exercisesInTemplate.length} ejercicios agregados</p>
          </div>

          {/* Lista de Ejercicios en el Template */}
          {exercisesInTemplate.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl bg-[#0a0a0a]">
              <Target size={48} className="text-slate-700 mx-auto mb-6" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Usa el buscador de la derecha ➡️</p>
              <p className="text-slate-600 text-[11px] mt-1">O crea uno nuevo si no lo encuentras.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {exercisesInTemplate.map((ex, index) => (
                <div key={ex.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl group shadow-inner">
                  
                  {/* Fila de Título y Eliminar */}
                  <div className="flex items-center justify-between mb-5 pb-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-full">{index + 1}</span>
                      <h4 className="text-lg font-black text-white">{ex.exerciseName}</h4>
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full">{ex.muscle_group}</span>
                    </div>
                    <button onClick={() => handleRemoveFromTemplate(ex.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Fila de Inputs (Sets, Reps, Weight, RPE) */}
                  <div className="grid grid-cols-4 gap-4 bg-white/5 p-4 rounded-xl">
                    {.map(input => (
                        <div key={input.label} className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">{input.label}</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={input.value || ''}
                              onChange={(e) => updateSetParam(ex.id, input.param, e.target.value === '' ? null : Number(e.target.value))}
                              placeholder="-"
                              className="w-full bg-[#050505] border border-white/5 text-center p-3 rounded-lg text-white font-black text-sm focus:ring-violet-500 focus:border-violet-500 transition-all placeholder:text-slate-700"
                            />
                            {input.value && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-600">{input.unit}</span>}
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* --- COLUMNA DERECHA: EL BUSCADOR / CATÁLOGO (Sticky) --- */}
        <aside className="bg-[#0a0a0a] p-6 rounded-3xl border border-white/5 space-y-8 sticky top-28 lg:h-[calc(100vh-140px)] flex flex-col shadow-inner">
          
          <div className="flex items-center gap-3 text-cyan-400">
            <Search size={20} />
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Catálogo de ejercicios</h3>
          </div>

          <p className="text-slate-500 text-[11px] font-medium leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
            Selecciona un grupo muscular para ver los ejercicios disponibles. Si el tuyo no aparece, ¡crealo al instante!
          </p>

          {/* Lista de Accordions de Grupos Musculares */}
          <div className="space-y-3 flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/5">
            {muscleGroups.map(muscle => (
              <div key={muscle} className="bg-[#050505] border border-white/5 rounded-2xl overflow-hidden group">
                
                {/* Header del Accordion */}
                <button 
                  onClick={() => setActiveMuscleGroup(activeMuscleGroup === muscle ? null : muscle)}
                  className="w-full flex items-center justify-between p-5 text-left group-hover:bg-white/5 transition-colors"
                >
                  <span className={`text-xs font-bold uppercase tracking-widest ${activeMuscleGroup === muscle ? 'text-cyan-400' : 'text-slate-300'}`}>
                    {muscle}
                  </span>
                  <Zap size={16} className={`${activeMuscleGroup === muscle ? 'text-cyan-400' : 'text-slate-700'} transition-colors`} />
                </button>

                {/* Contenido Expandido: Lista de Ejercicios */}
                {activeMuscleGroup === muscle && (
                  <div className="px-5 pb-5 pt-1 space-y-4 animate-in slide-in-from-top-1 duration-200">
                    
                    {/* --- EL BOTÓN MÁGICO PARA MVPs --- */}
                    <button 
                      onClick={() => openNewExerciseModal(muscle)} // Abrimos modal con el grupo actual
                      className="w-full flex items-center gap-3 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 p-3.5 rounded-xl transition-colors group/new"
                    >
                      <Plus size={16} className="text-violet-400 shrink-0" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white group-hover/new:text-violet-200">
                        ➕ Nuevo Ejercicio <span className='text-slate-500'> en {muscle}</span>
                      </span>
                    </button>

                    <p className="text-[10px] text-slate-600 uppercase tracking-widest font-black pt-2 pb-1 pl-1">Ejercicios Existentes ({exercisesInCatalogByMuscle(muscle).length})</p>

                    {/* Lista de ejercicios filtrada */}
                    {exercisesInCatalogByMuscle(muscle).length === 0 ? (
                      <p className='text-slate-700 text-[10px] text-center pt-3 italic'>No hay ejercicios para {muscle} aún.</p>
                    ) : (
                      exercisesInCatalogByMuscle(muscle).map(catalogEx => (
                        <div key={catalogEx.id} className="flex items-center justify-between bg-[#0a0a0a] p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                          <span className="text-sm font-semibold text-slate-200">{catalogEx.name}</span>
                          <button 
                            onClick={() => handleAddExistingToTemplate(catalogEx)}
                            className="text-cyan-600 hover:text-cyan-400 bg-cyan-400/5 p-1.5 rounded-md"
                            title='Agregar al template'
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

        </aside>
      </div>
    </main>
  );
}