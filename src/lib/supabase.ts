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
  fournisseur?: string;
  date_achat: string;
  date_installation?: string;
  notes?: string;
  created_at: string;
  user_id: string;
};

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
  seller_name?: string;
  seller_location?: string;
  vehicle_condition?: string;
  notes?: string;
  created_at: string;
  user_id: string;
};

export type TimeEntry = {
  id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  task_description: string;
  category: string;
  notes?: string;
  created_at: string;
  user_id: string;
};

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
