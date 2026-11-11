// Une adresse par page : cyneprod.org/pieces, cyneprod.org/avant-apres…
// nginx renvoie index.html pour toute adresse, puis l'application affiche la bonne page.

export type Page =
  | 'timeline' | 'admin' | 'pieces' | 'fiche-technique' | 'time-tracking'
  | 'inventory' | 'statistics' | 'documents' | 'before-after' | 'login';

export const routes: Record<Page, { path: string; title: string }> = {
  timeline: { path: '/', title: 'Carnet de restauration' },
  'fiche-technique': { path: '/fiche-technique', title: 'Fiche technique' },
  pieces: { path: '/pieces', title: 'Pièces' },
  'time-tracking': { path: '/temps', title: 'Temps passé' },
  inventory: { path: '/inventaire', title: 'Inventaire' },
  statistics: { path: '/statistiques', title: 'Statistiques' },
  documents: { path: '/documents', title: 'Documents' },
  'before-after': { path: '/avant-apres', title: 'Avant / Après' },
  admin: { path: '/admin', title: 'Administration' },
  login: { path: '/connexion', title: 'Connexion' },
};

export const pathFor = (page: Page) => routes[page].path;

export function pageFromPath(pathname: string): Page {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const found = (Object.keys(routes) as Page[]).find(p => routes[p].path === clean);
  return found ?? 'timeline';
}

export function titleFor(page: Page) {
  const base = 'Restauration Lambretta LD125';
  return page === 'timeline' ? `${base} — Carnet de bord 1956` : `${routes[page].title} — ${base}`;
}
