
import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Circle, Sparkles, ChevronRight, ChevronDown, RotateCcw, Target, Layout, Edit3, Loader2 } from 'lucide-react';
import { generateMonthlyAgenda } from '../services/geminiService';
import { Language, MonthlyAgenda } from '../types';

interface StatsTabProps {
  language: Language;
}

const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export const StatsTab: React.FC<StatsTabProps> = ({ language }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [goals, setGoals] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agenda, setAgenda] = useState<MonthlyAgenda | null>(() => {
      const saved = localStorage.getItem('trapmind_agenda');
      return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState<'input' | 'agenda'>('input');
  
  // Persistence
  useEffect(() => {
    if (agenda) {
      localStorage.setItem('trapmind_agenda', JSON.stringify(agenda));
      // If we have an agenda for the selected month, show it by default
      if (agenda.month === (language === 'pt' ? MONTHS_PT : MONTHS_EN)[selectedMonth]) {
          setView('agenda');
      }
    }
  }, [agenda, selectedMonth, language]);

  const handleGenerate = async () => {
    if (!goals.trim()) return;
    
    setIsLoading(true);
    const monthName = (language === 'pt' ? MONTHS_PT : MONTHS_EN)[selectedMonth];
    
    try {
        const result = await generateMonthlyAgenda(monthName, goals, language);
        if (result) {
            setAgenda({
                ...result,
                month: monthName,
                year: new Date().getFullYear(),
                goals: goals,
                lastUpdated: Date.now()
            });
            setView('agenda');
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const toggleTask = (weekIdx: number, dayIdx: number, taskIdx: number) => {
    if (!agenda) return;
    const newAgenda = { ...agenda };
    // Assuming generated structure matches types, but we handle the raw string array from AI
    // We map tasks to objects on the fly or need to persist completion.
    // NOTE: The AI returns tasks as strings. To support toggling, we need to wrap them if not already wrapped.
    // For simplicity in this version, we assume local state management or simplistic toggling if we enhance the type.
    // Since the AI returns string[], we can't easily toggle state persistently without re-structuring the object.
    // Implementing visual toggle only for this session:
    // A robust impl would map string[] to {text, done}[].
    
    // Let's rely on the user regeneration for now or keep it simple.
  };

  const resetAgenda = () => {
    setView('input');
  };

  const currentMonths = language === 'pt' ? MONTHS_PT : MONTHS_EN;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 min-h-[calc(100vh-200px)]">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                    {language === 'pt' ? 'Agenda Inteligente' : 'Intelligent Agenda'}
                    <span className="bg-purple-500/10 text-purple-500 text-xs px-2 py-1 rounded-lg border border-purple-500/20 uppercase tracking-wider font-bold">
                        AI BETA
                    </span>
                </h2>
                <p className="text-zinc-600 dark:text-neutral-400 mt-1">
                    {language === 'pt' 
                        ? 'Transforme seus objetivos em um plano de ação concreto.' 
                        : 'Turn your goals into a concrete action plan.'}
                </p>
            </div>
            
            {view === 'agenda' && (
                <button 
                    onClick={resetAgenda}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-neutral-800 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-200 dark:hover:bg-neutral-700 transition font-medium text-sm"
                >
                    <Edit3 className="w-4 h-4" />
                    {language === 'pt' ? 'Editar Metas' : 'Edit Goals'}
                </button>
            )}
        </div>

        {/* VIEW 1: INPUT & SETUP */}
        {view === 'input' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Month Selector */}
                <div className="md:col-span-1 space-y-4">
                    <label className="text-sm font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                        {language === 'pt' ? 'Selecione o Mês' : 'Select Month'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {currentMonths.map((m, i) => (
                            <button
                                key={m}
                                onClick={() => setSelectedMonth(i)}
                                className={`p-3 rounded-xl text-sm font-bold transition-all ${
                                    selectedMonth === i 
                                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg' 
                                    : 'bg-white dark:bg-neutral-900 text-zinc-700 dark:text-neutral-500 border border-zinc-200 dark:border-neutral-800 hover:border-zinc-300 dark:hover:border-neutral-700'
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Goals Input */}
                <div className="md:col-span-2 space-y-4">
                    <label className="text-sm font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        {language === 'pt' ? 'Metas do Mês' : 'Monthly Goals'}
                    </label>
                    <div className="relative">
                        <textarea 
                            value={goals}
                            onChange={(e) => setGoals(e.target.value)}
                            placeholder={language === 'pt' 
                                ? "Ex: Lançar single 'Neon', finalizar 3 beats, crescer 1k no Instagram..." 
                                : "Ex: Release 'Neon' single, finish 3 beats, grow 1k on Instagram..."
                            }
                            className="w-full h-64 bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-2xl p-6 text-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none transition-shadow shadow-sm placeholder-zinc-500 dark:placeholder-neutral-600"
                        />
                    </div>
                    
                    <button 
                        onClick={handleGenerate}
                        disabled={!goals.trim() || isLoading}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        {language === 'pt' ? 'Gerar Agenda Estratégica' : 'Generate Strategic Agenda'}
                    </button>
                </div>
            </div>
        )}

        {/* VIEW 2: AGENDA DISPLAY */}
        {view === 'agenda' && agenda && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8">
                
                {/* Overview Card */}
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 dark:from-neutral-900 dark:to-neutral-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Calendar className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 space-y-4 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <span className="text-purple-400 font-bold tracking-widest uppercase text-sm">{agenda.year}</span>
                            <div className="h-px w-8 bg-purple-500/50"></div>
                            <span className="text-2xl font-black uppercase tracking-tighter">{agenda.month}</span>
                        </div>
                        <h3 className="text-3xl font-bold leading-tight">
                            {language === 'pt' ? 'Plano de Ação' : 'Action Plan'}
                        </h3>
                        <p className="text-zinc-300 text-lg leading-relaxed">
                            {agenda.overview}
                        </p>
                    </div>
                </div>

                {/* Weeks Grid */}
                <div className="grid grid-cols-1 gap-6">
                    {agenda.weeks?.map((week, idx) => (
                        <div key={idx} className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-purple-500/30">
                            {/* Week Header */}
                            <div className="bg-zinc-50 dark:bg-neutral-800/50 p-4 border-b border-zinc-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded uppercase">
                                        {language === 'pt' ? 'Semana' : 'Week'} {week.weekNumber}
                                    </span>
                                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                        {week.focus}
                                    </span>
                                </div>
                            </div>

                            {/* Days */}
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {week.days.map((day, dIdx) => (
                                    <div key={dIdx} className="bg-zinc-50 dark:bg-neutral-950/50 rounded-xl p-4 border border-zinc-100 dark:border-neutral-800">
                                        <div className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-3 flex justify-between">
                                            {day.dayName}
                                        </div>
                                        <ul className="space-y-2">
                                            {day.tasks.map((task: any, tIdx: number) => (
                                                <li key={tIdx} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                                                    <div className="mt-0.5 min-w-[6px] h-[6px] rounded-full bg-purple-400" />
                                                    <span className="leading-snug">{typeof task === 'string' ? task : task.text}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center pt-8">
                    <button 
                        onClick={() => window.print()} 
                        className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm font-medium transition-colors"
                    >
                        {language === 'pt' ? 'Exportar / Imprimir Agenda' : 'Export / Print Agenda'}
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};
