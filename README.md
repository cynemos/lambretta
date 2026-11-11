# Restauration Lambretta LD125 — Carnet de bord

Site de suivi de la restauration d'un scooter **Lambretta LD125 de 1956**, réalisé pour partager chaque étape avec mon père, à qui ce Lambretta a appartenu dans sa jeunesse.

🌐 **En ligne : [cyneprod.org](https://cyneprod.org)**

La consultation est libre : la famille et les amis peuvent suivre l'avancement, laisser un « j'aime » et commenter sans créer de compte. Seul l'administrateur peut ajouter ou modifier le contenu.

---

## Rubriques

| Rubrique | Contenu |
|---|---|
| **Timeline** | Les étapes de la restauration en photos, vidéos ou liens YouTube, avec recherche par mot-clé et par date, « j'aime » et commentaires |
| **Fiche technique** | Caractéristiques du véhicule et historique des propriétaires |
| **Pièces** | Achat du véhicule de base, pièces achetées (neuves ou d'occasion), coûts par catégorie |
| **Temps** | Sessions de travail, durée par catégorie (démontage, peinture, remontage…) |
| **Inventaire** | Pièces démontées : état constaté, action prévue, priorité, photos, commentaires |
| **Statistiques** | Temps total, budget cumulé mois par mois, répartition neuf / occasion, charges administratives |
| **Documents** | Factures et documents administratifs |
| **Avant / Après** | Photos comparatives de la transformation |

## Technique

- **Interface** : [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org), compilée avec [Vite 5](https://vitejs.dev)
- **Mise en forme** : [Tailwind CSS 3](https://tailwindcss.com), icônes [Lucide](https://lucide.dev)
- **Données, connexion, fichiers** : [Supabase](https://supabase.com) auto-hébergé (PostgreSQL + Auth + Storage)
- **Hébergement** : serveur Linux personnel, nginx en frontal (HTTPS Let's Encrypt)

Le projet a été démarré avec [Bolt](https://bolt.new) (dossier `.bolt/`), puis repris et maintenu à la main.

### Organisation du code

```
src/
├── App.tsx            Choix de la page affichée
├── components/        En-tête et pied de page (Layout), cartes, fenêtres de saisie…
├── hooks/             Accès aux données Supabase, une fonction par sujet (usePieces, useLikes…)
├── lib/supabase.ts    Connexion à Supabase et types des tables
└── pages/             Une page par rubrique, plus Admin et Login
supabase/migrations/   Évolutions successives de la base (tables, règles d'accès)
```

## Lancer le site sur son ordinateur

Prérequis : [Node.js](https://nodejs.org) 20 ou plus.

```bash
npm install
cp .env.example .env.local   # puis renseigner l'adresse et la clé publique Supabase
npm run dev                  # http://localhost:5173
```

Variables attendues dans `.env.local` (fichier ignoré par git) :

| Variable | Rôle |
|---|---|
| `VITE_SUPABASE_URL` | Adresse de l'API Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé **publique** Supabase (jamais la clé `service_role`) |

Autres commandes :

```bash
npm run build     # version de production dans dist/
npm run preview   # tester la version de production
npm run lint      # vérification du code
```

## Sécurité

Toutes les tables sont protégées par les règles d'accès de PostgreSQL (*Row Level Security*), définies dans `supabase/migrations/20261111180000_securite_admin.sql` :

- **Lecture publique** de tout le contenu affiché sur le site.
- **Écriture réservée à l'administrateur**, c'est-à-dire aux comptes dont le profil porte `is_admin = true`. Être simplement connecté ne suffit pas.
- **Commentaires** ouverts aux visiteurs, avec des limites de taille ; la modération est réservée à l'administrateur.
- **« J'aime »** gérés uniquement par deux fonctions (`like_status`, `toggle_like`) : un visiteur ne peut pas retirer le « j'aime » d'un autre.
- **Inscriptions fermées** côté Supabase : on ne peut pas se créer de compte depuis le site.
- Côté serveur, seuls les services utilisés par le site (`rest`, `auth`, `storage`, `realtime`) sont exposés publiquement ; les outils d'administration de Supabase ne le sont pas.

Pour donner les droits d'administrateur à un compte existant, en SQL sur le serveur :

```sql
UPDATE public.profiles SET is_admin = true WHERE id = '<identifiant du compte>';
```

## Mise en ligne

1. Pousser les modifications sur la branche `main`.
2. Sur le serveur, récupérer la branche, puis compiler dans un dossier à part : `npx vite build --outDir dist-new`.
3. Conserver l'ancienne version (`dist` → `dist.vX.Y.Z-date`), puis remplacer `dist` par `dist-new`. nginx sert directement le dossier `dist`.
4. Si une migration accompagne la version : sauvegarder la base (`pg_dump`), puis appliquer la migration **juste avant** de basculer le site.

## Versions

Chaque commit porte un numéro de version, dans `package.json` et en étiquette git (`vX.Y.Z`). La version en ligne est affichée en bas de chaque page.

- Le dernier chiffre augmente pour une correction.
- Le chiffre du milieu augmente pour une nouveauté ou une refonte visible.

| Version | Contenu |
|---|---|
| **1.2.1** | Cartes de chiffres et barres de filtres qui débordaient sur ordinateur et tablette ; ce README |
| **1.2.0** | Mise en page responsive (en-tête sur deux lignes, menu mobile), lettre d'introduction mise en forme, numéro de version affiché |
| **1.1.0** | Sécurité : écriture réservée à l'administrateur, commentaires des visiteurs réparés, « j'aime » protégés ; corrections du graphique de budget, des durées et du filtre par date |
| **1.0.0** | Version d'origine créée avec Bolt |
