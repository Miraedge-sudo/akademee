# Mise en place du CDN Cloudflare devant Akademee

Ce guide explique comment mettre **Cloudflare** (CDN edge + WAF) devant l'application
Akademee servie par nginx (Docker), afin de servir les assets statiques (JS/CSS hashed,
fonts, images) depuis les ~300 points de présence Cloudflare au lieu d'un seul serveur.

> Les images (logos, héros, galeries, avatars) sont déjà servies par le **CDN Cloudinary**
> avec transformations on-the-fly (`f_auto` → WebP/AVIF, `q_auto`, redimensionnement) :
> voir `backend/src/utils/imageUrl.js` et les services qui l'utilisent. Cloudflare ne
> s'occupe donc **que du frontend** (JS/CSS/fonts) et de la protection du domaine.

---

## 1. Ajouter le domaine à Cloudflare

1. Créer un compte sur [dash.cloudflare.com](https://dash.cloudflare.com) → **Add a site**.
2. Saisir le domaine racine (ex. `akademee.com`). Choisir le plan **Free** (suffisant pour
   le cache d'assets, Brotli, HTTP/3, SSL universel).
3. Cloudflare affiche 2 enregistrements NS à configurer chez le registrar (GoDaddy, OVH,
   Namecheap…) : remplacer les NS actuels par ceux de Cloudflare.
4. Attendre la propagation (quelques minutes à quelques heures).

## 2. Enregistrements DNS (proxy actif = nuage orange)

Depuis **DNS → Records** du domaine :

| Type | Nom | Cible / Valeur | Proxy |
|---|---|---|---|
| `A` | `@` | IP du VPS | ☁️ orange |
| `A` | `www` | IP du VPS | ☁️ orange |
| `CNAME` | `*` (wildcard) | IP du VPS (ou `@`) | ☁️ orange |

**Le wildcard `*` est indispensable** : chaque école a son sous-domaine
(`ecole.akademee.com`). Avec le proxy orange sur le wildcard, tous les sous-domaines
écoles passent par Cloudflare et héritent du certificat SSL universel wildcard.

## 3. SSL/TLS — mode *Full (strict)*

1. **SSL/TLS → Overview** : choisir **Full (strict)** (le backend nginx doit avoir un
   certificat valide — Let's Encrypt). En `Full (strict)`, Cloudflare valide le certificat
   d'origine à chaque connexion.
2. **Edge Certificates** :
   - Cocher **Always Use HTTPS** (redirection HTTP → HTTPS automatique).
   - **HTTP/3** : activé par défaut sur les zones Cloudflare (QUIC).
   - **Minimum TLS Version** : `1.2`.

## 4. Règles de cache (Cache Rules)

Cloudflare respecte les headers envoyés par nginx — nous les avons déjà configurés dans
`frontend/nginx.conf` :

- `index.html` → `Cache-Control: no-cache, must-revalidate` (toujours revalidé → les
  déploiements sont visibles immédiatement).
- `/assets/*` (Vite hashed) → `Cache-Control: public, max-age=31536000, immutable` +
  `Vary: Accept-Encoding`.
- `/api/*` → `Cache-Control: private, no-store` (jamais mis en cache par l'edge, pour
  préserver l'isolation multi-tenant).

Avec **Rules → Cache Rules**, ajouter une règle explicite pour renforcer le comportement :

| Règle | Expression | Action |
|---|---|---|
| Assets immutables | `http.request.uri.path starts_with "/assets/"` | **Cache Everything** — Edge TTL : 1 mois, Browser TTL : 1 an (respecte les headers d'origine) |
| API jamais en cache | `http.request.uri.path starts_with "/api/"` | **Bypass cache** |
| Pages HTML | `http.request.uri.path ends_with ".html" ou == "/"` | **Standard** (respecte `no-cache` d'origine) |

## 5. Optimisations (Speed)

1. **Speed → Optimization → Content Optimization** :
   - **Brotli** : activé par défaut (servi quand le navigateur le supporte, en plus du
     gzip d'nginx). Le header `Vary: Accept-Encoding` d'nginx assure la bonne
     différenciation des variantes compressées.
   - **Automatic HTTPS Rewrites** : activé.
2. **Speed → Optimization → Content Optimization → Images** : optionnel — nos images
   passent déjà par Cloudinary (`f_auto`), laisser désactivé pour ne pas re-compresser.

## 6. Sécurité (optionnel mais recommandé)

- **Security → Bots → Bot Fight Mode** : activer (bloque les bots, protège le login).
- **Security → WAF → Custom rules** : règle *managed challenge* sur `/api/auth/login`
  en cas d'attaque par force brute (le rate-limiter applicatif reste la première ligne).
- **Network → IPv6** : activer.

## 7. Vérification

Depuis un terminal, après propagation :

```bash
# Le proxy Cloudflare est actif si on voit les headers "cf-*"
curl -sI https://akademee.com | grep -iE "cf-ray|server|cf-cache-status"

# L'index n'est jamais en cache à l'edge
curl -sI https://akademee.com/ | grep -i cache-control
# → cache-control: no-cache, must-revalidate

# Les assets hashed sont immutables + cacheables par l'edge
curl -sI https://akademee.com/assets/index-<hash>.js | grep -iE "cache-control|cf-cache-status"
# → cache-control: public, max-age=31536000, immutable
# → cf-cache-status: HIT (au 2e appel)

# Une école (sous-domaine wildcard) passe aussi par l'edge
curl -sI https://ecole.akademee.com/ | grep -i cf-ray

# L'API n'est jamais mise en cache par l'edge
curl -sI https://akademee.com/api/health | grep -iE "cache-control|cf-cache-status"
# → cache-control: private, no-store
```

## 8. Effets attendus

- JS/CSS/fonts servis en **< 50 ms** depuis l'edge le plus proche de l'utilisateur
  (au lieu d'un aller-retour vers le VPS).
- **Brotli + HTTP/3** : transferts plus compacts et plus rapides (surtout sur mobile).
- Les pages école (`*.akademee.com`) héritent du même edge + SSL universel wildcard.
- Le premier chargement complet passe du **mono-serveur** (nginx + VPS) à un réseau CDN
  mondial, sans changer une ligne du frontend.

> **Rappel** : les données API (dashboard, listes…) ne passent pas par le CDN edge —
> elles restent protégées par l'isolation multi-tenant + le cache Redis scopé par école
> (N°1) + le cache react-query côté client (N°3).
