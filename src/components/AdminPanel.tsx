import { FC, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppointmentSlot, Appointment } from '../types';
import { fetchAvailableSlots, fetchAllAppointments, createSlot, deleteSlot, cancelAppointment } from '../services/calendarService';
import { Button } from './Button';
import { Calendar, Clock, Trash2, Users, Settings, Loader2 } from 'lucide-react';

type DayConfig = {
  active: boolean;
  start: string;
  end: string;
  lunchStart: string;
  lunchEnd: string;
};

const defaultDays: Record<number, DayConfig> = {
  1: { active: true, start: '08:00', end: '18:00', lunchStart: '12:00', lunchEnd: '14:00' },
  2: { active: true, start: '08:00', end: '18:00', lunchStart: '12:00', lunchEnd: '14:00' },
  3: { active: true, start: '08:00', end: '18:00', lunchStart: '12:00', lunchEnd: '14:00' },
  4: { active: true, start: '08:00', end: '18:00', lunchStart: '12:00', lunchEnd: '14:00' },
  5: { active: true, start: '08:00', end: '18:00', lunchStart: '12:00', lunchEnd: '14:00' },
  6: { active: false, start: '08:00', end: '12:00', lunchStart: '12:00', lunchEnd: '13:00' },
  0: { active: false, start: '08:00', end: '12:00', lunchStart: '12:00', lunchEnd: '13:00' },
};

const dayNames: Record<number, string> = {
  1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado', 0: 'Domingo'
};

export const AdminPanel: FC = () => {
  const { user } = useAuth();
  const calendarEmail = import.meta.env.VITE_GOOGLE_CALENDAR_EMAIL;
  
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  // Generator State
  const [sessionDuration, setSessionDuration] = useState(50);
  const [intervalDuration, setIntervalDuration] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysConfig, setDaysConfig] = useState<Record<number, DayConfig>>(defaultDays);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Preenche automaticamente o campo "Data Início" com o dia seguinte ao último dia com agenda
  useEffect(() => {
    if (slots.length > 0) {
      const latestDate = slots.reduce((latest, slot) => {
        return slot.date > latest ? slot.date : latest;
      }, new Date(0));
      
      const nextDay = new Date(latestDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const year = nextDay.getFullYear();
      const month = String(nextDay.getMonth() + 1).padStart(2, '0');
      const day = String(nextDay.getDate()).padStart(2, '0');
      
      setStartDate(`${year}-${month}-${day}`);
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      
      setStartDate(`${year}-${month}-${day}`);
    }
  }, [slots]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedSlots, fetchedAppts] = await Promise.all([
        fetchAvailableSlots(),
        fetchAllAppointments()
      ]);
      setSlots(fetchedSlots);
      setAppointments(fetchedAppts);
    } catch (error) {
      console.error("Failed to load admin data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert("Por favor, selecione a data inicial e final.");
      return;
    }

    const startObj = new Date(startDate + 'T12:00:00'); 
    const endObj = new Date(endDate + 'T12:00:00');

    if (startObj > endObj) {
      alert("A data inicial não pode ser maior que a final.");
      return;
    }

    const newSlots: { date: Date, startTime: string, endTime: string }[] = [];
    const currentDay = new Date(startObj);

    while (currentDay <= endObj) {
      const dayOfWeek = currentDay.getDay();
      const config = daysConfig[dayOfWeek];

      if (config.active) {
        const parseTime = (timeStr: string) => {
          const [h, m] = timeStr.split(':').map(Number);
          return h * 60 + m;
        };
        const formatTime = (totalMins: number) => {
          const h = Math.floor(totalMins / 60);
          const m = totalMins % 60;
          return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        };

        const workStart = parseTime(config.start);
        const workEnd = parseTime(config.end);
        const lunchStart = parseTime(config.lunchStart);
        const lunchEnd = parseTime(config.lunchEnd);

        let currentMin = workStart;

        while (currentMin + sessionDuration <= workEnd) {
          const sessionEndMin = currentMin + sessionDuration;
          
          // Check lunch collision
          const conflictsWithLunch = (currentMin < lunchEnd && sessionEndMin > lunchStart);

          if (conflictsWithLunch) {
            currentMin = lunchEnd;
            continue;
          }

          newSlots.push({
            date: new Date(currentDay),
            startTime: formatTime(currentMin),
            endTime: formatTime(sessionEndMin)
          });

          currentMin = sessionEndMin + intervalDuration;
        }
      }
      
      currentDay.setDate(currentDay.getDate() + 1);
    }

    const finalSlotsToCreate = newSlots.filter(newSlot => {
      const alreadyExists = slots.some(existing => {
        const sameDay = existing.date.toDateString() === newSlot.date.toDateString();
        const sameTime = existing.startTime === newSlot.startTime;
        return sameDay && sameTime;
      });
      return !alreadyExists;
    });

    if (finalSlotsToCreate.length === 0) {
      alert("Todos os horários gerados já existem na sua agenda. Nenhuma alteração foi feita.");
      return;
    }

    const skippedCount = newSlots.length - finalSlotsToCreate.length;
    const confirmMsg = skippedCount > 0 
      ? `Isso irá criar ${finalSlotsToCreate.length} novos horários (pulando ${skippedCount} que já existem).\nDeseja continuar?`
      : `Isso irá criar ${finalSlotsToCreate.length} novos horários vago na agenda.\nDeseja continuar?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    setIsCreating(true);
    try {
      await Promise.all(finalSlotsToCreate.map(slot => createSlot(slot.date, slot.startTime, slot.endTime)));
      alert("Agenda atualizada com sucesso!");
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Houve um erro ao gerar os horários.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDayChange = (day: number, field: keyof DayConfig, value: string | boolean) => {
    setDaysConfig(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleDeleteDay = async (daySlots: AppointmentSlot[], dateStr: string) => {
    if (!confirm(`Tem certeza que deseja REDEFINIR e apagar TODOS os ${daySlots.length} horários válidos de ${dateStr}?`)) return;
    try {
      setLoading(true);
      // Apaga todos os slots do dia selecionado simultaneamente usando Promise.all
      await Promise.all(daySlots.map(slot => deleteSlot(slot.id)));
      await loadData();
    } catch (error) {
      alert("Erro ao apagar os horários daquele dia.");
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar este horário livre? Ele vai desaparecer para os pacientes.")) return;
    try {
      await deleteSlot(id);
      await loadData();
    } catch (error) {
      alert("Erro ao apagar horário.");
    }
  };

  const handleCancelAppointment = async (appointmentId: string, slotId: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta consulta? O horário voltará a ficar disponível para novos agendamentos.")) return;
    setCancellingId(appointmentId);
    try {
      const success = await cancelAppointment(appointmentId, slotId);
      if (success) {
        alert("Consulta cancelada com sucesso!");
        await loadData();
      }
    } catch (error: any) {
      console.error("Error cancelling appointment:", error);
      alert("Não foi possível cancelar a consulta: " + (error?.message || error));
    } finally {
      setCancellingId(null);
    }
  };

  // Group and sort slots for UI
  const groupedSlots = Object.entries(
    slots.reduce((acc, slot) => {
      // Use ISO date string to ensure correct day sorting in Object keys later
      const dateKey = slot.date.toISOString().split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(slot);
      return acc;
    }, {} as Record<string, AppointmentSlot[]>)
  ).sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
  .reduce((acc, [dateKey, daySlots]) => {
    // Format back to human readable only after sorting keys
    const dateObj = new Date(dateKey + 'T12:00:00');
    const displayDate = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
    
    // Sort times within the day
    acc[displayDate] = daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {} as Record<string, AppointmentSlot[]>);

  // Filter and sort appointments (Only futures ones, ascending)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const upcomingAppointments = appointments
    .filter(appt => appt.date >= startOfToday)
    .sort((a, b) => {
        // Sort by Date first
        if (a.date.getTime() !== b.date.getTime()) {
            return a.date.getTime() - b.date.getTime();
        }
        // If same date, sort by start time
        return a.startTime.localeCompare(b.startTime);
    });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Painel do Administrador</h1>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div className="text-slate-600">
            <p>Logado como: <span className="font-medium text-slate-800">{user?.email}</span></p>
            <p className="text-xs">Agenda vinculada: <span className="text-primary">{calendarEmail}</span></p>
          </div>
          <a 
            href={`https://calendar.google.com/calendar/u/${calendarEmail}/r`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-primary hover:text-primary transition-all shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            Abrir Google Agenda
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Generator Configuration (Span 5) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Gerador Inteligente de Agenda
            </h2>
            
            <form onSubmit={handleGenerateSlots} className="space-y-6">
              
              {/* Regras Globais */}
              <div className="space-y-4">
                 <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Regras Globais</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs text-slate-500 mb-1">Duração da Sessão (min)</label>
                     <input 
                       type="number" 
                       min="1"
                       required
                       value={sessionDuration}
                       onChange={(e) => setSessionDuration(Number(e.target.value))}
                       className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                     />
                   </div>
                   <div>
                     <label className="block text-xs text-slate-500 mb-1">Intervalo entre elas (min)</label>
                     <input 
                       type="number" 
                       min="0"
                       required
                       value={intervalDuration}
                       onChange={(e) => setIntervalDuration(Number(e.target.value))}
                       className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                     />
                   </div>
                 </div>
              </div>

              {/* Período */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                 <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Período de Geração</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs text-slate-500 mb-1">Data Início</label>
                     <input 
                       type="date" 
                       required
                       value={startDate}
                       onChange={(e) => setStartDate(e.target.value)}
                       className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                     />
                   </div>
                   <div>
                     <label className="block text-xs text-slate-500 mb-1">Data Fim</label>
                     <input 
                       type="date" 
                       required
                       value={endDate}
                       onChange={(e) => setEndDate(e.target.value)}
                       className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                     />
                   </div>
                 </div>
              </div>

              {/* Dias da Semana */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                 <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Dias de Trabalho</h3>
                 <div className="space-y-3">
                   {[1, 2, 3, 4, 5, 6, 0].map(day => (
                     <div key={day} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                        <div className="flex items-center mb-3">
                          <input 
                            type="checkbox" 
                            id={`day-${day}`}
                            checked={daysConfig[day].active}
                            onChange={(e) => handleDayChange(day, 'active', e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor={`day-${day}`} className="ml-2 font-medium text-slate-700">
                            {dayNames[day]}
                          </label>
                        </div>
                        
                        {daysConfig[day].active && (
                          <div className="pl-6 grid grid-cols-2 gap-x-4 gap-y-2">
                             <div>
                               <label className="block text-[10px] uppercase text-slate-500 mb-1">Início Dia</label>
                               <input type="time" required value={daysConfig[day].start} onChange={(e) => handleDayChange(day, 'start', e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1 text-xs" />
                             </div>
                             <div>
                               <label className="block text-[10px] uppercase text-slate-500 mb-1">Fim Dia</label>
                               <input type="time" required value={daysConfig[day].end} onChange={(e) => handleDayChange(day, 'end', e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1 text-xs" />
                             </div>
                             <div>
                               <label className="block text-[10px] uppercase text-slate-500 mb-1">Início Almoço</label>
                               <input type="time" required value={daysConfig[day].lunchStart} onChange={(e) => handleDayChange(day, 'lunchStart', e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1 text-xs" />
                             </div>
                             <div>
                               <label className="block text-[10px] uppercase text-slate-500 mb-1">Fim Almoço</label>
                               <input type="time" required value={daysConfig[day].lunchEnd} onChange={(e) => handleDayChange(day, 'lunchEnd', e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1 text-xs" />
                             </div>
                          </div>
                        )}
                     </div>
                   ))}
                 </div>
              </div>

              <div className="pt-4">
                 <Button type="submit" className="w-full" isLoading={isCreating}>
                   Gerar e Salvar Agenda
                 </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Viewer & Appointments (Span 7) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          
          {/* Consultas Marcadas */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex-1">
             <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-slate-900">Consultas Fechadas ({upcomingAppointments.length})</h2>
                </div>
             </div>
             <div className="p-0">
               {upcomingAppointments.length === 0 ? (
                 <div className="p-10 text-center">
                   <p className="text-slate-500">Ainda não há nenhuma consulta agendada no banco.</p>
                 </div>
               ) : (
                 <div className="overflow-x-auto max-h-[400px]">
                   <table className="w-full text-left border-collapse">
                     <thead className="sticky top-0 bg-white z-10 shadow-sm">
                       <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                         <th className="px-6 py-4 font-semibold">Paciente</th>
                         <th className="px-6 py-4 font-semibold">Data da Consulta</th>
                         <th className="px-6 py-4 font-semibold">Horário</th>
                         <th className="px-6 py-4 font-semibold">Agendado em</th>
                         <th className="px-6 py-4 font-semibold">Ações</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {upcomingAppointments.map(appt => (
                         <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4">
                             <div className="font-medium text-slate-900">{appt.userEmail.split('@')[0]}</div>
                             <div className="text-xs text-slate-500">{appt.userEmail}</div>
                           </td>
                           <td className="px-6 py-4 text-sm text-slate-700">
                             {appt.date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                           </td>
                           <td className="px-6 py-4">
                             <span className="inline-flex items-center px-2 py-1 rounded-md bg-teal-50 text-primary text-xs font-medium ring-1 ring-inset ring-teal-500/10">
                               {appt.startTime} - {appt.endTime}
                             </span>
                           </td>
                           <td className="px-6 py-4 text-xs text-slate-400">
                             {appt.createdAt.toLocaleDateString('pt-BR', { hour: '2-digit', minute:'2-digit' })}
                           </td>
                           <td className="px-6 py-4 text-sm">
                             <button
                               disabled={cancellingId !== null}
                               onClick={() => handleCancelAppointment(appt.id, appt.slotId)}
                               className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium border border-transparent transition-all
                                 ${cancellingId === appt.id
                                   ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                   : 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 cursor-pointer'
                                 }`}
                             >
                               {cancellingId === appt.id ? (
                                 <>
                                   <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                   Cancelando...
                                 </>
                               ) : (
                                 <>
                                   <Trash2 className="w-3.5 h-3.5" />
                                   Cancelar
                                 </>
                               )}
                             </button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
             </div>
          </div>

          {/* Horários Livres */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col flex-1">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 shrink-0">
              <Calendar className="h-5 w-5 text-primary" />
              Gaveta de Horários Abertos (Vitrine)
            </h2>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex-1 overflow-y-auto min-h-[320px]">
              {slots.length === 0 ? (
                 <p className="text-sm text-slate-500 text-center py-10">A agenda pública está vazia. Gere horários ao lado.</p>
              ) : (
                 <div className="space-y-6">
                   {Object.entries(groupedSlots).map(([dateStr, daySlots]) => (
                     <div key={dateStr} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                       <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                         <h3 className="font-semibold text-slate-700 capitalize">{dateStr}</h3>
                         <button
                           onClick={() => handleDeleteDay(daySlots, dateStr)}
                           className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors flex items-center gap-1 border border-transparent hover:border-red-100"
                           title="Apagar todos os horários deste dia"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                           <span className="hidden sm:inline">Apagar Dia</span>
                         </button>
                       </div>
                       <div className="flex flex-wrap gap-2">
                         {daySlots.map(slot => (
                           <div key={slot.id} className="flex items-center bg-slate-50 border border-slate-200 rounded-md pr-1 overflow-hidden group">
                             <span className="px-3 py-1.5 text-xs font-medium text-slate-700 flex items-center gap-1">
                               <Clock className="w-3 h-3 text-slate-400" />
                               {slot.startTime}
                             </span>
                             <button
                               onClick={() => handleDeleteSlot(slot.id)}
                               className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors border-l border-slate-200"
                               title="Apagar este slot publico"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           </div>
                         ))}
                       </div>
                     </div>
                   ))}
                 </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
