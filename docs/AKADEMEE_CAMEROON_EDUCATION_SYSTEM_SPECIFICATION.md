# AKADEMEE — Spécification Système de Gestion Scolaire

## 🎯 Vision

Devenir le système de gestion scolaire de référence au Cameroun, couvrant les **5 systèmes éducatifs camerounais** avec une conformité totale aux normes MINEDUB/MINESEC.

---

## 📚 Les 5 Systèmes Éducatifs Supportés

### 1. Anglophone Général
- **Niveaux :** Form 1→5, Lower 6th, Upper 6th
- **Examens :** GCE O Level, GCE A Level
- **Évaluation :** 3 Terms × 2 Sequences = 6/an
- **Coefficients :** 1 à 4
- **Streams :** General, Science, Arts, Commercial

### 2. Anglophone Technique
- **Niveaux :** Form 1→5, Lower 6th Tech, Upper 6th Tech
- **Examens :** GCE Technical, GTTC
- **Évaluation :** 3 Terms × 2 Sequences + Practical
- **Coefficients :** 1 à 4

### 3. Francophone Général
- **Niveaux :** 6ème→3ème→2nde→1ère→Tle
- **Examens :** BEPC, Probatoire, Baccalauréat
- **Évaluation :** 2 Semestres × (Compo + 2 CA)
- **Coefficients :** 1 à 9
- **Séries :** A4, B, C, D, E, F1, F2, G

### 4. Francophone Technique
- **Niveaux :** CAP 1→2, BEP 1→2, 1ère Tech., Tle Tech.
- **Examens :** CAP, BEP, Bac Technique
- **Évaluation :** 2 Semestres + Épreuves pratiques
- **Coefficients :** 1 à 9
- **Filières :** AEBA, TIG, TBB, TI, ELE, MEC

### 5. Université (LMD)
- **Niveaux :** L1→L3, M1→M2, Doctorat
- **Crédits ECTS :** 1 à 6 par UE
- **Types UE :** UEF, UEO, UET, UEL

---

## ✅ Backend — Complètement Implémenté

**Architecture :** Express.js, JWT auth, multi-tenant par sous-domaine, validation, cache, audit logs, rate limiting, Sentry, Swagger docs.
**Base de données :** PostgreSQL avec migrations et seeds.

| Module | Endpoints API | Statut |
|---|---|---|
| **Auth** | Login, register, logout, forgot/reset password, verify email, getCurrentUser | ✅ |
| **Écoles** | CRUD, plans, templates, vérification email, onboarding complet | ✅ |
| **Années académiques** | CRUD, activation/désactivation | ✅ |
| **Classes** | CRUD, assignation matières, assignation enseignant principal | ✅ |
| **Matières** | CRUD, coefficients, types, assignation multi-classes, évaluation pratique | ✅ |
| **Matières-classes** | Association matières↔classes | ✅ |
| **Matières-enseignants** | Association matières↔enseignants | ✅ |
| **Séries/Filières** | CRUD séries franco, filières techniques, streams anglo | ✅ |
| **Niveaux** | CRUD niveaux par système | ✅ |
| **Périodes** | CRUD trimestres/semestres | ✅ |
| **Étudiants** | CRUD avec photo, statut, historique | ✅ |
| **Tuteurs** | CRUD, association multi-enfants | ✅ |
| **Inscriptions** | CRUD, pré-inscription, validation, matricule | ✅ |
| **Pré-inscriptions (site)** | Soumission formulaire, gestion des demandes | ✅ |
| **Examens** | CRUD, types (GCE/BEPC/Probatoire/Bac/CAP), inscriptions examens | ✅ |
| **Notes** | CRUD, par étudiant/classe/période, calcul automatique, bulletins | ✅ |
| **Calcul notes** | Moyennes, classements | ✅ |
| **Présences** | CRUD, par étudiant/classe/date, statistiques | ✅ |
| **Statistiques présence** | Par étudiant, classe, tendances mensuelles | ✅ |
| **Frais** | CRUD types de frais, montants par classe | ✅ |
| **Calcul frais** | Statut étudiant, récapitulatif, recalcul global | ✅ |
| **Paiements** | CRUD, par étudiant, par école, génération rapports | ✅ |
| **Rapports** | Bulletins PDF, rapports de classe, performance étudiant, export | ✅ |
| **Dashboard** | Stats, activités récentes, revenus | ✅ |
| **Notifications** | Liste, marquer lu, compteur non-lus, suppression | ✅ |
| **Annonces** | CRUD, ciblage, publication | ✅ |
| **Utilisateurs** | Profil, mise à jour, changement mot de passe | ✅ |
| **Gestion utilisateurs** | CRUD (admin), liste avec pagination/recherche/rôle | ✅ |
| **Rôles** | CRUD, permissions, assignation | ✅ |
| **Audit** | Liste logs d'audit | ✅ |
| **Configuration** | Config système, domaines, tenant info | ✅ |
| **Site Web** | Données site public, mise à jour template | ✅ |
| **Média** | Upload Cloudinary | ✅ |
| **Email** | Service d'envoi email | ✅ |
| **Onboarding** | Configuration école complète en 5 étapes | ✅ |

**Total : 30+ modules backend, environ 150 endpoints API — tous fonctionnels.**

---

## ❌ Ce qui Manque pour un Système Parfait et Fonctionnel

### 🔴 Priorité Haute (Blocant pour le lancement)

| # | Fonctionnalité | Pourquoi |
|---|---|---|
| 1 | **Intégration Paiement Mobile** (MTN MoMo, Orange Money) | Les parents paient via mobile au Cameroun — indispensable |
| 2 | **Portail Parents complet** (notes enfants, absences, paiements, communications) | Les parents sont les utilisateurs finaux #1 |
| 3 | **Portail Enseignant complet** (saisie notes, présence, emploi du temps, communications) | Les enseignants saisissent les données chaque jour |
| 4 | **Portail Étudiant** (emploi du temps, notes, devoirs) | Attendu par les écoles |
| 5 | **Génération de documents PDF** (certificats de scolarité, relevés de notes, bulletins format officiel) | Requis par le MINEDUB/MINESEC |
| 6 | **Emploi du temps** (création manuelle & automatique, contraintes, publication) | Fonctionnalité de base attendue |

### 🟡 Priorité Moyenne (Important pour la complétude)

| # | Fonctionnalité | Pourquoi |
|---|---|---|
| 7 | **Conseils de Classe** (planification, PV, décisions passage/redoublement) | Obligatoire système francophone |
| 8 | **Bulletins conformes MINEDUB/MINESEC** (modèles officiels PDF) | Obligation légale |
| 9 | **Système LMD complet** (UEs, crédits ECTS, TP/TD séparés, validation UE) | Pour les écoles universitaires |
| 10 | **Messagerie/Chat** (administration↔parents, enseignants↔parents) | Communication directe |
| 11 | **Notifications WhatsApp & SMS** (en plus de l'email déjà fonctionnel) | Canal préféré des parents au Cameroun |
| 12 | **Applications Mobiles** (React Native / Flutter) — Parents, Enseignants, Étudiants | Concurrence (YADIKO, Go4School) a déjà des apps |
| 13 | **Architecture Offline-First / PWA** | Contexte camerounais (connexion internet instable) |

### 🟢 Priorité Faible (Futur / Innovation)

| # | Fonctionnalité |
|---|---|
| 14 | Authentification 2FA |
| 15 | Analytics avancés / IA (prédictions, détection risques) |
| 16 | Intégration GCE Board |
| 17 | Intégration MINEDUB/MINESEC (soumission électronique) |
| 18 | Multi-campus |
| 19 | Paie (salaires, fiches de paie) |
| 20 | Stock/Inventaire |
| 21 | Marketplace ressources pédagogiques |

---

## 🗺️ Roadmap Simplifiée

### Phase 1 — Consolidation (Urgent)
- Finaliser les pages frontend partiellement implémentées (examens, notes, bulletins, présence, finance)
- Implémenter les portails Enseignant, Parent, Étudiant
- Génération de documents PDF (certificats, bulletins)
- Emploi du temps basique

### Phase 2 — Paiements & Communication
- Intégration MTN MoMo, Orange Money
- Notifications WhatsApp & SMS
- Chat/Messagerie
- Conseils de classe

### Phase 3 — Université & Mobile
- Système LMD complet
- Applications mobiles (React Native)
- Architecture Offline-First (PWA)

### Phase 4 — Innovation
- Analytics IA, 2FA, intégrations externes (GCE Board, MINEDUB/MINESEC)
- Multi-campus, Paie, Stock
