# Finance Pilot

Application web de **pilotage de budget personnel** : revenus, charges fixes, budgets annexes, immobilier locatif, investissements, pilotage mensuel, estimations et comparaison de scénarios. Interface **français / anglais**, thème clair / sombre / système.

Le simulateur est **utilisable sans compte** (données en session navigateur). Avec **PostgreSQL**, **NextAuth** et **Google OAuth** configurés, la sauvegarde **projets + état simulateur** peut être **synchronisée sur le serveur** pour les utilisateurs connectés.

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Pile technique](#pile-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Variables d’environnement](#variables-denvironnement)
- [Base de données et Prisma](#base-de-données-et-prisma)
- [Authentification (NextAuth + Google)](#authentification-nextauth--google)
- [Analytics (Matomo)](#analytics-matomo)
- [Développement](#développement)
- [Docker](#docker)
- [Production (build, PM2, nginx)](#production-build-pm2-nginx)
- [Persistance des données](#persistance-des-données)
- [Architecture et dossiers](#architecture-et-dossiers)
- [Routage](#routage)
- [Internationalisation](#internationalisation)
- [Qualité et contribution](#qualité-et-contribution)
- [Licence](#licence)

---

## Fonctionnalités

- Saisie des **revenus**, **charges fixes**, **budgets annexes**, **biens locatifs** et **investissements** avec normalisation et métriques dérivées.
- **Gestion mensuelle** : planification, coches par mois, graphiques.
- **Estimations**, **comparaison** de scénarios, graphiques (Recharts).
- **Projets enregistrés** : plusieurs jeux de données nommés, projet actif ; persistance **session** ou **serveur** selon la connexion.
- **Export / import JSON** (page Données).
- **Connexion Google** (optionnelle) et API **`/api/simulator/state`** pour un état JSON unique par utilisateur (Prisma).
- **Matomo** optionnel via variables `NEXT_PUBLIC_*` (voir [Analytics](#analytics-matomo)).

---

## Pile technique

| Domaine        | Technologie |
| -------------- | ----------- |
| Framework      | **Next.js 16** (App Router), **React 19**, **TypeScript** |
| Auth           | **NextAuth v4** (sessions en base), **@next-auth/prisma-adapter** |
| Données        | **PostgreSQL**, **Prisma 6** |
| UI             | **Tailwind CSS 4**, **Radix UI**, composants type shadcn (`components/ui/`) |
| Formulaires    | **react-hook-form**, **Zod** |
| i18n           | **i18next** / **react-i18next** (`locales/`) |
| Graphiques     | **Recharts** |
| Thème          | **next-themes** (clé `finance-pilot-theme`, migration depuis `budget-theme`) |

---

## Prérequis

- **Node.js** (LTS recommandé, compatible avec Next 16).
- **pnpm** (gestionnaire utilisé dans ce dépôt).
- **PostgreSQL** si vous activez la sauvegarde serveur et NextAuth (voir [Base de données](#base-de-données-et-prisma)).

---

## Installation

```bash
git clone <url-du-depot>
cd Budget-anticipation   # ou le nom de votre dossier cloné
pnpm install
```

`postinstall` exécute **`prisma generate`** (client Prisma).

Copiez le modèle d’environnement et adaptez les valeurs :

```bash
cp .env.example .env
# ou pour le dev local courant :
cp .env.example .env.local
```

Puis configurez au minimum `DATABASE_URL` si vous utilisez la base, et les variables NextAuth / Google si vous voulez la connexion (voir sections suivantes).

Démarrage du serveur de développement :

```bash
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## Variables d’environnement

La liste complète et les commentaires se trouvent dans :

- **`.env.example`** — modèle général (développement + documentation des clés).
- **`config/environments/production.env.example`** — modèle orienté **déploiement** (VM, nginx, PM2).

Variables principales :

| Variable | Rôle |
| -------- | ---- |
| `DATABASE_URL` | URL PostgreSQL pour Prisma / NextAuth. |
| `NEXTAUTH_SECRET` | Secret de signature des cookies (ex. `openssl rand -base64 32`). |
| `NEXTAUTH_URL` | URL publique de l’app (sans slash final), ex. `http://localhost:3000` ou `https://votre-domaine`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google côté serveur. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Même **client ID** que côté serveur : affichage du bouton de connexion côté client. |
| `NEXT_PUBLIC_APP_URL` | URL canonique du site (SEO, métadonnées, `metadataBase`). |
| `NEXT_PUBLIC_MATOMO_URL` / `NEXT_PUBLIC_MATOMO_SITE_ID` | Matomo ; les deux requis pour activer le script. |
| `NODE_ENV`, `PORT`, `HOSTNAME` | Surtout **production** ; voir `lib/env.ts` et `ecosystem.config.cjs`. |

**Important :** la CLI **Prisma** charge en priorité **`.env`**, pas `.env.local`. Pour `pnpm prisma db push`, exportez `DATABASE_URL` ou dupliquez-la dans `.env`.

---

## Base de données et Prisma

Le schéma (`prisma/schema.prisma`) inclut :

- Modèles **NextAuth** : `User`, `Account`, `Session`, `VerificationToken`.
- **`SimulatorState`** : un document JSON par utilisateur (`userId` unique).

Après avoir défini `DATABASE_URL` dans un fichier lu par Prisma :

```bash
pnpm prisma db push
```

*(ou `pnpm db:push`, alias défini dans `package.json`.)*

Pour des migrations versionnées en équipe :

```bash
pnpm db:migrate
```

En production, préférez `prisma migrate deploy` une fois les migrations générées et versionnées.

---

## Authentification (NextAuth + Google)

1. [Google Cloud Console](https://console.cloud.google.com/) : créer des identifiants **OAuth client ID** de type **Application Web**.
2. **URI de redirection autorisée** : `{NEXTAUTH_URL}/api/auth/callback/google` (exemple local : `http://localhost:3000/api/auth/callback/google`).
3. **Origines JavaScript** : même origine que `NEXTAUTH_URL` (schéma + hôte + port).
4. Renseigner `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` et `NEXTAUTH_URL` / `NEXTAUTH_SECRET` dans votre `.env`.

L’API route handler est dans `app/api/auth/[...nextauth]/route.ts` ; la configuration dans `lib/auth-options.ts`.

---

## Analytics (Matomo)

Si `NEXT_PUBLIC_MATOMO_URL` (URL de base valide **http/https**) et `NEXT_PUBLIC_MATOMO_SITE_ID` (entier, ex. `1`) sont définis, `app/layout.tsx` injecte le snippet Matomo (chargement paresseux). Sinon, aucun tracker n’est chargé.

---

## Développement

| Commande | Description |
| -------- | ----------- |
| `pnpm dev` | Serveur Next.js en mode développement. |
| `pnpm build` | Build de production. |
| `pnpm start` | Sert l’application après `build` (utilise `.env.production` si présent). |
| `pnpm lint` | ESLint sur le dépôt. |
| `pnpm db:push` | Applique le schéma Prisma sur la base (`prisma db push`). |
| `pnpm db:migrate` | Migrations interactives (`prisma migrate dev`). |

---

## Docker

Le dépôt fournit un **`Dockerfile`** (build multi-étapes Next.js **standalone** + Prisma) et un **`docker-compose.yml`** qui ne lance que le service **`app`**. Il **n’embarque pas** PostgreSQL : l’application se connecte à une base **déjà disponible** sur le réseau Docker externe **`postgres_network`** (host **`postgres`**, port **5432**, utilisateur typique **`admin`**), comme sur le VPS décrit dans **`.cursor/rules/infrastructure-vps.mdc`**.

### Prérequis

- **Docker** et **Docker Compose** (plugin `docker compose`).
- Le réseau **`postgres_network`** doit exister :

  ```bash
  docker network create postgres_network
  ```

- Une instance **PostgreSQL** joignable depuis ce réseau sous le nom **`postgres`**, avec une base (par défaut **`finance_pilot`**) et les droits pour l’utilisateur configuré.

### Variables d’environnement

À la racine du projet, copiez le modèle puis complétez au minimum la connexion à la base et les secrets NextAuth :

```bash
cp .env.example .env
```

Pour **`docker compose`**, vous pouvez soit définir une **`DATABASE_URL`** complète dans **`.env`** (prioritaire dans le compose), soit laisser le compose construire l’URL à partir de **`POSTGRES_PASSWORD`** (obligatoire dans ce cas), avec **`POSTGRES_USER`** (défaut `admin`) et **`POSTGRES_DB`** (défaut `finance_pilot`). Voir aussi les commentaires dans **`.env.example`**.

Pensez à aligner **`NEXTAUTH_URL`** sur l’URL réellement utilisée par le navigateur (local ou domaine derrière **Nginx Proxy Manager**).

### Build et démarrage

```bash
docker compose up --build -d
```

Le **`docker-compose.yml`** ne publie **aucun port** : sur le VPS, l’exposition se fait via **Nginx Proxy Manager** (ou un autre compose / `docker run -p …`) en pointant vers le conteneur sur le réseau Docker partagé. En local, pour tester dans le navigateur, ajoutez par exemple **`ports: ["3000:3000"]`** dans un fichier **`docker-compose.override.yml`** (non versionné) ou passez par la même stack proxy.

Next.js utilise la variable **`PORT`** si elle est définie par l’orchestrateur ; sinon le défaut interne est **3000** (écoute sur **`HOSTNAME`** déjà fixé à **`0.0.0.0`** dans l’image).

Le **Dockerfile** installe les dépendances avec **pnpm** et **`pnpm-lock.yaml`** uniquement dans les premières couches (**`pnpm fetch`** puis **`pnpm install --offline`**), puis copie le code dans l’étape **builder** : tant que le lockfile et **`prisma/`** sont stables, la couche des dépendances reste en cache même si le reste du code change.

Arrêt et suppression des conteneurs du projet :

```bash
docker compose down
```

### Schéma Prisma (premier déploiement ou évolution)

Sans service « migrate » dans le compose, les commandes Prisma s’exécutent **dans une tâche one-shot** réutilisant l’image de l’app :

```bash
# Si vous versionnez des migrations Prisma :
docker compose run --rm --entrypoint prisma app migrate deploy

# Sinon, alignement du schéma sur la base (comme `pnpm prisma db push`) :
docker compose run --rm --entrypoint prisma app db push
```

Optionnel : définir **`RUN_MIGRATIONS_ON_START=true`** dans l’environnement du service **`app`** pour exécuter **`prisma migrate deploy`** au démarrage du conteneur (voir **`docker-entrypoint.sh`**).

### Exposition (VPS)

Sur le serveur, l’app n’a en général **pas** besoin d’exposer le port publiquement : placez un **hôte proxy** (ex. **Nginx Proxy Manager**) devant le port interne du conteneur ou du socket, avec TLS (Certbot / Let’s Encrypt). Les règles d’infra partagée (Keycloak, NPM, etc.) sont détaillées dans **`.cursor/rules/infrastructure-vps.mdc`**.

---

## Production (build, PM2, nginx)

1. Variables : copier `config/environments/production.env.example` vers **`.env.production`** à la racine (voir commentaires dans le fichier).
2. Build : `pnpm build`.
3. **PM2** : `ecosystem.config.cjs` charge **`.env.production`** puis **`.env`** et démarre `pnpm start` avec `NODE_ENV`, `PORT`, `HOSTNAME` passés à l’app.

Exemple :

```bash
cp config/environments/production.env.example .env.production
# Éditer .env.production, puis :
pnpm build
pm2 start ecosystem.config.cjs
```

Placez **nginx** (ou équivalent) en reverse proxy vers `HOSTNAME:PORT` (souvent `127.0.0.1` et un port interne), avec TLS côté proxy.

---

## Persistance des données

| Contexte | Comportement |
| -------- | ------------ |
| **Non connecté** | Données du simulateur en **mémoire / session** (pas de `localStorage` pour le bundle principal géré par `SimulatorWorkspaceProvider`). Export JSON possible. |
| **Connecté** (OAuth + DB) | Chargement / enregistrement via **`GET` / `PUT` `/api/simulator/state`** et table `SimulatorState`. |

Les clés **thème** et **locale** peuvent rester dans le navigateur (voir `components/theme-provider.tsx`, `lib/i18n/`).

---

## Architecture et dossiers

```
app/                      # App Router : pages, layout, API routes
  api/auth/[...nextauth]/ # NextAuth
  api/simulator/state/    # État simulateur (authentifié)
components/               # UI métier (navigation, dashboard, SEO…)
components/ui/            # Primitives (shadcn / Radix)
config/environments/      # Modèles .env pour la production
contexts/                 # Contextes React (simulateur, auth serveur)
hooks/                    # Hooks (données financières dérivées du workspace)
lib/                      # Types, normalisation, auth, env, Prisma, i18n…
locales/                  # Traductions JSON (fr, en)
prisma/                   # schema.prisma
public/                   # Assets statiques
```

Flux simplifié côté simulateur :

- **`SimulatorWorkspaceProvider`** : bundle financier + projets + coches ; sync serveur si session valide.
- **`FinanceDataProvider`** : vue « finance » alignée sur le bundle du workspace (pages simulateur).

Les pages marketing (`/`, `/guides/*`, `/strategies-patrimoine`) **ne montent pas** les providers financiers lourds (`ConditionalFinanceProvider`).

---

## Routage

| Chemin | Rôle |
| ------ | ---- |
| `/` | Accueil, guides (`#guides`), liens vers le simulateur |
| `/guides/…` | Articles guides |
| `/strategies-patrimoine` | Page thématique budget & épargne |
| `/simulateur` | Hub des modules simulateur |
| `/simulateur/donnees` | Saisie + export / import JSON |
| `/simulateur/gestion-mensuel` | Pilotage mensuel |
| `/simulateur/estimations` | Estimations |
| `/simulateur/comparaison` | Comparaison |

Redirections **permanentes** (`next.config.mjs`) : `/donnees` → `/simulateur/donnees`, `/gestion-finances` → `/simulateur/gestion-mensuel`, `/estimations` → `/simulateur/estimations`, `/comparaison` → `/simulateur/comparaison`, `/guides` → `/#guides`.

Sur **petit écran**, les entrées du simulateur sont dans le **menu latéral** ; le compte connecté s’ouvre via l’**icône utilisateur** (menu nom + déconnexion).

---

## Internationalisation

- Fichiers : `locales/fr.json`, `locales/en.json`.
- Configuration : `lib/i18n/`, langues UI : `lib/ui-languages.ts`.
- Le sélecteur de langue est dans la navigation.

---

## Qualité et contribution

- Lancer **`pnpm lint`** avant une PR ou une release.
- Respecter les alias TypeScript (`@/components`, `@/lib`, `@/hooks`, etc.).
- **Next.js** : `typescript.ignoreBuildErrors` peut être activé dans `next.config.mjs` — vérifier les erreurs TypeScript en local malgré tout.

---

## Licence

À préciser selon votre choix (propriétaire, MIT, etc.).
