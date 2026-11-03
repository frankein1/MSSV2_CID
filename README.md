# Mon Suivi Social

## Run on the anonymized DB (multi-structure POC, local only)

### Database setup

The anonymized dump is restored by the db-anonymizer, which rebuilds the schema from its allowlist
(`scheduler/db-anonymizer/config.ts`). `_prisma_migrations` is not on it, so the restored DB has no migration
history.

1. **Never run `prisma migrate deploy` on it**: with no `_prisma_migrations`, it would replay every migration from
   the first one.
2. Catch up the migrations newer than the dump by hand, **one `psql` call per migration, in order** (an enum
   `ADD VALUE` must be committed before a later migration uses the value):

   ```sh
   psql "XXX" -v ON_ERROR_STOP=1 -f prisma/migrations/<migration>/migration.sql
   ```

   "already exists" on an index migration can be expected if the index was added by hand: compare with
   `\pset pager off` + `SELECT pg_get_indexdef('<index>'::regclass);` instead of treating it as an error.

3. Run `VACUUM ANALYZE;` once after the restore. A freshly restored DB has no visibility map, so Postgres can't
   use index-only scans and reads table pages instead (seen 2026-11-03: the first-followup count went from a
   Bitmap Heap Scan to an Index Only Scan with `Heap Fetches: 0` after `VACUUM ANALYZE followup`). Production's
   autovacuum keeps it up to date, so query plans captured without it are pessimistic.
4. Check the indexes (restores before `15a9b1b7d` kept only primary keys): `\di social_support*`, `\di followup*`
   should list every index from the migrations, including `social_support_structure_id_social_support_type_idx`
   and the two partial indexes `followup_social_support_id_first_followup_idx` and
   `followup_social_support_id_is_during_walk_in_session_idx`.

### Run the app

1. Pick the structures in `server/plugins/multi-structure.ts`:
   - random pick: set `N_STRUCTURES` (number of structures) and `MIN_BENEFICIARIES_PER_STRUCTURE`
     (minimum beneficiaries for a structure to be eligible);
   - fixed pick (before/after comparisons): replace the random pick with a hard-coded `selected` id list
     (stats-history-count-perf captures use the 10 ids listed in ticket 24's Comments). Don't commit it.
2. Start the app against the anonymized DB: `DATABASE_URL=XXX LOG=prisma pnpm dev` (`XXX` = the anonymized DB
   connection string; `LOG=prisma` logs the Prisma queries). Check the `[multi-structure] Selected structure IDs:` line.
3. Log in without ProConnect: mint a session token (the `--tsconfig` is required, it resolves the `~/` / `~~/`
   aliases):

   ```sh
   source .env && DATABASE_URL=XXX pnpm tsx --tsconfig scheduler/tsconfig.json scripts/mint-local-token.ts [user-id]
   ```

   (same `DATABASE_URL` as step 2: the script looks the user up in that DB; `.env` only provides `NUXT_AUTH_JWT_KEY`
   here, which must match the running app's)

   - no `user-id`: first active StructureManager/SocialWorker;
   - stats captures: `b3511630-48be-4275-bcde-84a8ee7f87b2` (user of the 2026-10-01 captures);
   - the role must be StructureManager or SocialWorker (admin → `NOT_IMPLEMENTED`, Referent → different plans).

4. Paste the printed `document.cookie = "MSS_SESSION_TOKEN=…"` line in the browser console on localhost, then
   reload. The token lasts 10 hours.

### Capture query plans (`auto_explain`)

To log the `EXPLAIN ANALYZE` plan of every query the app runs (real parameters, no copy-paste), run on the
anonymized DB **before** loading the page (needs superuser; no restart, every new connection picks it up —
restart `pnpm dev` so Prisma's pool reconnects):

```sql
ALTER SYSTEM SET session_preload_libraries = 'auto_explain';
ALTER SYSTEM SET auto_explain.log_min_duration = 0;   -- 0 = log every statement; without it nothing is logged
ALTER SYSTEM SET auto_explain.log_analyze = on;       -- actual times/rows, not only estimates
ALTER SYSTEM SET auto_explain.log_buffers = on;
ALTER SYSTEM SET auto_explain.log_nested_statements = on;
ALTER SYSTEM SET auto_explain.log_format = 'text';
SELECT pg_reload_conf();
```

Plans go to the **Postgres server log** (not the `pnpm dev` output). Load the page twice and keep the second load
(warm cache). Note the local time of each load, then save that window from the container's log:

```sh
docker logs monsuivisocial_pg --since 2026-11-03T10:15:00 --until 2026-11-03T10:20:00 > <file>.txt 2>&1
grep -c 'plan:' <file>.txt   # 0 → auto_explain not active: restart `pnpm dev` after pg_reload_conf()
```

- `2>&1` is required: Postgres logs to stderr.
- `--since` / `--until` are local time; timestamps in the file are UTC.
- `monsuivisocial_pg` is the docker-compose container; check `docker ps` if the anonymized DB runs elsewhere.

**Turn it off afterwards** (`log_min_duration = 0` + `log_analyze` slow every query and flood the log):

```sql
ALTER SYSTEM RESET session_preload_libraries;
ALTER SYSTEM RESET auto_explain.log_min_duration;
ALTER SYSTEM RESET auto_explain.log_analyze;
ALTER SYSTEM RESET auto_explain.log_buffers;
ALTER SYSTEM RESET auto_explain.log_nested_statements;
ALTER SYSTEM RESET auto_explain.log_format;
SELECT pg_reload_conf();
```

![Coverage](https://gitlab.com/incubateur-territoires/startups/monsuivisocial/monsuivisocial-v2/badges/main/coverage.svg?job=pnpm:test)

[Mon Suivi Social](https://monsuivisocial.incubateur.anct.gouv.fr/) est une startup d'État portée par [beta.gouv.fr](beta.gouv.fr) et l'[Incubateur des Territoires](https://incubateur.anct.gouv.fr/).

Mon Suivi Social est un outil simple d'utilisation et complet pour gérer l'accompagnement social.

## Dépendances

Pour lancer le projet, vous avez besoin de :

- [Node.js](https://nodejs.org/en) v24
- [Docker](https://www.docker.com/)
- [pnpm](https://pnpm.io/) voir version dans `/package.json > "packageManager"`

## Technologies

Le projet utilise les technologies Node.js suivantes :

- [Nuxt](https://nuxt.com/)
- [Prisma](https://www.prisma.io/)

## Pour commencer

- Installez les dépendances Node.js

  ```sh
  pnpm install
  ```

- Copiez les variables d'environnement

  ```sh
  cp .env.sample .env
  ```

  Puis remplissez le fichier `.env` avec les valeurs manquantes.

- Démarrez la base de données Postgres, le stockage S3 via rustfs et le gestionnaire de clés de chiffrement OpenBao (utilise Docker)

  ```sh
  pnpm dev:db:start
  ```

  Un bucket S3 est automatiquement créé s'il n'existe pas.

  Une clé de chiffrement par défaut est créée avec des identifiants d'accès au KMS s'ils n'existent pas.

- Générez le client Prisma

  ```sh
  pnpm prisma generate
  ```

- Appliquez les migrations Prisma

  ```sh
  pnpm prisma migrate deploy
  ```

- Démarrez le serveur de développement

  ```sh
  pnpm dev
  ```

Il est alors disponible à l'adresse [localhost:3000](http://localhost:3000/).

### Données de test

Si besoin, il est possible d'alimenter la base de donnée avec des données de test en exécutant :

```sh
pnpm prisma db seed
```

### Envoi de mails en local

L'envoi de mail peut être configuré via l'outil [Mailtrap](https://mailtrap.io/email-sandbox/).

Une fois le compte créé, compléter les variables d'environnement `EMAIL_SMTP_USER`et `EMAIL_SMTP_PASSWORD` avec les
identifiants utilisateurs fournis par mailtrap.

### Interfaces d'administration locales

**Base de données** : l'ui Prisma Studio permet d'interagir avec la base de données via `pnpm prisma studio`

**Stockage S3** : rustfs met à disposition une console d'administration à `http://localhost:9011` (login: $S3_ACCESS_KEY_ID - mot de passe: S3_SECRET_ACCESS_KEY)

**Gestionnaire de clés de chiffrements** : OpenBao met à disposition une console d'administration à `http://localhost:9110/ui` (login: admin - mot de passe: admin)

## Tests

On part d'une base de données vide pour les tests (si besoin on
supprime son contenu avec `docker compose -f docker-compose.dev.yml down -v`)

```
pnpm dev:db:start
pnpm prisma migrate deploy
pnpm prisma db seed
pnpm test
```

### Tests end-to-end

La version de playwright doit être précisée dans `.gitlab-ci.yml`.

```
pnpm dev:db:start
pnpm prisma migrate deploy
pnpm prisma db seed
pnpm test:e2e
```

### Validations locales

Un hook de precommit est mis en place avec husky.

Par défaut il exécute l'étape `lint-staged` puis la vérification
de secret présent dans le nouveau code avec [talisman](https://github.com/thoughtworks/talisman).

Ce hook est surchargeable par un script à intégrer dans `scripts/custom-pre-commit.sh` ce qui permet de gérer des exécutions
dans des microVMs par exemple comme [agent-vm](https://github.com/sylvinus/agent-vm/tree/main) ou [docker sandbox](https://docs.docker.com/ai/sandboxes/).

Exemple de script pour exécuter le hook dans une sandbox docker :

```sh
SANDBOX_NAME=monsuivisocial-sbx
sbx exec $SANDBOX_NAME bash -lc "pnpm lint-staged && talisman --githook pre-commit" || exit 1
```

## Déploiement

Mon Suivi Social est hébergé sur Scalingo. Le déploiement d'effectue en local depuis la branche main à jour.

```
pnpm release --no-verify
git push --follow-tags origin main
```

La création d'un tag génère une action de de déploiement sur l'environnement de demo. Le
déploiement en production est une action manuelle à réaliser depuis le pipeline de CI.

## Exécutions planifiées

Les exécutions planifiées se déroulent dans un serveur secondaire.

Pour compiler les tâches du serveur secondaire : `pnpm build:scheduler`.

Pour lancer le serveur secondaire : `pnpm start:scheduler`.

### Environnement Scalingo

Démarrage du serveur de gestion de tâches

```
scalingo --app my-app scale scheduler:1
```

### Lancement manuel des tâches planifiées

Un lancement en ligne de commande peut être effectué à des fins de test ou de debug depuis un container one-off scalingo.

```
node .output-scheduler_caller/_caller.mjs <nom_tâche>
```

`node .output-scheduler_caller/_caller.mjs` permet d'afficher la liste des tâches disponibles.

## Antisèche

- Générer une migration Prisma suite à une modification du schéma

  ```sh
  pnpm prisma migrate dev --name [MIGRATION_NAME]
  ```

## Conventions de code

Au-delà des conventions définies grâce aux _linters_ et _formatters_ ESLint, Stylelint et Prettier, le projet suis les [conventions de code proposées par la communauté de Vue.js](https://vuejs.org/style-guide/).

En supplément, deux choix ont été faits sur le nommage des composants :

- Le préfixe `Atom` a été choisi pour les [composants de base](https://vuejs.org/style-guide/rules-strongly-recommended.html#base-component-names),
- Le préfixe `The` a été choisi pour les [composants à instance unique](https://vuejs.org/style-guide/rules-strongly-recommended.html#single-instance-component-names).

## Environnements

L'application de Mon Suivi Social existe sur plusieurs environnements :

- production :
  - Lien d'accès : https://monsuivisocial-app.incubateur.anct.gouv.fr/
  - Mode de déploiement : `pnpm release`
- développement :
  - Lien d'accès : https://monsuivisocial-app.dev.incubateur.anct.gouv.fr/
  - Mode de déploiement : Poussée sur la branche `main`
