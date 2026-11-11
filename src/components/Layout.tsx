import { MouseEvent, ReactNode, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  LogOut, Camera, Clock, Package, FileText, Menu, X, User, Timer,
  ClipboardList, BarChart3, FolderOpen, ArrowLeftRight, Settings,
} from 'lucide-react';

import { type Page, pathFor } from '../lib/routes';

export type { Page };

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const navigationItems: { key: Page; label: string; icon: LucideIcon }[] = [
  { key: 'timeline', label: 'Timeline', icon: Clock },
  { key: 'fiche-technique', label: 'Fiche technique', icon: FileText },
  { key: 'pieces', label: 'Pièces', icon: Package },
  { key: 'time-tracking', label: 'Temps', icon: Timer },
  { key: 'inventory', label: 'Inventaire', icon: ClipboardList },
  { key: 'statistics', label: 'Statistiques', icon: BarChart3 },
  { key: 'documents', label: 'Documents', icon: FolderOpen },
  { key: 'before-after', label: 'Avant/Après', icon: ArrowLeftRight },
];

const itemClass = (active: boolean) =>
  `flex items-center gap-2 rounded-lg font-medium transition-all ${
    active ? 'bg-amber-200 text-amber-900 shadow-md' : 'text-amber-700 hover:bg-amber-100'
  }`;

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const { user, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const go = (page: Page) => {
    onPageChange(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0 });
  };

  // Vrais liens (copier l'adresse, ouvrir dans un onglet) ; un clic simple reste instantané
  const linkProps = (page: Page) => ({
    href: pathFor(page),
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      go(page);
    },
  });

  const handleSignOut = async () => {
    await signOut();
    go('timeline');
  };

  // Boutons du compte (Administration / Déconnexion ou Connexion), réutilisés partout
  const accountButtons = (size: 'sm' | 'lg') => {
    const pad = size === 'lg' ? 'px-4 py-3 w-full' : 'px-3 py-2 text-sm justify-center';
    const icon = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    return (
      <>
        {isAdmin && (
          <a {...linkProps('admin')} className={`${itemClass(currentPage === 'admin')} ${pad}`}>
            <Settings className={icon} />
            <span>Administration</span>
          </a>
        )}
        {user ? (
          <button onClick={handleSignOut} className={`${itemClass(false)} ${pad}`}>
            <LogOut className={icon} />
            <span>Déconnexion</span>
          </button>
        ) : (
          <a {...linkProps('login')} className={`${itemClass(currentPage === 'login')} ${pad}`}>
            <User className={icon} />
            <span>Connexion</span>
          </a>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 to-orange-50">
      {/* En-tête */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-amber-100 to-orange-100 shadow-md border-b-4 border-amber-200">
        <div className="max-w-6xl mx-auto px-4">
          {/* Ligne 1 : titre + compte (ordinateur) ou menu (mobile) */}
          <div className="flex items-center justify-between gap-3 py-3">
            <a
              {...linkProps('timeline')}
              className="flex items-center gap-3 min-w-0 text-left"
              aria-label="Retour à la timeline"
            >
              <span className="bg-amber-200 p-2 lg:p-2.5 rounded-full shadow-md flex-shrink-0">
                <Camera className="h-6 w-6 lg:h-7 lg:w-7 text-amber-800" />
              </span>
              <span className="min-w-0">
                <span className="block text-lg sm:text-xl lg:text-2xl font-bold text-amber-900 font-serif leading-tight">
                  Restauration Lambretta LD125
                </span>
                <span className="block text-amber-700 text-xs lg:text-sm font-medium">
                  Modèle 1956 · Carnet de bord
                </span>
              </span>
            </a>

            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              {accountButtons('sm')}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-amber-700 hover:bg-amber-200 transition-all flex-shrink-0"
              aria-label="Menu de navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Ligne 2 : navigation (ordinateur) */}
          <nav className="hidden lg:flex flex-wrap justify-center gap-1 pb-3" aria-label="Rubriques">
            {navigationItems.map(({ key, label, icon: Icon }) => (
              <a
                key={key}
                {...linkProps(key)}
                className={`${itemClass(currentPage === key)} px-3 py-2 text-sm whitespace-nowrap`}
                aria-current={currentPage === key ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </a>
            ))}
          </nav>

          {/* Menu mobile */}
          {mobileMenuOpen && (
            <nav className="lg:hidden border-t-2 border-amber-200 py-3 relative z-20" aria-label="Rubriques">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {navigationItems.map(({ key, label, icon: Icon }) => (
                  <a
                    key={key}
                    {...linkProps(key)}
                    className={`${itemClass(currentPage === key)} px-4 py-3 w-full text-left`}
                    aria-current={currentPage === key ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </a>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2 pt-2 border-t-2 border-amber-200">
                {accountButtons('lg')}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Voile pour fermer le menu mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/25 z-20"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Contenu */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Pied de page */}
      <footer className="bg-gradient-to-r from-amber-100 to-orange-100 border-t-2 border-amber-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6" aria-label="Rubriques (pied de page)">
            {navigationItems.map(({ key, label, icon: Icon }) => (
              <a
                key={key}
                {...linkProps(key)}
                className={`${itemClass(currentPage === key)} flex-col justify-center gap-1 px-2 py-3 text-xs text-center`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </a>
            ))}
          </nav>

          <div className="flex flex-col sm:flex-row justify-center gap-2 mb-6 border-t-2 border-amber-200 pt-4">
            {accountButtons('sm')}
          </div>

          <div className="border-t-2 border-amber-200 pt-4 text-center">
            <p className="text-amber-700 font-medium text-xs lg:text-sm">
              Restauration avec passion • Lambretta LD125 1956
            </p>
            <p className="text-amber-500 text-xs mt-1">Version {__APP_VERSION__}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
