import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { Timeline } from './pages/Timeline';
import { Admin } from './pages/Admin';
import { Pieces } from './pages/Pieces';
import { FicheTechnique } from './pages/FicheTechnique';
import { TimeTracking } from './pages/TimeTracking';
import { Inventory } from './pages/Inventory';
import { Statistics } from './pages/Statistics';
import { Documents } from './pages/Documents';
import { BeforeAfter } from './pages/BeforeAfter';
import { Login } from './pages/Login';
import { Loader2 } from 'lucide-react';

type Page = 'timeline' | 'admin' | 'pieces' | 'fiche-technique' | 'time-tracking' | 'inventory' | 'statistics' | 'documents' | 'before-after' | 'login';

function App() {
  const { user, isAdmin, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('timeline');

  // Rediriger automatiquement vers timeline si non-admin tente d'accéder à admin
  const handlePageChange = (page: Page) => {
    if (page === 'admin' && !user) {
      setCurrentPage('login');
    } else {
      setCurrentPage(page);
    }
  };

  // Redirection après connexion réussie
  const handleLoginSuccess = () => {
    setCurrentPage('admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-amber-700 font-medium text-lg">
            Chargement de l'application...
          </p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'timeline':
        return <Timeline />;
      case 'admin':
        if (isAdmin) return <Admin />;
        if (user) {
          return (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-8 text-center">
              <p className="text-amber-900 font-medium">
                Ce compte n'a pas les droits d'administration.
              </p>
            </div>
          );
        }
        return <Login onLoginSuccess={handleLoginSuccess} />;
      case 'pieces':
        return <Pieces />;
      case 'fiche-technique':
        return <FicheTechnique />;
      case 'time-tracking':
        return <TimeTracking />;
      case 'inventory':
        return <Inventory />;
      case 'statistics':
        return <Statistics />;
      case 'documents':
        return <Documents />;
      case 'before-after':
        return <BeforeAfter />;
      case 'login':
        return <Login onLoginSuccess={handleLoginSuccess} />;
      default:
        return <Timeline />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={handlePageChange}>
      {renderPage()}
    </Layout>
  );
}

export default App;
