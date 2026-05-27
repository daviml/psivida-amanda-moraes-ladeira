import { useEffect, useState, type FC } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAvailableSlots, bookAppointment, fetchUserAppointments, cancelAppointment } from '../services/calendarService';
import { AppointmentSlot, Appointment } from '../types';
import { Button } from './Button';
import { Calendar as CalendarIcon, Clock, Check, AlertCircle, Loader2, ChevronLeft, ChevronRight, Video } from 'lucide-react';
import { Link } from 'react-router-dom';

const getGoogleCalendarLink = (appt: Appointment) => {
  const dateObj = new Date(appt.date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  const startClean = appt.startTime.replace(':', '');
  const endClean = appt.endTime.replace(':', '');
  
  const dates = `${year}${month}${day}T${startClean}00/${year}${month}${day}T${endClean}00`;
  const text = "Consulta de Psicoterapia - Amanda Ladeira";
  const details = `Atendimento Psicológico Online com Amanda Moraes Ladeira (CRP: 04/58040)\n\nLink da videochamada: ${appt.googleMeetLink || 'Disponível no site'}`;
  const location = appt.googleMeetLink || "Google Meet";
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&dates=${dates}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
};

export const Booking: FC = () => {
  const { user, login, isLoading: authLoading } = useAuth();
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Controle da Semana Atual (Começando no Domingo passado/hoje na meia-noite)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDay(); // 0 = Sunday, 1 = Monday...
    const diff = today.getDate() - day; // Move para o último Domingo
    return new Date(today.setDate(diff));
  });

  const nextWeek = () => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const prevWeek = () => {
    setCurrentWeekStart(prev => {
      const p = new Date(prev);
      p.setDate(p.getDate() - 7);
      return p;
    });
  };

  // Reseta o estado quando o usuário muda (troca de conta ou logout)
  useEffect(() => {
    setBookingStatus('idle');
    setSelectedSlot(null);
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoadingSlots(true);
    try {
      const [slotsData, apptsData] = await Promise.all([
        fetchAvailableSlots(),
        fetchUserAppointments(user!.email)
      ]);
      setSlots(slotsData);
      setMyAppointments(apptsData);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !user) return;
    setBookingStatus('processing');
    try {
      const success = await bookAppointment(selectedSlot.id, user.email);
      if (success) {
        setBookingStatus('success');
      } else {
        setBookingStatus('error');
      }
    } catch (error) {
      setBookingStatus('error');
    }
  };

  const handleCancelAppointment = async (appointmentId: string, slotId: string) => {
    if (!window.confirm("Tem certeza que deseja cancelar esta sessão? O horário será liberado para outros pacientes.")) {
      return;
    }
    
    setCancellingId(appointmentId);
    try {
      const success = await cancelAppointment(appointmentId, slotId);
      if (success) {
        alert("Sessão cancelada com sucesso!");
        await loadData();
      }
    } catch (error: any) {
      console.error("Error cancelling appointment:", error);
      alert("Não foi possível cancelar o agendamento: " + (error?.message || error));
    } finally {
      setCancellingId(null);
    }
  };

  // Filtra de Domingo até Sábado (23:59:59) da quinzena selecionada
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);

  const slotsInWeek = slots.filter(slot => slot.date >= currentWeekStart && slot.date <= currentWeekEnd);

  // Group and sort slots by date for better UI
  const groupedSlots = Object.entries(
    slotsInWeek.reduce((acc, slot) => {
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
    const displayDate = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    
    // Sort times within the day
    acc[displayDate] = daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {} as Record<string, AppointmentSlot[]>);


  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 bg-slate-50">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl text-center">
           <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
              <CalendarIcon className="h-8 w-8 text-primary" />
           </div>
           <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
             Agende sua consulta
           </h2>
           <p className="mt-2 text-slate-600">
             Para visualizar a agenda e marcar seu horário, é necessário fazer login. Utilizamos sua conta Google para integrar ao calendário.
           </p>
           <div className="mt-8">
             <Button size="lg" onClick={() => login()} className="w-full">
               Login com Google
             </Button>
           </div>
           <p className="text-xs text-slate-400 mt-4">
             Seus dados estão seguros e são usados apenas para o agendamento.
           </p>
        </div>
      </div>
    );
  }

  if (bookingStatus === 'success') {
     return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
           <div className="text-center max-w-md">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
                 <Check className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Agendamento Confirmado!</h2>
              <p className="text-slate-600 mb-8">
                Sua consulta foi agendada para <strong>{selectedSlot?.date.toLocaleDateString()} às {selectedSlot?.startTime}</strong>.
                Acesse a videochamada pelo botão <strong>"Entrar na Videochamada"</strong> em seus agendamentos, ou salve a sessão no seu calendário clicando em <strong>"Adicionar à minha Agenda"</strong>.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                   variant="primary" 
                   onClick={() => {
                     setBookingStatus('idle');
                     setSelectedSlot(null);
                     loadData();
                   }}
                >
                  Ver Meus Agendamentos
                </Button>
                <Link to="/">
                  <Button variant="outline">Voltar para Início</Button>
                </Link>
              </div>
           </div>
        </div>
     )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Agenda Disponível</h1>
        <p className="text-slate-600 mt-2">Selecione um horário para sua sessão de terapia online.</p>
      </div>

      {/* Minhas Consultas */}
      {myAppointments.filter(appt => appt.date >= new Date(new Date().setHours(0,0,0,0))).length > 0 && (
        <div className="mb-10 bg-teal-50/50 rounded-2xl p-6 border border-teal-100">
           <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
             <CalendarIcon className="w-5 h-5 text-primary" />
             Minhas Próximas Sessões
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {myAppointments
               .filter(appt => appt.date >= new Date(new Date().setHours(0,0,0,0)))
               .map(appt => (
                 <div key={appt.id} className="bg-white rounded-xl p-4 border border-teal-100 shadow-sm flex items-start gap-3">
                   <div className="bg-teal-100/50 p-2 rounded-lg text-primary shrink-0">
                     <Clock className="w-5 h-5" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="font-semibold text-slate-900 capitalize truncate">
                       {appt.date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                     </p>
                     <p className="text-sm text-slate-600 mt-0.5">
                       {appt.startTime} - {appt.endTime}
                     </p>

                     <div className="mt-3 flex flex-wrap gap-2">
                       {appt.googleMeetLink && (
                         <a
                           href={appt.googleMeetLink}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all hover:shadow-md active:scale-95 cursor-pointer"
                         >
                           <Video className="w-3.5 h-3.5" />
                           Entrar na Videochamada
                         </a>
                       )}
                       <a
                         href={getGoogleCalendarLink(appt)}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer border border-slate-200"
                       >
                         <CalendarIcon className="w-3.5 h-3.5" />
                         Adicionar à minha Agenda
                       </a>
                     </div>

                     <div className="mt-3 flex items-center gap-3">
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                         Confirmado
                       </span>
                       <button
                         disabled={cancellingId !== null}
                         onClick={() => handleCancelAppointment(appt.id, appt.slotId)}
                         className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors
                           ${cancellingId === appt.id 
                             ? 'text-slate-400 cursor-not-allowed' 
                             : 'text-red-500 hover:text-red-700 hover:underline bg-transparent border-none p-0 cursor-pointer'
                           }`}
                       >
                         {cancellingId === appt.id ? (
                           <>
                             <Loader2 className="w-3.5 h-3.5 animate-spin" />
                             Cancelando...
                           </>
                         ) : (
                           'Cancelar'
                         )}
                       </button>
                     </div>
                   </div>
                 </div>
               ))
             }
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Menu Semanal */}
          <div className="flex items-center justify-between bg-white px-2 py-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
            <button 
               onClick={prevWeek} 
               className="p-1 sm:p-2 sm:px-3 flex items-center gap-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline pb-0.5 text-sm font-medium">Voltar</span>
            </button>
            <div className="text-center">
               <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Período de Agenda</p>
               <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  {currentWeekStart.toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})} até {currentWeekEnd.toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', year: 'numeric'})}
               </h3>
            </div>
            <button 
               onClick={nextWeek} 
               className="p-1 sm:p-2 sm:px-3 flex items-center gap-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            >
              <span className="hidden sm:inline pb-0.5 text-sm font-medium">Avançar</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {loadingSlots ? (
             <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
             </div>
          ) : Object.keys(groupedSlots).length === 0 ? (
             <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CalendarIcon className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-900">Sem horários nesta semana</h3>
                <p className="text-slate-500 mt-1 max-w-sm mx-auto">Tente navegar para a próxima semana e verificar novas disponibilidades.</p>
                <button onClick={nextWeek} className="mt-4 text-primary font-medium hover:underline inline-flex items-center gap-1">
                  Ver próxima semana <ChevronRight className="w-4 h-4" />
                </button>
             </div>
          ) : (
            Object.entries(groupedSlots).map(([dateStr, daySlots]) => (
              <div key={dateStr} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-700 capitalize">{dateStr}</h3>
                </div>
                <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {(daySlots as AppointmentSlot[]).map(slot => (
                    <button
                      key={slot.id}
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                      className={`
                        relative flex flex-col items-center justify-center rounded-lg p-3 border text-sm font-medium transition-all
                        ${!slot.available 
                          ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed' 
                          : selectedSlot?.id === slot.id 
                            ? 'bg-teal-50 border-primary text-primary ring-1 ring-primary' 
                            : 'bg-white border-slate-200 text-slate-700 hover:border-primary hover:text-primary'
                        }
                      `}
                    >
                      <Clock className="mb-1 h-4 w-4" />
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Column */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-lg border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Resumo do Agendamento</h3>
            
            {selectedSlot ? (
              <div className="space-y-4">
                 <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">Data</p>
                    <p className="font-medium text-slate-900 capitalize">
                      {selectedSlot.date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">Horário</p>
                    <p className="font-medium text-slate-900">
                      {selectedSlot.startTime} - {selectedSlot.endTime}
                    </p>
                 </div>
                 
                 <div className="pt-4 border-t border-slate-100">
                   <div className="flex justify-between mb-2">
                     <span className="text-slate-600">Psicoterapia Online</span>
                     <span className="font-medium text-slate-900">R$ 200,00</span>
                   </div>
                 </div>

                 <Button 
                    className="w-full mt-4" 
                    size="lg" 
                    onClick={handleBook}
                    isLoading={bookingStatus === 'processing'}
                 >
                   Confirmar Agendamento
                 </Button>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500">
                <AlertCircle className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                <p>Selecione um horário no calendário para prosseguir.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};