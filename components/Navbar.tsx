import React, { useState } from 'react';
import { Menu, X, LogIn, User as UserIcon, Calendar } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, login, logout, isLoading } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: 'Início', path: '/' },
    { name: 'Sobre', path: '/#about' },
    { name: 'Serviços', path: '/#services' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-semibold text-primary">{APP_NAME}</span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.path}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                >
                  {link.name}
                </a>
              ))}
              
              {user ? (
                <div className="flex items-center gap-4">
                   <Link to="/agendar">
                      <Button variant="primary" size="sm">
                        <Calendar className="mr-2 h-4 w-4" />
                        Agendar
                      </Button>
                   </Link>
                   <div className="flex items-center gap-2 border-l pl-4">
                      <span className="text-sm font-medium text-slate-700">Olá, {user.name.split(' ')[0]}</span>
                      <button onClick={() => logout()} className="text-xs text-slate-500 hover:text-red-500">Sair</button>
                   </div>
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => login()} isLoading={isLoading}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
              )}
            </div>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-primary"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="mt-4 border-t pt-4">
               {user ? (
                 <div className="space-y-2">
                    <div className="px-3 flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-slate-500" />
                      <span className="font-medium text-slate-700">{user.name}</span>
                    </div>
                    <Link to="/agendar" onClick={() => setIsOpen(false)}>
                      <Button className="w-full mt-2">Agendar Consulta</Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start text-red-500" onClick={() => { logout(); setIsOpen(false); }}>
                      Sair
                    </Button>
                 </div>
               ) : (
                 <Button className="w-full" onClick={() => { login(); setIsOpen(false); }}>
                   Login com Google
                 </Button>
               )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};