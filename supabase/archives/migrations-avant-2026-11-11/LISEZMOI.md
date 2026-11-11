# Anciennes migrations (archivées le 11/11/2026)

Ces fichiers retracent l'historique de la base, mais **ne permettent pas de la reconstruire** :
plusieurs tables (`profiles`, `pieces`, `documents`, `before_after`, `vehicle_info`,
`owner_history`, `administrative_charges`…) avaient été créées à la main dans Supabase,
sans migration.

Ils sont remplacés par un fichier unique, vérifié en reconstruisant une base vierge :
[`supabase/migrations/20261111210000_schema_reference.sql`](../../migrations/20261111210000_schema_reference.sql).

Les deux dernières (`securite_admin` et `likes_summary`) avaient bien été appliquées ;
leur effet est inclus dans le schéma de référence.
