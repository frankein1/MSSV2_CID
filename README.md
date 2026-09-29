# Mon Suivi Social

`source .env && pnpm tsx --tsconfig scheduler/tsconfig.json scripts/mint-local-token.ts`

In `server/plugins/multi-structure.ts` :

- enter number of structure
- enter threshold of beneficiaries per structure to be selected

`LOG=prisma pnpm dev`

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
