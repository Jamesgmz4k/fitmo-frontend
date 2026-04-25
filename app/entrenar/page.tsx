'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { apiClient } from '../../lib/apiClient';
import { useSession, signOut } from 'next-auth/react';
import { Activity, BrainCircuit, Plus, Dumbbell, Play, X, Edit3, Trash2, CheckCircle2, ChevronLeft, Check, Timer, Trophy, Info, ArrowRight, Utensils } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import posthog from 'posthog-js';

const DEFAULT_CATALOG: Record<string, string[]> = {
  "Pecho": ["Press inclinado", "Press recto", "Peck flys maquina", "Peckdeck cable", "Press inclinado con mancuernas"],
  "Triceps": ["Jalón con polea barra recta", "Overhead extensions barra recta", "Press de triceps", "Skullcrushers", "Jalon con polea unilateral", "Fondos"],
  "Bicep": ["Curl mancuernas", "Curl barra z", "Martillos", "Curl en polea barra recta", "Curl en maquina", "Curl predicador", "Curl concentrado", "Bayessian", "Curl en banco inclinado con mancuernas", "Spider curl"],
  "Espalda": ["Remo en smith", "Remo sentado en maquina", "Remo con triquete abierto", "Pulldown agarre abierto", "Pulldown vertical", "Pullover con barra recta", "Pulldown agarre V", "Dominadas abiertas", "Dominadas cerradas", "Pulldown agarre neutro"],
  "Pierna": ["Sentadilla regular", "Sentadilla cerrada", "Abductor abrir", "Abductor cerrar", "Desplantes en smith", "Curl de cuadricep en maquina", "Femoral acostado", "Femoral sentado", "Hip trust", "Prensa"],
  "Abdomen": ["Crunches banco inclinado", "Twist ruso", "Aplastamiento de abdomen", "Elevaciones de piernas", "Plancha"],
  "Hombro": ["Press militar", "Laterales", "Frontales"]
};

export default function EntrenarPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [catalog, setCatalog] = useState<Record<string, string[]>>(DEFAULT_CATALOG);

  // NUEVO: Estado del tutorial
  const [showTutorial, setShowTutorial] = useState(false);

  const [showAddEx, setShowAddEx] = useState(false);
  const [newExCat, setNewExCat] = useState('');
  const [newExName, setNewExName] = useState('');
  const [isSavingEx, setIsSavingEx] = useState(false);

  const [templates, setTemplates] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);

  const [isBuilding, setIsBuilding] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [builderExercises, setBuilderExercises] = useState([{ id: Date.now(), category: '', name: '', sets: 3, reps: '10', rest_time: 90 }]);
  const [isPro, setIsPro] = useState(false);
  const [hasNutritionPlan, setHasNutritionPlan] = useState(false);

  const [activeTemplate, setActiveTemplate] = useState<any>(null);
  const [workoutData, setWorkoutData] = useState<Record<number, { weights: string[], reps: string[], completed: boolean[], previous: any }>>({});
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeTimer, setActiveTimer] = useState<{ exerciseIdx: number, setIdx: number, timeLeft: number, totalTime: number, endTime: number } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showLiveAdd, setShowLiveAdd] = useState(false);
  const [liveAddCat, setLiveAddCat] = useState('');
  const [liveAddName, setLiveAddName] = useState('');

  // 🚀 MAGIA 6: Lógica para Eliminar y Agregar sobre la marcha
  const addLiveExercise = () => {
    if (!liveAddCat || !liveAddName) return;

    // 1. Creamos el ejercicio temporal
    const newEx = {
      id: Date.now(),
      category: liveAddCat,
      exercise_name: liveAddName,
      target_sets: 3,
      target_reps: '10',
      rest_time: 90
    };

    // 2. Lo empujamos a la copia del template activo
    const updatedTemplate = { ...activeTemplate };
    updatedTemplate.exercises.push(newEx);
    setActiveTemplate(updatedTemplate);

    // 3. Le creamos su espacio en la data del workout (para que tenga inputs)
    const newIdx = updatedTemplate.exercises.length - 1;
    const prevData = getLastPerformance(liveAddName);

    const newData = { ...workoutData };
    newData[newIdx] = {
      weights: ['', '', ''],
      reps: ['10', '10', '10'],
      completed: [false, false, false],
      previous: prevData
    };
    setWorkoutData(newData);

    // 4. Limpiamos la UI
    setShowLiveAdd(false);
    setLiveAddCat('');
    setLiveAddName('');
  };

  const removeLiveExercise = (idxToRemove: number) => {
    if (!confirm("¿Quitar este ejercicio de la sesión actual?")) return;

    const updatedTemplate = { ...activeTemplate };
    updatedTemplate.exercises.splice(idxToRemove, 1);
    setActiveTemplate(updatedTemplate);

    // Reacomodamos los índices de los inputs para que no se desfase la data
    const newData: Record<number, any> = {};
    updatedTemplate.exercises.forEach((ex: any, i: number) => {
      if (i < idxToRemove) {
        newData[i] = workoutData[i];
      } else {
        newData[i] = workoutData[i + 1];
      }
    });
    setWorkoutData(newData);
  };



  // EFECTO DE LECTURA DE TUTORIAL EN LA URL (Método seguro para Vercel)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tutorial') === 'true') {
        setShowTutorial(true);
        // Opcional: limpiar la URL para que no vuelva a salir si recargan
        window.history.replaceState(null, '', '/entrenar');
      }
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer && activeTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setActiveTimer(prev => {
          if (!prev) return null;
          const newTimeLeft = Math.max(0, Math.ceil((prev.endTime - Date.now()) / 1000));
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
    } else if (activeTimer && activeTimer.timeLeft === 0) {

      // 🚀 ¡TIEMPO AGOTADO! Disparar alarmas
      if (audioRef.current) {
        audioRef.current.currentTime = 0; // Aseguramos que inicie desde el principio
        audioRef.current.play().catch(e => console.error("Error reproduciendo campana:", e));
      }

      // Intentamos disparar la vibración (Patrón: vibra 500ms, pausa 200ms, vibra 500ms)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([500, 200, 500]);
      }

      setActiveTimer(null);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const fetchData = async () => {
    if (!userId) return;
    try {
      const resTemplates = await apiClient(`/api/templates/?user_id=${userId}`);
      if (resTemplates.ok) setTemplates(await resTemplates.json());

      const resPrediction = await apiClient(`/api/predict-workout/?user_id=${userId}`);
      if (resPrediction.ok) setPrediction(await resPrediction.json());

      const resWorkouts = await apiClient('/api/workouts/');
      if (resWorkouts.ok) setWorkouts(await resWorkouts.json());

      const resProfile = await apiClient(`/api/profile/?user_id=${userId}`);
      if (resProfile.ok) {
        const profileData = await resProfile.json();
        setIsPro(profileData.is_pro);

        try {

          const resNutrition = await apiClient(`/api/nutrition/?user_id=${userId}`);
          if (resNutrition.ok) {
            const nutData = await resNutrition.json();
            // Si el backend devuelve un array con datos o un objeto válido, ocultamos la tarjeta
            if (nutData && (nutData.length > 0 || nutData.id)) {
              setHasNutritionPlan(true);
            }
          }
        } catch (error) {
          console.error("No se pudo verificar la nutrición:", error);
        }
      }

      const resEx = await apiClient(`/api/exercises/`);
      if (resEx.ok) {
        const customEx = await resEx.json();
        const mergedCatalog = JSON.parse(JSON.stringify(DEFAULT_CATALOG));

        customEx.forEach((ex: any) => {
          const cat = ex.category || ex.muscle_group;
          if (cat) {
            if (!mergedCatalog[cat]) mergedCatalog[cat] = [];
            if (!mergedCatalog[cat].includes(ex.name)) {
              mergedCatalog[cat].push(ex.name);
            }
          }
        });
        setCatalog(mergedCatalog);
      }

    } catch (error) { console.error("Error cargando:", error); }
  };

  useEffect(() => { fetchData(); }, [userId]);

  const handleAddNewExercise = async () => {
    if (!newExCat || !newExName.trim()) return;
    setIsSavingEx(true);
    try {
      const res = await apiClient('/api/exercises/', {
        method: 'POST',
        body: JSON.stringify({ category: newExCat, name: newExName.trim() })
      });

      if (res.ok) {
        posthog.capture('custom_exercise_added', { category: newExCat, name: newExName.trim() });
        setCatalog(prev => {
          const next = { ...prev };
          if (!next[newExCat]) next[newExCat] = [];
          next[newExCat].push(newExName.trim());
          return next;
        });
        setShowAddEx(false);
        setNewExName('');
        setNewExCat('');
      } else {
        alert("Error al guardar el ejercicio.");
      }
    } catch (e) {
      posthog.captureException(e);
      console.error(e);
      alert("Error de conexión.");
    } finally {
      setIsSavingEx(false);
    }
  };

  const getLastPerformance = (exerciseName: string) => {
    const userLogs = workouts.filter(w => w.user?.toString() === userId?.toString() && w.title.includes(exerciseName));
    if (userLogs.length === 0) return null;

    userLogs.sort((a, b) => b.id - a.id);
    const last = userLogs[0];

    const weightMatch = last.title.match(/(\d+(?:\.\d+)?)\s*(kg|lbs)/i);
    const w = weightMatch ? parseFloat(weightMatch[1]) : 0;
    const recordUnit = weightMatch ? weightMatch[2].toLowerCase() : 'kg';

    const repsMatch = last.title.match(/Reps:\s*(.+)/);
    const reps = repsMatch ? repsMatch[1].split(',').map((r: string) => parseInt(r.trim())) : [];

    return { weight: w, reps, recordUnit };
  };

  const handleSaveTemplate = async () => {
    if (!templateName || builderExercises.some(e => !e.name || !e.category)) {
      alert("Por favor completa el nombre de la rutina y selecciona todos los ejercicios.");
      return;
    }
    try {
      const payload = {
        user_id: userId,
        name: templateName,
        exercises: builderExercises.map(e => ({
          category: e.category, name: e.name, target_sets: e.sets, target_reps: e.reps, rest_time: e.rest_time
        }))
      };

      const url = editingTemplateId ? `/api/templates/${editingTemplateId}/` : '/api/templates/';
      const res = await apiClient(url, {
        method: editingTemplateId ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        posthog.capture(editingTemplateId ? 'workout_template_updated' : 'workout_template_created', {
          template_name: templateName,
          exercise_count: builderExercises.length,
        });
        setIsBuilding(false); setEditingTemplateId(null); setTemplateName('');
        setBuilderExercises([{ id: Date.now(), category: '', name: '', sets: 3, reps: '10', rest_time: 90 }]);
        fetchData();
      }
    } catch (error) { console.error("Error guardando:", error); }
  };

  const handleEditInit = (template: any) => {
    setTemplateName(template.name);
    setBuilderExercises(template.exercises.map((ex: any, idx: number) => ({
      id: Date.now() + idx, category: ex.category, name: ex.exercise_name, sets: ex.target_sets, reps: ex.target_reps, rest_time: ex.rest_time || 90
    })));
    setEditingTemplateId(template.id); setIsBuilding(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar esta rutina?")) return;
    const res = await apiClient(`/api/templates/${id}/`, { method: 'DELETE' });
    if (res.ok) {
      posthog.capture('workout_template_deleted', { template_id: id });
      fetchData();
    }
  };

  const startWorkout = (template: any) => {
    posthog.capture('workout_session_started', {
      template_name: template.name,
      exercise_count: template.exercises.length,
    });
    setActiveTemplate(template);
    const initialData: Record<number, any> = {};

    template.exercises.forEach((ex: any, idx: number) => {
      const prevData = getLastPerformance(ex.exercise_name);

      initialData[idx] = {
        weights: Array(ex.target_sets).fill(''),
        reps: Array(ex.target_sets).fill(ex.target_reps),
        completed: Array(ex.target_sets).fill(false),
        previous: prevData
      };
    });
    setWorkoutData(initialData);
    setActiveTimer(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSetComplete = (exIdx: number, setIdx: number, restTime: number) => {
    const newData = { ...workoutData };
    const isNowCompleted = !newData[exIdx].completed[setIdx];
    newData[exIdx].completed[setIdx] = isNowCompleted;
    setWorkoutData(newData);

    if (isNowCompleted) {
      const exactEndTime = Date.now() + (restTime * 1000);
      setActiveTimer({ exerciseIdx: exIdx, setIdx: setIdx, timeLeft: restTime, totalTime: restTime, endTime: exactEndTime });

      // 🚀 EL HACK DE IOS: Desbloqueamos el audio en el evento de clic del usuario
      if (audioRef.current) {
        audioRef.current.muted = true; // Lo silenciamos para que no suene de golpe
        audioRef.current.play().then(() => {
          audioRef.current!.pause();      // Lo pausamos inmediatamente
          audioRef.current!.currentTime = 0; // Lo regresamos al segundo cero
          audioRef.current!.muted = false; // Le quitamos el mute para cuando sea hora de sonar
        }).catch(e => console.log("Audio unlock prevenido:", e));
      }

    } else {
      if (activeTimer?.exerciseIdx === exIdx && activeTimer?.setIdx === setIdx) {
        setActiveTimer(null);
      }
    }


  };

  const finishWorkout = async () => {
    setIsSavingWorkout(true);
    let hasNewRecord = false;

    try {
      for (let i = 0; i < activeTemplate.exercises.length; i++) {
        const ex = activeTemplate.exercises[i];
        const data = workoutData[i];

        const validSets = data.completed.map((isDone: boolean, idx: number) => isDone ? { weight: parseFloat(data.weights[idx]) || 0, rep: data.reps[idx] } : null).filter(Boolean) as { weight: number, rep: string }[];

        if (validSets.length === 0) continue;

        const currentMaxWeight = Math.max(...validSets.map(s => s.weight));
        const currentTotalReps = validSets.reduce((acc, s) => acc + parseInt(s.rep), 0);

        let finalWeight = currentMaxWeight;

        if (data.previous) {
          const prevTotalReps = data.previous.reps.reduce((a: number, b: number) => a + b, 0);
          // Cambiamos weightInKg por finalWeight
          if (finalWeight > data.previous.weight || (finalWeight === data.previous.weight && currentTotalReps > prevTotalReps)) {
            hasNewRecord = true;
          }
        }

        const repsString = validSets.map(s => s.rep).join(', ');
        // ACTUALIZAMOS EL TÍTULO PARA QUE MUESTRE KG o LBS DINÁMICAMENTE
        const fullTitle = `${ex.category}: ${ex.exercise_name} | ${finalWeight}${unit} | Reps: ${repsString}`;

        const res = await apiClient('/api/workouts/', {
          method: 'POST',
          body: JSON.stringify({
            title: fullTitle,
            user: parseInt(userId),
            user_id: parseInt(userId),
            weight: finalWeight, // Enviamos el peso intacto
            unit: unit,          // 👇 ENVIAMOS LA UNIDAD 👇
            reps: currentTotalReps
          })
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error("❌ Django rechazó el registro:", errorData);
          alert("Error al guardar en la base de datos. Revisa la consola del navegador.");
        }
      }

      posthog.capture('workout_session_completed', {
        template_name: activeTemplate.name,
        exercise_count: activeTemplate.exercises.length,
        had_new_record: hasNewRecord,
      });

      if (hasNewRecord) {
        posthog.capture('personal_record_achieved', { template_name: activeTemplate.name });
        confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 }, colors: ['#8b5cf6', '#22d3ee', '#10b981'] });
        setShowSuccessModal(true);
      } else {
        setActiveTemplate(null);
        fetchData();
      }

    } catch (error) {
      posthog.captureException(error);
      console.error("Error de red guardando sesión:", error);
    } finally {
      setIsSavingWorkout(false);
    }
  };

  if (activeTemplate) {
    return (
      <DashboardLayout userName={session?.user?.name}>
        <audio ref={audioRef} src="/bell.mp3" preload="auto" />
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/90 backdrop-blur-sm p-4">
            <div className="bg-[#0a0a0a] border border-cyan-500/30 p-10 rounded-[3rem] text-center max-w-sm shadow-[0_0_80px_rgba(34,211,238,0.2)] animate-in zoom-in-95">
              <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-cyan-500/20">
                <Trophy size={48} className="text-cyan-400" />
              </div>
              <h2 className="text-3xl font-black italic text-white mb-2 uppercase tracking-tighter">¡Felicidades!</h2>
              <p className="text-slate-400 text-sm mb-8 font-medium leading-relaxed">
                ¡Tu fuerza aumentó! Has superado tu marca anterior. Sigue aplicando sobrecarga progresiva.
              </p>
              <button
                onClick={() => { setShowSuccessModal(false); setActiveTemplate(null); fetchData(); }}
                className="w-full bg-linear-to-r from-violet-600 to-cyan-600 hover:scale-105 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        <div className="p-4 md:p-10 font-sans text-slate-200 min-h-screen">
          <div className="max-w-3xl mx-auto space-y-6">

            <div className="flex items-center justify-between">
              <button onClick={() => setActiveTemplate(null)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
                <ChevronLeft size={16} /> Abandonar Sesión
              </button>

              <select
                className="bg-[#050505] border border-white/10 px-4 py-2 rounded-xl text-xs font-black text-cyan-400 uppercase outline-none cursor-pointer"
                value={unit} onChange={(e) => setUnit(e.target.value as 'kg' | 'lbs')}
              >
                <option value="kg">Kilos (KG)</option>
                <option value="lbs">Libras (LBS)</option>
              </select>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 px-6 py-8 rounded-4xl shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-2 text-cyan-400 mb-2">
                <Timer size={16} className={activeTimer ? "animate-pulse" : ""} />
                <span className="text-[10px] font-black uppercase tracking-widest">{activeTimer ? 'Descansando...' : 'Sesión Activa'}</span>
              </div>
              <h1 className="text-3xl font-black italic text-white tracking-tighter">{activeTemplate.name}</h1>
            </div>

            <div className="space-y-6">
              {activeTemplate.exercises.map((ex: any, idx: number) => (
                <div key={ex.id} className="bg-[#050505] border border-white/5 p-4 md:p-6 rounded-4xl shadow-lg">
                  <div className="mb-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-black italic text-cyan-400 uppercase">{ex.exercise_name}</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{ex.category}</p>
                    </div>
                    <button
                      onClick={() => removeLiveExercise(idx)}
                      className="text-slate-600 hover:text-red-500 bg-white/5 p-2 rounded-xl transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">
                    <div className="w-8 text-center">Set</div>
                    <div className="flex-1 text-center ">Anterior</div>
                    <div className="w-16 text-center">{unit}</div>
                    <div className="w-16 text-center">Reps</div>
                    <div className="w-10 text-center"><Check size={14} className="mx-auto" /></div>
                  </div>

                  <div className="space-y-2">
                    {workoutData[idx]?.weights.map((_, setIdx) => {
                      const isCompleted = workoutData[idx].completed[setIdx];
                      const isTimerActive = activeTimer?.exerciseIdx === idx && activeTimer?.setIdx === setIdx;

                      const prevLog = workoutData[idx].previous;
                      const prevText = (prevLog && prevLog.reps[setIdx]) ? `${prevLog.weight}${prevLog.recordUnit} x ${prevLog.reps[setIdx]}` : '-';

                      return (
                        <div key={setIdx}>
                          <div className={`flex items-center justify-between p-2 rounded-xl border transition-all ${isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}>

                            <div className="w-8 text-center font-black text-slate-400 text-sm">
                              {setIdx + 1}
                            </div>

                            <div className="flex-1 text-center text-slate-400 text-xs font-black tracking-widest select-none">
                              {prevText}
                            </div>

                            <input
                              type="number"
                              placeholder="0"
                              value={workoutData[idx].weights[setIdx]}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newData = { ...workoutData };
                                newData[idx].weights[setIdx] = val;

                                // 🚀 MAGIA 5: Autocompletado en cascada
                                // Si cambias un peso, replicamos el valor hacia abajo en los sets que faltan
                                for (let i = setIdx + 1; i < newData[idx].weights.length; i++) {
                                  if (!newData[idx].completed[i]) {
                                    newData[idx].weights[i] = val;
                                  }
                                }
                                setWorkoutData(newData);
                              }}
                              className={`w-16 p-2 rounded-lg text-center font-black outline-none transition-colors ${isCompleted ? 'bg-transparent text-emerald-400' : 'bg-[#0a0a0a] text-white focus:border-cyan-500 border border-white/10'}`}
                              disabled={isCompleted}
                            />

                            <input
                              type="number"
                              value={workoutData[idx].reps[setIdx]}
                              onChange={(e) => {
                                const newData = { ...workoutData };
                                newData[idx].reps[setIdx] = e.target.value;
                                setWorkoutData(newData);
                              }}
                              className={`w-16 p-2 rounded-lg text-center font-black outline-none transition-colors ${isCompleted ? 'bg-transparent text-emerald-400' : 'bg-[#0a0a0a] text-white focus:border-cyan-500 border border-white/10'}`}
                              disabled={isCompleted}
                            />

                            <div className="w-10 flex justify-center">
                              <button
                                onClick={() => toggleSetComplete(idx, setIdx, ex.rest_time || 90)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isCompleted ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white'}`}
                              >
                                <Check size={16} strokeWidth={4} />
                              </button>
                            </div>

                          </div>

                          {isTimerActive && (
                            <div className="mt-2 h-10 w-full bg-[#0a0a0a] rounded-xl border border-cyan-500/20 relative overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                              <div
                                className="absolute left-0 top-0 h-full bg-cyan-500/80 transition-all duration-1000 ease-linear"
                                style={{ width: `${(activeTimer.timeLeft / activeTimer.totalTime) * 100}%` }}
                              ></div>
                              <span className="relative z-10 font-black text-white text-sm tracking-widest">{formatTime(activeTimer.timeLeft)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      const newData = { ...workoutData };
                      newData[idx].weights.push('');
                      newData[idx].reps.push(ex.target_reps);
                      newData[idx].completed.push(false);
                      setWorkoutData(newData);
                    }}
                    className="mt-4 w-full py-3 bg-white/2 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors"
                  >
                    + Añadir Serie
                  </button>

                </div>
              ))}
            </div>
          </div>

          {/* 🚀 MAGIA 6: UI para agregar ejercicio extra a la sesión activa */}
          {!showLiveAdd ? (
            <button
              onClick={() => setShowLiveAdd(true)}
              className="w-full py-4 border border-dashed border-white/10 rounded-4xl text-[10px] font-black text-slate-500 hover:text-cyan-400 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mb-6"
            >
              <Plus size={16} /> Agregar Ejercicio Extra
            </button>
          ) : (
            <div className="bg-[#0a0a0a] border border-cyan-500/20 p-5 rounded-4xl shadow-lg mb-6 animate-in slide-in-from-top-4">
              <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-4">Añadir Ejercicio a la rutina</h4>
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <select
                  className="w-full md:w-1/2 bg-[#050505] p-3 rounded-xl border border-white/10 text-xs text-slate-300 font-bold outline-none"
                  value={liveAddCat}
                  onChange={(e) => { setLiveAddCat(e.target.value); setLiveAddName(''); }}
                >
                  <option value="">Músculo</option>
                  {Object.keys(catalog).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select
                  className="w-full md:w-1/2 bg-[#050505] p-3 rounded-xl border border-white/10 text-xs text-slate-300 font-bold outline-none disabled:opacity-50"
                  value={liveAddName}
                  onChange={(e) => setLiveAddName(e.target.value)}
                  disabled={!liveAddCat}
                >
                  <option value="">Ejercicio</option>
                  {liveAddCat && Array.from(new Set(catalog[liveAddCat] || [])).map((n, i) => <option key={`${n}-${i}`} value={n}>{n}</option>)}
                </select>
              </div>

              {/* 🚀 NUEVO: Crear ejercicio sobre la marcha */}
              <div className="pt-4 border-t border-white/5 mb-4">
                {!showAddEx ? (
                  <button
                    onClick={() => setShowAddEx(true)}
                    className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 px-4 py-3 rounded-xl border border-cyan-500/20"
                  >
                    <Plus size={14} /> ¿No está en la lista? Crear Ejercicio Nuevo
                  </button>
                ) : (
                  <div className="bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center animate-in fade-in zoom-in duration-200">
                    <select
                      className="w-full md:w-1/3 bg-[#050505] p-3 rounded-xl border border-white/10 text-xs text-slate-300 font-bold outline-none"
                      value={newExCat}
                      onChange={e => setNewExCat(e.target.value)}
                    >
                      <option value="">Músculo</option>
                      {Object.keys(catalog).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input
                      type="text"
                      placeholder="Nombre (Ej. Muscle Up)"
                      className="w-full md:w-1/3 bg-[#050505] p-3 rounded-xl border border-white/10 text-xs text-white font-bold outline-none"
                      value={newExName}
                      onChange={e => setNewExName(e.target.value)}
                    />
                    <div className="flex gap-2 w-full md:w-auto flex-1">
                      <button
                        onClick={async () => {
                          const cat = newExCat;
                          const name = newExName;
                          await handleAddNewExercise(); // Guarda en BD
                          setLiveAddCat(cat); // Lo auto-selecciona
                          setLiveAddName(name); // Lo auto-selecciona
                        }}
                        disabled={isSavingEx || !newExCat || !newExName}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl disabled:opacity-50 transition-colors"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setShowAddEx(false)}
                        className="px-4 bg-white/5 hover:bg-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={addLiveExercise} disabled={!liveAddCat || !liveAddName} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl disabled:opacity-50 transition-colors">Agregar a la Sesión</button>
                <button onClick={() => setShowLiveAdd(false)} className="px-4 bg-white/5 hover:bg-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-colors">Cancelar</button>
              </div>
            </div>
          )}

          <button
            onClick={finishWorkout}
            disabled={isSavingWorkout}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white p-6 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(34,211,238,0.2)] flex justify-center items-center gap-3 disabled:opacity-50"
          >
            {isSavingWorkout ? 'Procesando...' : <span><CheckCircle2 size={24} /> Finalizar Sesión</span>}
          </button>

        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userName={session?.user?.name}>

      {/* ---------------- MODAL DE TUTORIAL ---------------- */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/95 backdrop-blur-md p-4">
          <div className="bg-[#0a0a0a] border border-cyan-500/30 w-full max-w-md rounded-[2.5rem] shadow-[0_0_80px_rgba(34,211,238,0.15)] overflow-hidden animate-in zoom-in-95">

            <div className="p-8 text-center relative">
              <button onClick={() => setShowTutorial(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white bg-white/5 p-2 rounded-full transition-colors">
                <X size={16} />
              </button>

              <div className="bg-cyan-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyan-500/20">
                <Info size={32} className="text-cyan-400" />
              </div>

              <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-4">¿Cómo entrenar en Fitmo?</h2>

              <div className="space-y-4 text-left">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-cyan-400 font-black text-xs uppercase tracking-widest block mb-1">Paso 1: Crea un Template</span>
                  <p className="text-slate-400 text-xs font-medium">Añade un título (Ej: "Día de Pecho") y selecciona los ejercicios que harás. Esto crea una plantilla base.</p>
                </div>

                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-violet-400 font-black text-xs uppercase tracking-widest block mb-1">Paso 2: Registra tus series</span>
                  <p className="text-slate-400 text-xs font-medium">Usa tu plantilla para anotar los pesos y repeticiones de hoy. ¡Asegúrate de aplicar sobrecarga progresiva!</p>
                </div>

                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-emerald-400 font-black text-xs uppercase tracking-widest block mb-1">Paso 3: Guarda en tu historial</span>
                  <p className="text-slate-400 text-xs font-medium">Al terminar, dale a guardar. Fitmo analizará tu volumen de hipertrofia y generará tu métrica de recuperación.</p>
                </div>
              </div>

              <button
                onClick={() => { setShowTutorial(false); setIsBuilding(true); }}
                className="w-full mt-8 bg-gradient-to-r from-violet-600 to-cyan-600 text-white p-4 rounded-full font-black text-[11px] tracking-widest uppercase hover:scale-105 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              >
                Entendido, ¡A Mutar!
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --------------------------------------------------- */}

      <div className="p-4 md:p-10 font-sans text-slate-200 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-10">
          <DashboardHeader userName={session?.user?.name} onSignOut={() => signOut()} />

          <div className="flex flex-col md:flex-row md:items-center justify-between bg-white/[0.02] p-6 rounded-3xl border border-white/5 shadow-xl gap-4">
            <div>
              <h1 className="text-2xl font-black italic uppercase text-white tracking-tighter flex items-center gap-2">
                Sesión <span className="text-cyan-500">de Entrenamiento</span> <Activity className="text-cyan-400" size={24} />
              </h1>
            </div>
            <button
              onClick={() => {
                if (!isPro && templates.length >= 3 && !isBuilding) {
                  alert("🔒 Límite de la cuenta Free alcanzado.\n\nActualmente tienes 3 templates guardados. Para crear rutinas ilimitadas y desbloquear el análisis avanzado, actualiza a Fitmo Pro.");
                  return;
                }

                setIsBuilding(!isBuilding);
                if (isBuilding) {
                  setEditingTemplateId(null);
                  setTemplateName('');
                  setBuilderExercises([{ id: Date.now(), category: '', name: '', sets: 3, reps: '10', rest_time: 90 }]);
                }
              }}
              className="bg-white/5 text-cyan-400 px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all border border-cyan-500/20 flex items-center justify-center gap-2 hover:bg-white/10"
            >
              {isBuilding ? <X size={16} /> : <Plus size={16} />}
              {isBuilding ? 'Cancelar' : 'Crear Rutina'}
            </button>
          </div>

          {isBuilding && (
            <div className="bg-[#0a0a0a] border border-cyan-500/30 p-6 md:p-8 rounded-[2.5rem] shadow-[0_0_40px_rgba(34,211,238,0.05)] animate-in slide-in-from-top-4">
              <input type="text" placeholder="Nombre de la Rutina (Ej. Día de Pecho y Triceps)" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-lg outline-none text-white font-black mb-6" />

              <div className="space-y-4 mb-6">
                {builderExercises.map((ex, idx) => (
                  <div key={ex.id} className="grid grid-cols-12 gap-3 items-center bg-white/[0.02] p-3 rounded-2xl border border-white/5 relative group">
                    {builderExercises.length > 1 && (<button onClick={() => setBuilderExercises(builderExercises.filter(e => e.id !== ex.id))} className="absolute -right-2 -top-2 bg-red-500/20 text-red-400 p-1.5 rounded-full border border-red-500/30 z-10 hover:bg-red-500 hover:text-white"><X size={12} /></button>)}

                    <div className="col-span-12 md:col-span-3">
                      <select className="w-full bg-[#050505] p-3 rounded-xl border border-white/10 text-xs text-slate-300 font-bold outline-none" value={ex.category} onChange={(e) => { const n = [...builderExercises]; n[idx].category = e.target.value; n[idx].name = ''; setBuilderExercises(n); }}>
                        <option value="">Músculo</option>
                        {Object.keys(catalog).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <select className="w-full bg-[#050505] p-3 rounded-xl border border-white/10 text-xs text-slate-300 font-bold outline-none disabled:opacity-50" value={ex.name} onChange={(e) => { const n = [...builderExercises]; n[idx].name = e.target.value; setBuilderExercises(n); }} disabled={!ex.category}>
                        <option value="">Ejercicio</option>
                        {ex.category && Array.from(new Set(catalog[ex.category])).map((n, idx) => <option key={`${n}-${idx}`} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <p className="text-[8px] text-slate-500 font-black uppercase text-center mb-1">Series</p>
                      <input type="number" value={ex.sets} onChange={(e) => { const n = [...builderExercises]; n[idx].sets = parseInt(e.target.value) || 0; setBuilderExercises(n); }} className="w-full bg-[#050505] p-2 rounded-xl border border-white/10 text-xs text-center text-white font-bold outline-none" />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <p className="text-[8px] text-slate-500 font-black uppercase text-center mb-1">Reps</p>
                      <input type="text" value={ex.reps} onChange={(e) => { const n = [...builderExercises]; n[idx].reps = e.target.value; setBuilderExercises(n); }} className="w-full bg-[#050505] p-2 rounded-xl border border-white/10 text-xs text-center text-white font-bold outline-none" />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <p className="text-[8px] text-cyan-500 font-black uppercase text-center mb-1">Descanso (s)</p>
                      <input type="number" placeholder="90" value={ex.rest_time} onChange={(e) => { const n = [...builderExercises]; n[idx].rest_time = parseInt(e.target.value) || 0; setBuilderExercises(n); }} className="w-full bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/20 text-xs text-center text-cyan-400 font-black outline-none" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button onClick={() => setBuilderExercises([...builderExercises, { id: Date.now(), category: '', name: '', sets: 3, reps: '10', rest_time: 90 }])} className="flex-1 py-4 border border-dashed border-white/10 rounded-2xl text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors">+ Serie / Ejercicio</button>
                <button onClick={handleSaveTemplate} className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-600 hover:scale-[1.02] transition-transform py-4 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg">{editingTemplateId ? 'Actualizar Rutina' : 'Guardar Rutina'}</button>
              </div>

              {/* ---------------- BOTÓN DE NUEVO EJERCICIO (NUEVA UBICACIÓN) ---------------- */}
              <div className="mt-8 pt-8 border-t border-white/5">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest text-center mb-4">
                  ¿No encuentras un ejercicio en la lista? Agrega tu ejercicio aquí
                </p>

                {!showAddEx ? (
                  <button
                    onClick={() => setShowAddEx(true)}
                    className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 px-4 py-3 rounded-xl border border-cyan-500/20"
                  >
                    <Plus size={14} /> Expandir Catálogo Global
                  </button>
                ) : (
                  <div className="bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center animate-in fade-in zoom-in duration-200">
                    <select
                      className="w-full md:w-1/3 bg-[#050505] p-3 rounded-xl border border-white/10 text-xs text-slate-300 font-bold outline-none"
                      value={newExCat}
                      onChange={e => setNewExCat(e.target.value)}
                    >
                      <option value="">Músculo</option>
                      {Object.keys(catalog).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input
                      type="text"
                      placeholder="Nombre (Ej. Muscle Up)"
                      className="w-full md:w-1/3 bg-[#050505] p-3 rounded-xl border border-white/10 text-xs text-white font-bold outline-none"
                      value={newExName}
                      onChange={e => setNewExName(e.target.value)}
                    />
                    <div className="flex gap-2 w-full md:w-auto flex-1">
                      <button
                        onClick={handleAddNewExercise}
                        disabled={isSavingEx || !newExCat || !newExName}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl disabled:opacity-50 transition-colors"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setShowAddEx(false)}
                        className="px-4 bg-white/5 hover:bg-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* ---------------------------------------------------------------------------- */}

            </div>
          )}

          {/* ---------------- EMBUDO DE RETENCIÓN ---------------- */}
          {!isBuilding && templates.length === 0 && (
            <div className="bg-[#050505] border border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl mx-auto mt-8 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

              <div className="w-14 h-14 bg-linear-to-br from-violet-600/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                <Info className="text-cyan-400" size={28} />
              </div>

              <h2 className="text-2xl font-black italic uppercase text-white tracking-tight mb-3">
                Bienvenido a Fitmo!
              </h2>
              <p className="text-slate-400 mb-8 text-sm md:text-base leading-relaxed">
                Crea tu primer template agregando tus ejercicios y nosotros nos encargamos de medir tu progreso. Aquí es donde ocurre la magia de la sobrecarga progresiva.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                  <Timer size={18} className="text-violet-400" />
                  Guía de Descansos (Timer)
                </h3>
                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span>Hipertrofia <span className="text-slate-500">(Aislados)</span></span>
                    <span className="font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md">90 s</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span>Hipertrofia <span className="text-slate-500">(Compuestos)</span></span>
                    <span className="font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md">120 - 180 s</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>Fuerza Pura</span>
                    <span className="font-bold text-violet-400 bg-violet-500/10 px-2 py-1 rounded-md">3 - 5+ min</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setIsBuilding(true)}
                className="w-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-lg shadow-violet-500/20"
              >
                Crear mi primer Template
                <ArrowRight size={20} />
              </button>
            </div>
          )}

          {!isBuilding && templates.length > 0 && (
            <div className="mb-8">
              {!hasNutritionPlan && (
                <div className="bg-gradient-to-r from-violet-900/30 to-cyan-900/30 border border-violet-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-white font-bold text-sm md:text-base mb-1 flex items-center gap-2">
                      <Utensils size={18} className="text-cyan-400" />
                      El entrenamiento es solo el 50%
                    </h3>
                    <p className="text-xs text-slate-400">
                      Ya tienes tu laboratorio listo. Ahora construye tu ingesta calórica para asegurar los gains.
                    </p>
                  </div>

                  <Link
                    href="/nutricion"
                    className="w-full md:w-auto bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-xl text-sm font-bold border border-white/10 transition-colors whitespace-nowrap text-center"
                  >
                    Configurar Nutrición
                  </Link>
                </div>
              )}

              {/* Mapeo normal de templates */}
              {templates.map(template => (
                <div key={template.id} className="bg-white/2 border border-white/5 p-6 rounded-3xl mb-6 relative group">
                  <div className="absolute top-6 right-6 flex gap-2">
                    <button onClick={() => handleEditInit(template)} className="p-2 text-slate-400 hover:text-cyan-400 bg-white/5 rounded-xl transition-colors"><Edit3 size={14} /></button>
                    <button onClick={() => handleDeleteTemplate(template.id)} className="p-2 text-slate-400 hover:text-red-400 bg-white/5 rounded-xl transition-colors"><Trash2 size={14} /></button>
                  </div>
                  <h4 className="text-xl font-black text-white italic mb-4">{template.name}</h4>
                  <div className="space-y-2 mb-6">
                    {template.exercises.map((ex: any) => (
                      <div key={ex.id} className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">{ex.exercise_name}</span>
                        <span className="text-slate-600 font-black">{ex.target_sets}x{ex.target_reps} • <span className="text-cyan-500">{ex.rest_time}s</span></span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => startWorkout(template)} className="w-full bg-[#0a0a0a] border border-white/5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 hover:bg-white/5">
                    <Play size={14} fill="currentColor" /> Iniciar Sesión
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* ------------------------------------------------------------- */}

        </div>
      </div>
    </DashboardLayout>
  );
}