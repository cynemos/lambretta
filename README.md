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

## Sauvegardes

Chaque nuit à 3 h 30 (UTC), le script [`scripts/sauvegarde_lambretta.sh`](scripts/sauvegarde_lambretta.sh) sauvegarde :

- la **base de données** complète (`base.dump`, plus `roles.sql`) : contenu, comptes, règles d'accès ;
- les **fichiers** envoyés sur le site (`fichiers.tar.gz`) : photos, vidéos, avant/après, inventaire ;
- les **configurations** utiles pour tout reconstruire (Supabase, nginx, SSH, `.env` du site, version en ligne) ;
- un **inventaire** (nombre de publications, commentaires, pièces…) et les empreintes SHA-256 de chaque fichier.

Chaque sauvegarde est vérifiée (lisibilité de la base, intégrité de l'archive), gardée **7 jours sur le serveur**, puis copiée sur le **NAS** (monté en NFS sur `/mnt/nas-sauvegardes`, voir [`scripts/installer_montage_nas.sh`](scripts/installer_montage_nas.sh)). La copie est contrôlée par ses empreintes. Le NAS garde **30 jours**, plus la sauvegarde du 1er de chaque mois pendant **12 mois**.

- Journal : `~/sauvegardes/auto/journal.log`
- Dernier résultat : `~/sauvegardes/auto/ETAT` (`OK`, `PARTIEL` si le NAS était injoignable, ou `ECHEC`)

**Alertes sur téléphone** (application gratuite [ntfy](https://ntfy.sh)) :

- 🚨 **Échec** (priorité maximale) : sauvegarde impossible ou non vérifiée, avec la cause ;
- ⚠️ **NAS injoignable** : sauvegarde faite sur le serveur seulement ;
- ✅ **Bilan du lundi** : « tout va bien ». S'il n'arrive pas, c'est aussi un signal (serveur arrêté, tâche non lancée).

Le nom du canal ntfy, qui sert de mot de passe, est rangé sur le serveur dans `~/.config/lambretta-alerte` (`NTFY_CANAL=...`), jamais dans ce dépôt. Sans ce fichier, aucune alerte n'est envoyée. Pour recevoir les alertes : installer ntfy, appuyer sur **+** et saisir ce nom de canal. Pour forcer un bilan : `BILAN=1 ~/bin/sauvegarde_lambretta.sh`.

### Restaurer

```bash
S=/mnt/nas-sauvegardes/lambretta/AAAA-MM-JJ_HHMM      # sauvegarde choisie
( cd $S && sha256sum -c SHA256SUMS )                  # vérifier qu'elle est intacte
# Base : remplace le contenu actuel (à faire Supabase démarré)
docker exec -i supabase_db_supabase pg_restore -U postgres -d postgres --clean --if-exists --no-owner < $S/base.dump
# Fichiers : remet les photos et vidéos
gunzip -c $S/fichiers.tar.gz | docker exec -i supabase_storage_supabase tar -xf - -C /mnt
```

Comparer ensuite les chiffres de `$S/INVENTAIRE.txt` avec ceux du site. Les avertissements de `pg_restore` sur les fonctions internes de Supabase (`realtime`, `graphql`) sont normaux.

## Versions

Chaque commit porte un numéro de version, dans `package.json` et en étiquette git (`vX.Y.Z`). La version en ligne est affichée en bas de chaque page.

- Le dernier chiffre augmente pour une correction.
- Le chiffre du milieu augmente pour une nouveauté ou une refonte visible.

| Version | Contenu |
|---|---|
| **1.2.4** | Alertes de sauvegarde sur téléphone (ntfy) : échec avec sa cause, NAS injoignable, bilan chaque lundi |
| **1.2.3** | Sauvegardes automatiques chaque nuit (base, fichiers, configurations) vers le NAS, vérifiées et testées en restauration ; scripts dans `scripts/` |
| **1.2.2** | Ménage du code : plus aucune erreur de typage ni de lint, types précis à la place des `any` ; correction de la fenêtre de modification d'une publication (risque de plantage, texte d'une autre publication) |
| **1.2.1** | Cartes de chiffres et barres de filtres qui débordaient sur ordinateur et tablette ; ce README |
| **1.2.0** | Mise en page responsive (en-tête sur deux lignes, menu mobile), lettre d'introduction mise en forme, numéro de version affiché |
| **1.1.0** | Sécurité : écriture réservée à l'administrateur, commentaires des visiteurs réparés, « j'aime » protégés ; corrections du graphique de budget, des durées et du filtre par date |
| **1.0.0** | Version d'origine créée avec Bolt |
