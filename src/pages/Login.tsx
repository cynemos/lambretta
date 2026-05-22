import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogIn, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);

    if (error) {
      console.error('Erreur de connexion:', error);
      if (error.message.includes('invalid_credentials') || error.message.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect. Vérifiez vos identifiants.');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Veuillez confirmer votre email avant de vous connecter.');
      } else if (error.message.includes('Too many requests')) {
        setError('Trop de tentatives de connexion. Veuillez patienter quelques minutes.');
      } else {
        setError(`Erreur de connexion: ${error.message}`);
      }
    } else {
      onLoginSuccess();
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      {/* En-tête */}
      <div className="text-center mb-8">
        <div className="bg-amber-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <LogIn className="h-10 w-10 text-amber-800" />
        </div>
        <h2 className="text-3xl font-bold text-amber-900 mb-2 font-serif">
          Connexion Administrateur
        </h2>
        <p className="text-amber-700">
          Connectez-vous pour ajouter de nouvelles étapes
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border-4 border-amber-200 p-6 shadow-lg">
          {/* Email */}
          <div className="mb-6">
            <label htmlFor="email" className="block text-amber-900 font-semibold mb-3">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Adresse email</span>
              </div>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full p-4 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-amber-900 font-semibold mb-3">
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Mot de passe</span>
              </div>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-4 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
              required
            />
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-center space-x-3 text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Bouton de connexion */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center space-x-3 ${
            loading
              ? 'bg-amber-300 text-amber-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Connexion...</span>
            </>
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              <span>Se connecter</span>
            </>
          )}
        </button>
      </form>

      {/* Information */}
      <div className="mt-8 bg-amber-100 rounded-xl p-6 border-2 border-amber-200">
        <p className="text-amber-800 text-sm text-center">
          <strong>Accès réservé :</strong> Seul l'administrateur peut se connecter pour ajouter du contenu. 
          La timeline reste accessible à tous en lecture seule.
        </p>
        <div className="mt-4 pt-4 border-t border-amber-300">
          <p className="text-amber-700 text-xs text-center">
            <strong>Problème de connexion ?</strong><br/>
            Vérifiez que votre compte existe dans Supabase et que vos variables d'environnement sont correctement configurées.
          </p>
        </div>
      </div>
    </div>
  );
}
