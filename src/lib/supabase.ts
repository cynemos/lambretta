import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: options.signal || AbortSignal.timeout(10000),
      });
    },
  },
});

export type Publication = {
  id: string;
  created_at: string;
  media_url: string;
  media_type: 'image' | 'video' | 'youtube';
  commentaire: string;
  user_id: string;
};

export type Piece = {
  id: string;
  nom: string;
  categorie: string;
  etat: 'neuve' | 'occasion';
  prix: number;
  fournisseur?: string | null;
  date_achat: string;
  date_installation?: string | null;
  notes?: string | null;
  inventory_part_id?: string | null;
  created_at: string;
  user_id: string;
};

// Données saisies dans les formulaires (l'identifiant, la date de création
// et l'auteur sont ajoutés au moment de l'enregistrement)
export type PieceInput = Omit<Piece, 'id' | 'created_at' | 'user_id'>;

export type Comment = {
  id: string;
  publication_id: string;
  author_name: string;
  author_email: string;
  content: string;
  created_at: string;
  is_approved: boolean;
};

export type BasePurchase = {
  id: string;
  vehicle_name: string;
  purchase_price: number;
  purchase_date: string;
  seller_name?: string | null;
  seller_location?: string | null;
  vehicle_condition?: string | null;
  notes?: string | null;
  created_at: string;
  user_id: string;
};

export type BasePurchaseInput = Omit<BasePurchase, 'id' | 'created_at' | 'user_id'>;

export type TimeEntry = {
  id: string;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  duration_minutes: number;
  task_description: string;
  category: string;
  notes?: string | null;
  created_at: string;
  user_id: string;
};

export type TimeEntryInput = Omit<TimeEntry, 'id' | 'created_at' | 'user_id'>;

export type Document = {
  id: string;
  created_at: string;
  title: string;
  category: 'facture' | 'doc_administratif';
  url: string;
  description: string;
  user_id: string;
};

export type BeforeAfter = {
  id: string;
  created_at: string;
  title: string;
  description: string;
  before_url: string;
  after_url: string;
  user_id: string;
};
