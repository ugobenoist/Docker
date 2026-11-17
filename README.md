# Champions

Petite application web pour enregistrer des champions (nom, lane, région). L’API Express et PostgreSQL tournent ensemble avec Docker Compose. Les données restent dans un volume Docker nommé `donnees`.

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) démarré (Docker Engine + Compose)

## Configuration

À la racine du projet, crée un fichier `.env` (il n’est pas versionné) :

```env
POSTGRES_USER=champions
POSTGRES_PASSWORD=password
POSTGRES_DB=champions
POSTGRES_HOST=db
```

`POSTGRES_HOST` doit rester `db` : c’est le nom du service PostgreSQL dans `compose.yaml`. Compose injecte ces variables dans l’API et dans Postgres.

## Lancer le projet

Depuis la racine du dépôt :

```bash
docker compose up --build
```

Au premier démarrage, Compose construit l’image Node, démarre Postgres, puis l’API. L’API réessaie la connexion à la base toutes les 2 secondes tant que Postgres n’est pas prêt, puis crée la table `champions` si elle n’existe pas.

Ouvre ensuite [http://localhost:3000](http://localhost:3000).

Pour lancer en arrière-plan :

```bash
docker compose up --build -d
```

Logs de l’API :

```bash
docker compose logs -f api
```

Arrêt :

```bash
docker compose down
```

`docker compose down` arrête les conteneurs et garde le volume. Les champions déjà enregistrés sont toujours là au prochain `up`.

Pour tout effacer, y compris la base :

```bash
docker compose down -v
```

## Ce que tu peux vérifier

- La page d’accueil affiche le formulaire et la liste des champions.
- `GET http://localhost:3000/api/sante` renvoie l’état de l’API, de la base et le nom du conteneur.
- Un champion se crée depuis le formulaire, ou avec :

```bash
curl -X POST http://localhost:3000/api/champions ^
  -H "Content-Type: application/json" ^
  -d "{\"nom\":\"Ahri\",\"lane\":\"Mid\",\"region\":\"Ionia\"}"
```

Sous PowerShell, `curl` est un alias de `Invoke-WebRequest`. La commande ci-dessus fonctionne dans **cmd**. Dans PowerShell :

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/champions `
  -ContentType "application/json" `
  -Body '{"nom":"Ahri","lane":"Mid","region":"Ionia"}'
```

## Services

| Service | Image | Rôle | Port hôte |
| --- | --- | --- | --- |
| `api` | build local (`./app`) | Express, sert `index.html` et `/api/*` | 3000 |
| `db` | `postgres:18-alpine` | Base `champions` | aucun (réseau interne Compose) |
