# Spécification des Données de Seed — Akademee

## Objectif

Créer un script d'injection SQL (`seed-full-school.sql`) qui peuple une base de données Akademee avec des données réalistes pour **un établissement scolaire camerounais complet**, permettant de :
- Tester toutes les fonctionnalités de bout en bout
- Visualiser des dashboards avec des données réelles
- Présenter la plateforme à des clients potentiels

---

## 🏫 1. Établissement (schools)

**Nom :** "Groupe Scolaire Les Palmiers"
**Type :** Établissement privé laïc
**Ville :** Yaoundé
**Région :** Centre
**Sous-domaine :** palmiers

### Informations générales
```
name: "Groupe Scolaire Les Palmiers"
tagline: "L'excellence pour tous"
subdomain: "palmiers"
email: "contact@gspalmiers.cm"
phone: "+237 677 123 456"
address: "Bastos, BP 1234 Yaoundé"
city: "Yaoundé"
region: "Centre"
primary_color: "#1B4965"  (bleu foncé professionnel)
year_founded: "1998"

educational_systems: [
  { code: "FRANCO_GENERAL", label: "Francophone Général", active: true },
  { code: "FRANCO_TECHNIQUE", label: "Francophone Technique", active: true },
  { code: "ANGLO_GENERAL", label: "Anglophone General", active: false },
  { code: "ANGLO_TECHNIQUE", label: "Anglophone Technical", active: false },
  { code: "UNIVERSITY", label: "Université LMD", active: false }
]

logo_url: "https://res.cloudinary.com/.../logo-palmiers.png" (à uploader sur Cloudinary)
hero_image_url: "https://res.cloudinary.com/.../hero-palmiers.jpg" (photo d'école)
```

### Équipe administrative (users + roles)
| Rôle | Nom | Email | 
|------|-----|-------|
| ADMIN | Jean-Pierre Mengue | jp.mengue@gspalmiers.cm |
| ADMIN | Esther Nkoa | e.nkoa@gspalmiers.cm |
| ACCOUNTANT | Paul Biyong | p.biyong@gspalmiers.cm |
| ACCOUNTANT | Marie-Chantal Essono | mc.essono@gspalmiers.cm |
| TEACHER | (voir section enseignants) | |

---

## 📚 2. Année Académique & Périodes

### Année académique
```
name: "2025-2026"
start_date: "2025-09-01"
end_date: "2026-08-31"
is_current: true
```

### Périodes (système francophone — 2 semestres)
| Période | Type | Date début | Date fin |
|---------|------|-----------|---------|
| Semestre 1 | SEMESTER | 2025-09-01 | 2026-01-15 |
| Séquence 1.1 | SEQUENCE | 2025-09-01 | 2025-10-31 |
| Séquence 1.2 | SEQUENCE | 2025-11-01 | 2026-01-15 |
| Compo S1 | EXAM | 2026-01-05 | 2026-01-15 |
| Semestre 2 | SEMESTER | 2026-01-16 | 2026-08-31 |
| Séquence 2.1 | SEQUENCE | 2026-01-16 | 2026-03-31 |
| Séquence 2.2 | SEQUENCE | 2026-04-01 | 2026-06-15 |
| Compo S2 | EXAM | 2026-06-01 | 2026-06-15 |

---

## 📊 3. Niveaux & Séries (system_levels, system_series)

### Niveaux Francophone Général
| Niveau | Ordre | Code |
|--------|-------|------|
| 6ème | 1 | 6E |
| 5ème | 2 | 5E |
| 4ème | 3 | 4E |
| 3ème | 4 | 3E |
| 2nde C | 5 | 2NDE_C |
| 2nde A | 6 | 2NDE_A |
| 1ère C | 7 | 1ERE_C |
| 1ère A | 8 | 1ERE_A |
| 1ère D | 9 | 1ERE_D |
| Tle C | 10 | TLE_C |
| Tle A | 11 | TLE_A |
| Tle D | 12 | TLE_D |

### Niveaux Francophone Technique
| Niveau | Ordre | Filières disponibles |
|--------|-------|---------------------|
| 2nde T | 1 | TIG, TBB, TI |
| 1ère T | 2 | TIG, TBB, TI |
| Tle T | 3 | TIG, TBB, TI |

### Séries/Filières
| Série | Nom | Système |
|-------|-----|---------|
| A | Série A — Littéraire | FRANCO_GENERAL |
| C | Série C — Mathématiques | FRANCO_GENERAL |
| D | Série D — Sciences | FRANCO_GENERAL |
| TIG | Technicien Info-Gestion | FRANCO_TECHNIQUE |
| TBB | Technicien Bâtiment-Bois | FRANCO_TECHNIQUE |
| TI | Technicien Informatique | FRANCO_TECHNIQUE |

---

## 🏫 4. Classes

Pour générer 15-20 classes, réparties sur tous les niveaux :

| Classe | Niveau | Série | Effectif | Enseignant principal |
|--------|--------|-------|----------|---------------------|
| 6ème A | 6E | — | 45 | Mme. Biloa |
| 6ème B | 6E | — | 43 | M. Tchinda |
| 5ème A | 5E | — | 40 | M. Simo |
| 4ème A | 4E | — | 38 | M. Njike |
| 4ème B | 4E | — | 36 | Mme. Atangana |
| 3ème A | 3E | — | 35 | M. Nkili |
| 3ème B | 3E | — | 33 | M. Eyenga |
| 2nde C | 2NDE_C | C | 30 | M. Owona |
| 2nde A | 2NDE_A | A | 35 | Mme. Fouda |
| 1ère C | 1ERE_C | C | 25 | M. Ngono |
| 1ère A | 1ERE_A | A | 30 | M. Etoa |
| 1ère D | 1ERE_D | D | 28 | Mme. Zanga |
| Tle C | TLE_C | C | 22 | M. Eboué |
| Tle A | TLE_A | A | 28 | Mme. Ngo |
| Tle D | TLE_D | D | 25 | M. Mbarga |
| 2nde TIG | 2NDE_T | TIG | 20 | M. Momo |
| 1ère TIG | 1ERE_T | TIG | 18 | Mme. Ntsama |
| Tle TIG | TLE_T | TIG | 15 | M. Bodo |

---

## 👨‍🏫 5. Enseignants (TEACHER) — 15-20 profs

Créer des comptes `TEACHER` réalistes avec login_email format `prenom.nom.teacher@gspalmiers.cm` :

| Nom complet | Spécialité | Classes assignées | 
|-------------|-----------|------------------|
| Jean Biloa | Maths | 6A, 5A, 4A |
| Pierre Tchinda | Maths | 6B, 4B, 3A |
| Joseph Simo | Français | 6A, 6B, 5A, 4A |
| Thomas Njike | Histoire-Géo | 6A, 6B, 5A, 4A, 4B |
| Jeanne Atangana | Anglais | 6A, 5A, 4A, 3A, 2C, 1C, TleC |
| Sébastien Nkili | SVT | 4A, 3A, 2C, 1D, TleD |
| Jean-Pierre Eyenga | Physique-Chimie | 3A, 3B, 2C, 1C, 1D, TleC, TleD |
| Michel Owona | Maths | 2C, 1C, TleC |
| Christine Fouda | Français | 2A, 1A, TleA |
| Paul Ngono | Physique | 1C, TleC, 2C |
| Jacques Etoa | Philo | TleA, TleD, 1A |
| Martine Zanga | Anglais | 2A, 1A, TleA, 2D, 1D |
| Pierre Eboué | Maths | TleD, 1D |
| Sylvie Ngo | Espagnol | 2A, 1A, TleA, 4A |
| Lucien Mbarga | SVT | 4B, 3B, 2A |
| Hervé Momo | Informatique | 2TIG, 1TIG, TleTIG |
| Esther Ntsama | Comptabilité | 2TIG, 1TIG, TleTIG |
| Gaston Bodo | Génie Civil | 1TIG, TleTIG |

Chaque enseignant doit être assigné aux classes (`class_teachers`) et aux matières (`subject_teachers`) correspondantes.

---

## 👨‍🎓 6. Élèves (STUDENT) — 200+ élèves

### Répartition par classe
| Classe | Effectif | 
|--------|----------|
| 6ème A | 25 |
| 6ème B | 23 |
| 5ème A | 20 |
| 4ème A | 18 |
| 4ème B | 16 |
| 3ème A | 15 |
| 3ème B | 13 |
| 2nde C | 12 |
| 2nde A | 15 |
| 1ère C | 10 |
| 1ère A | 12 |
| 1ère D | 10 |
| Tle C | 8 |
| Tle A | 10 |
| Tle D | 8 |
| 2nde TIG | 6 |
| 1ère TIG | 5 |
| Tle TIG | 4 |

**Total ≈ 230 élèves**

### Générateur de noms camerounais
Utiliser une liste de **prénoms** et **noms** typiquement camerounais :

**Prénoms (garçons) :**
Jean, Pierre, Paul, Jacques, Michel, Thomas, Joseph, David, Emmanuel, Samuel, André, François, Alain, Louis, Charles, Henri, Roger, Lucien, Marcel, Albert, Bernard, Daniel, Étienne, Félix, Georges, Gilbert, Honoré, Isidore, Jules, Léon, Mathieu, Nicolas, Olivier, Patrice, Quentin, Raymond, Serge, Théophile, Urbain, Victor, Willy, Xavier, Yves, Zéphyrin, Brice, Christian, Didier, Éric, Fabrice, Gervais, Hilaire, Irénée, Joël, Kévine, Landry, Martin, Noël, Omer, Pascal, Rodrigue, Stéphane, Télesphore, Valère

**Prénoms (filles) :**
Marie, Jeanne, Jeanne d'Arc, Rose, Anne, Claire, Louise, Françoise, Pauline, Thérèse, Bernadette, Cécile, Denise, Élisabeth, Geneviève, Henriette, Irène, Jacqueline, Karine, Laurence, Monique, Nicole, Odette, Paule, Rachel, Simone, Tatiana, Ursule, Viviane, Yolande, Zita, Adèle, Berthe, Charlotte, Delphine, Eugénie, Flore, Georgette, Hermine, Inès, Joséphine, Lucie, Marguerite, Noëlle, Odile, Patricia, Reine, Suzanne, Aline, Béatrice, Corine, Danielle, Esther, Fabienne, Ginette, Hortense, Ida, Judith, Laure, Mireille

**Noms de famille :**
Ngo, Biloa, Tchinda, Simo, Njike, Atangana, Nkili, Eyenga, Owona, Fouda, Ngono, Etoa, Zanga, Eboué, Mbarga, Momo, Ntsama, Bodo, Mengue, Nkoa, Biyong, Essono, Ngono, Mvondo, Onguéné, Ewolo, Mbah, Nkengue, Nlend, Tchoumi, Kamga, Djeukam, Tadjou, Mefire, Ndjock, Yomi, Ekanga, Molo, Song, Ekwé, Mbida, Nkili, Essomba, Eyango, Mbezele, Ngassam, Ngoa, Tchinda, Abega, Ngom, Momha, Nkongo, Mvilongo, Eyoum, Mbock, Ntsama

### Matricules
Format : `GSP-ANNEE-NUMERO` (ex: `GSP-2025-0001`)
Démarrer à 0001 et incrémenter séquentiellement par ordre d'inscription.

### Photos
Utiliser des avatars génériques depuis `https://i.pravatar.cc/150?u=student-{id}` ou des APIs similaires.
Ou utiliser des photos placeholder : `https://ui-avatars.com/api/?name={prenom}+{nom}&background=1B4965&color=fff`

### Tuteurs (guardians)
Pour chaque élève, créer 1-2 tuteurs avec des relations réalistes :
- 70% ont un père (`father`) et une mère (`mother`)
- 20% ont un seul parent (monoparental)
- 10% ont un tuteur (`guardian`)

**Professions typiques des parents :** Fonctionnaire, Enseignant, Commerçant, Agriculteur, Chauffeur, Infirmier, Avocat, Ingénieur, Banquier, Artisan, Ménagère, Entrepreneur

---

## 📋 7. Matières (subjects)

### Second cycle (2nde → Tle)
| Matière | Coefficient | 
|---------|-------------|
| Mathématiques | 5 |
| Français | 4 |
| Anglais | 3 |
| Allemand | 2 |
| Espagnol | 2 |
| Physique-Chimie | 4 |
| SVT | 3 |
| Histoire-Géo | 3 |
| Philosophie | 2 |
| EPS | 1 |
| Informatique | 1 |

### Premier cycle (6ème → 3ème)
| Matière | Coefficient |
|---------|-------------|
| Mathématiques | 4 |
| Français | 5 |
| Anglais | 3 |
| Allemand | 2 |
| Espagnol | 2 |
| Physique-Chimie | 2 |
| SVT | 2 |
| Histoire-Géo | 3 |
| EPS | 1 |
| Informatique | 1 |

### Filières techniques (TIG — ajouts supplémentaires)
| Matière | Coefficient |
|---------|-------------|
| Informatique Générale | 4 |
| Comptabilité | 3 |
| Économie | 2 |
| Droit | 2 |
| Techniques Quantitatives | 3 |
| Bureautique | 2 |
| Projet Professionnel | 2 |

Assigner chaque matière aux classes appropriées via `class_subjects` et `subject_teachers`.

---

## 💰 8. Frais (fees) & Paiements

### Types de frais — Applicables à tous les niveaux
| Frais | Montant | Date échéance |
|-------|---------|--------------|
| Frais d'inscription | 25 000 FCFA | 2025-10-15 |
| Frais de scolarité S1 | 150 000 FCFA | 2025-11-30 |
| Frais de scolarité S2 | 150 000 FCFA | 2026-03-31 |
| Frais d'APEE (parents) | 5 000 FCFA | 2025-10-31 |
| Assurance scolaire | 3 000 FCFA | 2025-10-15 |
| Kit pédagogique | 15 000 FCFA | 2025-10-31 |
| Tenue scolaire (complet) | 12 000 FCFA | 2025-11-15 |

### Frais spécifiques aux filières techniques
| Frais | Montant | Niveaux |
|-------|---------|---------|
| Frais d'atelier | 25 000 FCFA | 2TIG, 1TIG, TleTIG |
| Kit informatique | 50 000 FCFA | 2TIG, 1TIG, TleTIG |

### Frais spécifiques terminales
| Frais | Montant | Niveaux |
|-------|---------|---------|
| Préparation Bac | 20 000 FCFA | TleC, TleA, TleD, TleTIG |
| Frais d'examen | 15 000 FCFA | TleC, TleA, TleD, TleTIG |

### Assignation aux classes
Chaque classe reçoit les frais de base + les frais spécifiques selon son niveau.

### Paiements enregistrés
Créer un historique de paiements réaliste (juillet 2025 → juillet 2026) :

**Règles de génération :**
- 30% des élèves ont **payé la totalité** (statut = 'paid')
- 40% ont **payé partiellement** (statut = 'partial') : ont payé au moins les frais d'inscription + APEE
- 20% ont **très peu payé** (statut = 'partial') : seulement l'inscription
- 10% **n'ont rien payé** du tout (statut = 'pending')

**Détails des paiements :**
- Méthodes : `cash` (60%), `mobile_money` (25%), `bank_transfer` (10%), `cheque` (5%)
- Références : `RCP-XXXX` (hex) pour cash/cheque, `MOMO-{numero}` pour mobile money
- Montants aléatoires mais cohérents avec les frais
- Dates échelonnées sur l'année académique
- `fee_id` doit référencer le fee correspondant dans la table fees

**Backfill important :** Après avoir inséré les paiements, exécuter la logique de backfill (mise à jour de `student_fees.amount_paid` et `students.fee_status`) pour que tout soit synchronisé.

---

## 📝 9. Notes & Résultats (grades)

### Distribution des notes
Générer des notes pour chaque élève, par matière et par séquence :

- **Matières principales** (Maths, Français, Anglais) : 2 devoirs (CAs) + 1 composition par séquence
- **Autres matières** : 1 devoir + 1 composition par séquence

**Distribution des moyennes par niveau :**
| Niveau | Moyenne générale |
|--------|-----------------|
| 6ème | 12-15/20 |
| 5ème | 11-14/20 |
| 4ème | 10-14/20 |
| 3ème | 10-13/20 |
| 2nde | 9-13/20 |
| 1ère | 9-13/20 |
| Tle | 10-14/20 |

**Distribution des écarts (réaliste) :**
- 15% des élèves > 14/20 (très bons)
- 35% entre 12 et 14/20 (bons)
- 30% entre 10 et 12/20 (moyens)
- 15% entre 8 et 10/20 (faibles)
- 5% < 8/20 (en difficulté)

### Types d'évaluation
```
type: "CA" (Contrôle - coefficient 1)
type: "COMPOSITION" (Composition - coefficient 2)
```

---

## 🎯 10. Présences (attendance)

Générer des présences pour les 230 élèves sur 30 jours de cours répartis sur l'année :

**Distribution réaliste :**
| Statut | Pourcentage |
|--------|-------------|
| present | 75% |
| absent | 10% |
| late | 10% |
| excused | 5% |

---

## 📸 11. Images à Fournir

Utiliser des APIs gratuites pour générer les URLs d'images :

### Pour l'établissement
| Image | Source suggérée | Description |
|-------|----------------|-------------|
| Logo | `https://ui-avatars.com/api/?name=GSP&background=1B4965&color=fff&size=200` | Logo de l'école |
| Hero | Photo libre de droit d'une école | Bâtiment scolaire |
| Galerie | 5-10 photos d'école/élèves | Via Unsplash/Pexels |

### APIs pour générer les URLs
1. **Avatars élèves/enseignants :** `https://ui-avatars.com/api/?name={prenom}+{nom}&background=1B4965&color=fff`
2. **Photos aléatoires :** `https://i.pravatar.cc/150?u={email}`
3. **Images d'école :** Utiliser Unsplash — https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200 (photo d'école)
4. **Logo :** `https://ui-avatars.com/api/?name=GSP+LES+PALMIERS&background=085041&color=fff&size=300`

---

## 🗄️ 12. Ordre d'Insertion (Important !)

Respecter cet ordre pour respecter les contraintes de clés étrangères :

```
1. website_templates (si nécessaire, seed par défaut)
2. schools (l'établissement principal)
3. roles (ADMIN, TEACHER, ACCOUNTANT, STUDENT, PARENT)
4. users → user_roles (équipe administrative + enseignants)
5. academic_years (année 2025-2026)
6. system_levels (tous les niveaux)
7. system_series (toutes les séries)
8. periods (semestres + séquences + compositions)
9. levels/series (liaisons educational_system_levels + educational_system_series)
10. classes (toutes les classes)
11. subjects (toutes les matières)
12. class_subjects (matières par classe)
13. subject_teachers (enseignants par matière)
14. class_teachers (enseignants principaux)
15. students + users (élèves)
16. enrollments (inscriptions des élèves aux classes)
17. guardians (parents/tuteurs)
18. sequences (séquences de l'année)
19. fees (types de frais)
20. student_fees (assignation des frais aux élèves)
21. payments (paiements enregistrés)
22. grades (notes des élèves)
23. attendance (présences)
24. notifications (notifications générées)
```

⚠️ **Après l'insertion :** Exécuter le backfill pour synchroniser `student_fees.amount_paid` + `students.fee_status` :
```sql
-- Ceci peut être fait via le script Node.js:
-- cd backend && node scripts/backfill-payments.js
```

---

## 📊 13. Volumétrie

| Table | Nombre d'enregistrements |
|-------|------------------------|
| schools | 1 |
| users | ~270 (20 staff + 230 élèves + 200+ parents) |
| students | ~230 |
| guardians | ~350 |
| classes | 18 |
| subjects | 15-20 |
| class_subjects | ~200 |
| fees | 10 |
| student_fees | ~1 800 (230 élèves × 8 frais) |
| payments | ~500 |
| grades | ~15 000 (230 élèves × 10 matières × 3 évaluations × 2 séquences) |
| attendance | ~6 900 (230 élèves × 30 jours) |
| periods | 8 |
| sequences | 8 |
| system_levels | 12 |
| system_series | 6 |

---

## ✅ 14. Checklist de Validation

Après injection, vérifier que :

- [ ] Connexion possible avec chaque rôle (admin, accountant, teacher, student)
- [ ] Dashboard admin affiche les stats correctes
- [ ] Dashboard comptable affiche les données financières
- [ ] Page "Mes Frais" d'un étudiant montre le total dû + payé correct
- [ ] Enregistrement d'un nouveau paiement met à jour le statut
- [ ] Détection de doublon fonctionne (même élève + même frais + même montant le même jour)
- [ ] Notes visibles par élève et enseignant
- [ ] Présences consultables
- [ ] Reçus PDF générables
- [ ] Bulletins téléchargeables

---

## 🔗 15. URLs de Référence

**Images libres de droit (Unsplash) :**
- Bâtiment scolaire : `https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200`
- Salle de classe : `https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200`
- Élèves étudiant : `https://images.unsplash.com/photo-1523050854058-8df90110c7f1?w=1200`
- Bibliothèque : `https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200`
- Sport : `https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200`
- Cérémonie : `https://images.unsplash.com/photo-1529543544282-ea99407a896a?w=1200`

**Générateur d'avatars :**
- `https://i.pravatar.cc/150?u={email}` — avatars réalistes
- `https://ui-avatars.com/api/?name={nom}&background=1B4965&color=fff` — avatars textuels
