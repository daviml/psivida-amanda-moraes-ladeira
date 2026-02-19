import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAvailableSlots, bookAppointment } from '../services/calendarService';
import { AppointmentSlot } from '../types';
import { Button } from './Button';
import { Calendar as CalendarIcon, Clock, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Booking: React.FC = () => {
  const { user, login, isLoading: authLoading } = useAuth();
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // Load slots when component mounts (or user logs in)
  useEffect(() => {
    if (user) {
      loadSlots();
    }
  }, [user]);

  const loadSlots = async () => {
    setLoadingSlots(true);
    try {
      const data = await fetchAvailableSlots();
      setSlots(data);
    } catch (error) {
      console.error("Failed to load slots", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !user) return;
    setBookingStatus('processing');
    try {
      await bookAppointment(selectedSlot.id, user.email);
      setBookingStatus('success');
    } catch (error) {
      setBookingStatus('error');
    }
  };

  // Group slots by date for better UI
  const groupedSlots = slots.reduce((acc, slot) => {
    const dateStr = slot.date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(slot);
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
                Você receberá um e-mail com o link da videochamada em breve.
              </p>
              <Link to="/">
                <Button variant="outline">Voltar para Início</Button>
              </Link>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Column */}
        <div className="lg:col-span-2 space-y-6">
          {loadingSlots ? (
             <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
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