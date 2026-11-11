import React, { useState, useEffect } from 'react';
import type { TimeEntry, TimeEntryInput } from '../lib/supabase';
import { X, Save, Clock, Calendar, Tag, FileText, Loader2 } from 'lucide-react';

interface TimeEntryModalProps {
  timeEntry?: TimeEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (entryData: TimeEntryInput) => Promise<{ success: boolean; error?: string }>;
}

const CATEGORIES = [
  'Démontage',
  'Nettoyage',
  'Réparation moteur',
  'Carrosserie',
  'Peinture',
  'Électricité',
  'Remontage',
  'Réglages',
  'Recherche pièces',
  'Documentation',
  'Autre'
];

export function TimeEntryModal({ timeEntry, isOpen, onClose, onSave }: TimeEntryModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    duration_minutes: '',
    task_description: '',
    category: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (timeEntry) {
      setFormData({
        date: timeEntry.date,
        start_time: timeEntry.start_time || '',
        end_time: timeEntry.end_time || '',
        duration_minutes: timeEntry.duration_minutes.toString(),
        task_description: timeEntry.task_description,
        category: timeEntry.category,
        notes: timeEntry.notes || '',
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        duration_minutes: '',
        task_description: '',
        category: '',
        notes: '',
      });
    }
    setMessage(null);
  }, [timeEntry, isOpen]);

  if (!isOpen) return null;

  const calculateDuration = () => {
    if (formData.start_time && formData.end_time) {
      const start = new Date(`2000-01-01T${formData.start_time}`);
      const end = new Date(`2000-01-01T${formData.end_time}`);
      
      if (end > start) {
        const diffMs = end.getTime() - start.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        setFormData(prev => ({ ...prev, duration_minutes: diffMinutes.toString() }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.task_description.trim() || !formData.category || !formData.duration_minutes) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }

    const duration = parseInt(formData.duration_minutes);
    if (duration <= 0) {
      setMessage({ type: 'error', text: 'La durée doit être supérieure à 0.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const entryData = {
      ...formData,
      duration_minutes: duration,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      notes: formData.notes || null,
    };

    const result = await onSave(entryData);

    if (result.success) {
      setMessage({ type: 'success', text: timeEntry ? 'Session modifiée avec succès !' : 'Session ajoutée avec succès !' });
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1500);
    } else {
      setMessage({ type: 'error', text: result.error || 'Erreur lors de la sauvegarde.' });
    }

    setSaving(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl border-4 border-amber-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 px-6 py-4 border-b-2 border-amber-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-amber-900 font-serif">
            {timeEntry ? 'Modifier la session' : 'Ajouter une session de travail'}
          </h2>
          <button
            onClick={onClose}
            className="text-amber-700 hover:text-amber-900 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date */}
          <div>
            <label className="block text-amber-900 font-semibold mb-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Date de travail *</span>
              </div>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Heures et Durée */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-amber-900 font-semibold mb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Heure de début</span>
                </div>
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => {
                  handleChange('start_time', e.target.value);
                  setTimeout(calculateDuration, 100);
                }}
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-amber-900 font-semibold mb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Heure de fin</span>
                </div>
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => {
                  handleChange('end_time', e.target.value);
                  setTimeout(calculateDuration, 100);
                }}
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-amber-900 font-semibold mb-2">
                <span>Durée (minutes) *</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration_minutes}
                onChange={(e) => handleChange('duration_minutes', e.target.value)}
                placeholder="120"
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                required
              />
              {formData.duration_minutes && (
                <p className="text-xs text-amber-600 mt-1">
                  = {formatDuration(parseInt(formData.duration_minutes) || 0)}
                </p>
              )}
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-amber-900 font-semibold mb-2">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4" />
                <span>Catégorie de travail *</span>
              </div>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
              required
            >
              <option value="">Sélectionner une catégorie</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Description de la tâche */}
          <div>
            <label className="block text-amber-900 font-semibold mb-2">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Description de la tâche *</span>
              </div>
            </label>
            <textarea
              value={formData.task_description}
              onChange={(e) => handleChange('task_description', e.target.value)}
              placeholder="Décrivez le travail effectué..."
              className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors resize-none"
              rows={3}
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-amber-900 font-semibold mb-2">
              <span>Notes additionnelles</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Difficultés rencontrées, outils utilisés, remarques..."
              className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors resize-none"
              rows={2}
            />
          </div>

          {/* Message de statut */}
          {message && (
            <div className={`p-4 rounded-lg border-2 flex items-center space-x-3 ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <p className="font-medium">{message.text}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all flex items-center justify-center space-x-2 ${
                saving
                  ? 'bg-amber-300 text-amber-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{timeEntry ? 'Modifier' : 'Ajouter'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 rounded-lg font-bold text-amber-700 border-2 border-amber-200 hover:bg-amber-50 transition-all"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
