import { type FC } from 'react';
import { Mail, Phone, MapPin, Instagram } from 'lucide-react';
import { PSYCHOLOGIST_NAME, CRP_NUMBER, CONTACT_EMAIL, CONTACT_PHONE } from '../constants';

export const Footer: FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">PsiVida</h3>
            <p className="text-sm leading-6">
              Acolhimento, escuta ativa e transformação. Um espaço seguro para você reencontrar seu equilíbrio emocional.
            </p>
            <div className="mt-4">
                <p className="text-xs text-slate-500">CRP: {CRP_NUMBER}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm hover:text-white">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </li>
              <li className="flex items-center gap-2 text-sm hover:text-white">
                <Phone className="h-4 w-4" />
                <span>{CONTACT_PHONE}</span>
              </li>
              <li className="flex items-center gap-2 text-sm hover:text-white">
                <MapPin className="h-4 w-4" />
                <span>Atendimento Online para todo o Brasil</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Redes Sociais</h3>
            <div className="flex space-x-6">
              <a href="#" className="text-slate-400 hover:text-white">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-700 pt-8 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} {PSYCHOLOGIST_NAME}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};