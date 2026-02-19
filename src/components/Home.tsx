import React from 'react';
import { ArrowRight, Heart, Users, MessageCircle, Brain, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { PSYCHOLOGIST_NAME } from '../constants';

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-50 py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:mx-auto md:max-w-2xl lg:col-span-6 lg:text-left">
              <span className="inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-800 mb-4">
                Psicologia Clínica
              </span>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                Cuide da sua <span className="text-primary">saúde mental</span> com acolhimento.
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                Um espaço seguro de escuta e transformação. Atendimento especializado online para ajudar você a viver com mais leveza e propósito.
              </p>
              <div className="mt-8 gap-4 flex justify-center lg:justify-start">
                <Link to="/agendar">
                  <Button size="lg" className="shadow-lg shadow-teal-500/30">
                    Agendar Consulta
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#about">
                   <Button variant="outline" size="lg">Saiba Mais</Button>
                </a>
              </div>
            </div>
            <div className="relative mt-12 sm:mx-auto sm:max-w-lg lg:col-span-6 lg:mx-0 lg:mt-0 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-2xl shadow-xl lg:max-w-md overflow-hidden bg-white p-2">
                 <img
                  className="w-full rounded-xl object-cover h-[400px] sm:h-[500px]"
                  src="https://picsum.photos/seed/psychologist/800/1000"
                  alt="Consultório acolhedor"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-50">
           <div className="h-64 w-64 rounded-full bg-teal-200 blur-3xl filter"></div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
             <div className="relative mb-10 lg:mb-0">
                <img 
                  src="https://picsum.photos/seed/amanda_portrait/600/800" 
                  alt={PSYCHOLOGIST_NAME}
                  className="rounded-lg shadow-xl w-full max-w-md mx-auto"
                />
                <div className="absolute -bottom-6 -right-6 bg-secondary p-6 rounded-lg shadow-lg hidden md:block">
                   <p className="text-teal-900 font-bold text-xl">5+ Anos</p>
                   <p className="text-teal-700 text-sm">de Experiência Clínica</p>
                </div>
             </div>
             <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
                  Sobre {PSYCHOLOGIST_NAME}
                </h2>
                <div className="space-y-4 text-lg text-slate-600">
                  <p>
                    Olá! Sou psicóloga clínica apaixonada pelo potencial de transformação humana. Minha abordagem é baseada na empatia e na ciência, oferecendo um ambiente livre de julgamentos.
                  </p>
                  <p>
                    Especialista em Terapia Cognitivo-Comportamental, trabalho ajudando pessoas a superarem ansiedade, depressão e conflitos de relacionamento, promovendo autoconhecimento e bem-estar.
                  </p>
                </div>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-primary h-6 w-6" />
                      <span className="text-slate-700 font-medium">Atendimento Humanizado</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-primary h-6 w-6" />
                      <span className="text-slate-700 font-medium">Sigilo Profissional</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-primary h-6 w-6" />
                      <span className="text-slate-700 font-medium">Abordagem Baseada em Evidências</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Como posso te ajudar
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Ofereço diferentes modalidades de atendimento para melhor se adequar à sua necessidade e momento de vida.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Service Card 1 */}
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Psicoterapia Individual Online</h3>
              <p className="text-slate-600 mb-6">
                Sessões focadas no seu desenvolvimento pessoal, autoconhecimento e tratamento de questões como ansiedade, depressão e estresse. Tudo no conforto da sua casa.
              </p>
              <ul className="space-y-2 mb-6">
                 <li className="text-sm text-slate-500 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div>Sessões de 50 minutos</li>
                 <li className="text-sm text-slate-500 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div>Videoconferência segura</li>
              </ul>
              <Link to="/agendar" className="text-primary font-medium hover:text-teal-700 flex items-center gap-1">
                Agendar sessão <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Service Card 2 */}
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-sky-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-sky-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Terapia de Casal e Família</h3>
              <p className="text-slate-600 mb-6">
                Espaço mediado para facilitar o diálogo, resolver conflitos e fortalecer os vínculos afetivos entre casais ou membros da família.
              </p>
              <ul className="space-y-2 mb-6">
                 <li className="text-sm text-slate-500 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-sky-600"></div>Sessões de 60-90 minutos</li>
                 <li className="text-sm text-slate-500 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-sky-600"></div>Foco na comunicação</li>
              </ul>
              <Link to="/agendar" className="text-sky-600 font-medium hover:text-sky-700 flex items-center gap-1">
                Consultar disponibilidade <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};