import React, { ReactNode, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Camera, Clock, Package, FileText, Menu, X, User, Timer, ClipboardList, BarChart3, FolderOpen, ArrowLeftRight } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: 'timeline' | 'admin' | 'pieces' | 'fiche-technique' | 'time-tracking' | 'inventory' | 'statistics' | 'documents' | 'before-after' | 'login';
  onPageChange: (page: 'timeline' | 'admin' | 'pieces' | 'fiche-technique' | 'time-tracking' | 'inventory' | 'statistics' | 'documents' | 'before-after' | 'login') => void;
}

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const { user, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    onPageChange('timeline');
    setMobileMenuOpen(false);
  };

  const handlePageChange = (page: 'timeline' | 'admin' | 'pieces' | 'fiche-technique' | 'time-tracking' | 'inventory' | 'statistics' | 'documents' | 'before-after' | 'login') => {
    onPageChange(page);
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navigationItems = [
    {
      key: 'timeline',
      label: 'Timeline',
      icon: Clock,
    },
    {
      key: 'fiche-technique',
      label: 'Fiche Technique',
      icon: FileText,
    },
    {
      key: 'pieces',
      label: 'Pièces',
      icon: Package,
    },
    {
      key: 'time-tracking',
      label: 'Temps',
      icon: Timer,
    },
    {
      key: 'inventory',
      label: 'Inventaire',
      icon: ClipboardList,
    },
    {
      key: 'statistics',
      label: 'Statistiques',
      icon: BarChart3,
    },
    {
      key: 'documents',
      label: 'Documents',
      icon: FolderOpen,
    },
    {
      key: 'before-after',
      label: 'Avant/Après',
      icon: ArrowLeftRight,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-100 to-orange-100 shadow-lg border-b-4 border-amber-200">
        <div className="max-w-4xl mx-auto px-4 py-4 lg:py-6">
          <div className="flex items-center justify-between">
            {/* Logo/Titre */}
            <div className="flex items-center space-x-3">
              <div className="bg-amber-200 p-2 lg:p-3 rounded-full shadow-md">
                <Camera className="h-6 w-6 lg:h-8 lg:w-8 text-amber-800" />
              </div>
              <div>
                <h1 className="text-lg lg:text-2xl font-bold text-amber-900 font-serif">
                  Restauration Lambretta LD125
                </h1>
                <p className="text-amber-700 text-xs lg:text-sm font-medium">
                  Modèle 1956 - Carnet de bord
                </p>
              </div>
            </div>

            {/* Navigation Desktop */}
            <nav className="hidden lg:flex items-center space-x-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => handlePageChange(item.key as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      currentPage === item.key
                        ? 'bg-amber-200 text-amber-900 shadow-md'
                        : 'text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {user && (
                <>
                  {isAdmin && (
                    <button
                      onClick={() => handlePageChange('admin')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        currentPage === 'admin'
                          ? 'bg-amber-200 text-amber-900 shadow-md'
                          : 'text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      <Camera className="h-4 w-4" />
                      <span>Administration</span>
                    </button>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-amber-700 hover:bg-amber-100 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Déconnexion</span>
                  </button>
                </>
              )}

              {!user && (
                <button
                  onClick={() => handlePageChange('login')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === 'login'
                      ? 'bg-amber-200 text-amber-900 shadow-md'
                      : 'text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Connexion
                </button>
              )}
            </nav>

            {/* Bouton Menu Mobile */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-amber-700 hover:bg-amber-100 transition-all"
              aria-label="Menu de navigation"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Menu Mobile */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t-2 border-amber-200 pt-4 relative z-20">
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handlePageChange(item.key as any)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all text-left ${
                        currentPage === item.key
                          ? 'bg-amber-200 text-amber-900 shadow-md'
                          : 'text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                {user && (
                  <>
                    {isAdmin && (
                      <button
                        onClick={() => handlePageChange('admin')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all text-left ${
                          currentPage === 'admin'
                            ? 'bg-amber-200 text-amber-900 shadow-md'
                            : 'text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        <Camera className="h-5 w-5" />
                        <span>Administration</span>
                      </button>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-amber-700 hover:bg-amber-100 transition-all text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Déconnexion</span>
                    </button>
                  </>
                )}

                {!user && (
                  <button
                    onClick={() => handlePageChange('login')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all text-left ${
                      currentPage === 'login'
                        ? 'bg-amber-200 text-amber-900 shadow-md'
                        : 'text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span>Connexion</span>
                  </button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Overlay pour fermer le menu mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-25 z-10"
          onClick={() => setMobileMenuOpen(false)}
          onTouchStart={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Contenu */}
      <main className="max-w-4xl mx-auto px-4 py-8 relative">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-amber-100 to-orange-100 border-t-2 border-amber-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => handlePageChange(item.key as any)}
                  className={`flex flex-col items-center space-y-1 px-2 py-3 rounded-lg font-medium transition-all text-xs ${
                    currentPage === item.key
                      ? 'bg-amber-200 text-amber-900 shadow-md'
                      : 'text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {user && (
            <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6 border-t-2 border-amber-200 pt-4">
              {isAdmin && (
                <button
                  onClick={() => handlePageChange('admin')}
                  className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                    currentPage === 'admin'
                      ? 'bg-amber-200 text-amber-900 shadow-md'
                      : 'text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  <span>Administration</span>
                </button>
              )}

              <button
                onClick={handleSignOut}
                className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium text-amber-700 hover:bg-amber-100 transition-all text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          )}

          {!user && (
            <div className="flex justify-center mb-6 border-t-2 border-amber-200 pt-4">
              <button
                onClick={() => handlePageChange('login')}
                className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  currentPage === 'login'
                    ? 'bg-amber-200 text-amber-900 shadow-md'
                    : 'text-amber-700 hover:bg-amber-100'
                }`}
              >
                <User className="h-4 w-4" />
                <span>Connexion</span>
              </button>
            </div>
          )}

          <div className="border-t-2 border-amber-200 pt-4 text-center">
            <p className="text-amber-700 font-medium text-xs lg:text-sm">
              Restauration avec passion • Lambretta LD125 1956
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
