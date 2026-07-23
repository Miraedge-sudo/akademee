# AKADEMEE - Flows Utilisateur pour Tests

Ce document décrit tous les flows utilisateur de l'application Akademee. Ces flows servent de guide pour tester l'application de manière exhaustive.

---

## 📋 Table des Matières

1. [Authentification](#authentification)
2. [Onboarding Administrateur](#onboarding-administrateur)
3. [Sélection Systèmes Éducatifs](#sélection-systèmes-éducatifs)
4. [Dashboard Admin](#dashboard-admin)
5. [Gestion Étudiants](#gestion-étudiants)
6. [Gestion Enseignants](#gestion-enseignants)
7. [Gestion Classes](#gestion-classes)
8. [Gestion Matières](#gestion-matières)
9. [Gestion Notes](#gestion-notes)
10. [Gestion Présences](#gestion-présences)
11. [Gestion Finance](#gestion-finance)
12. [Configuration Systèmes Éducatifs](#configuration-systèmes-éducatifs)
13. [Années Académiques](#années-académiques)
14. [Paramètres École](#paramètres-école)

---

## Authentification

### Flow 1: Login Admin

**Description:**   Connexion d'un administrateur à son compte



**Étapes:**
1. L'utilisateur se rend sur la page de login
2. L'utilisateur entre son email dans le champ "Email"
3. L'utilisateur entre son mot de passe dans le champ "Password"
4. L'utilisateur clique sur le bouton "Login"
5. **Si les identifiants sont corrects:**
   - L'utilisateur est redirigé vers le dashboard admin
   - Un message de succès s'affiche
6. **Si les identifiants sont incorrects:**
   - Un message d'erreur s'affiche "Invalid email or password"
   - L'utilisateur reste sur la page de login

**Données de test:**
- Email valide: admin@school.akademee.com
- Mot de passe valide: Password123!
- Email invalide: wrong@email.com
- Mot de passe invalide: wrongpassword

---

### Flow 2: Register (Création Compte École)

**Description:** Création d'un nouveau compte école

**Étapes:**
1. L'utilisateur se rend sur la page de register
2. L'utilisateur remplit le formulaire:
   - Nom de l'école
   - Sous-domaine (ex: gracebilingual)
   - Email de l'administrateur
   - Mot de passe
   - Confirmation mot de passe
3. L'utilisateur clique sur "Create Account"
4. **Si les données sont valides:**
   - Le compte est créé
   - Un email de vérification est envoyé
   - L'utilisateur est redirigé vers la page de vérification
5. **Si les données sont invalides:**
   - Les erreurs s'affichent sous les champs concernés
   - L'utilisateur reste sur la page de register

**Validation:**
- Le sous-domaine doit être unique
- Le mot de passe doit avoir au moins 8 caractères
- Les mots de passe doivent correspondre
- L'email doit être valide

---

### Flow 3: Mot de Passe Oublié

**Description:** Demande de réinitialisation de mot de passe

**Étapes:**
1. L'utilisateur clique sur "Forgot Password" sur la page de login
2. L'utilisateur entre son email
3. L'utilisateur clique sur "Send Reset Link"
4. **Si l'email existe:**
   - Un lien de réinitialisation est envoyé par email
   - Un message de succès s'affiche
5. **Si l'email n'existe pas:**
   - Un message d'erreur s'affiche

---

### Flow 4: Réinitialisation Mot de Passe

**Description:** Changement du mot de passe via lien email

**Étapes:**
1. L'utilisateur clique sur le lien reçu par email
2. L'utilisateur arrive sur la page de reset password
3. L'utilisateur entre son nouveau mot de passe
4. L'utilisateur confirme le nouveau mot de passe
5. L'utilisateur clique sur "Reset Password"
6. **Si réussi:**
   - Le mot de passe est changé
   - L'utilisateur est redirigé vers la page de login
7. **Si échec:**
   - Les erreurs s'affichent

---

## Onboarding Administrateur

### Flow 5: Configuration Initiale École (5 Étapes)

**Description:** Premier setup après création du compte

**Étape 1 - Identité de l'école:**
1. L'utilisateur arrive sur la page d'onboarding
2. L'utilisateur télécharge le logo de l'école
3. L'utilisateur entre le nom de l'école
4. L'utilisateur entre un slogan/tagline
5. L'utilisateur clique sur "Continue"

**Étape 2 - Informations de contact:**
1. L'utilisateur entre l'email de contact
2. L'utilisateur entre le numéro de téléphone
3. L'utilisateur entre l'adresse
4. L'utilisateur entre la ville
5. L'utilisateur entre la région
6. L'utilisateur clique sur "Continue"

**Étape 3 - Classes et Niveaux:**
1. L'utilisateur sélectionne un preset (Anglophone, Francophone, etc.)
2. Les classes par défaut sont chargées
3. L'utilisateur peut modifier les classes (ajouter/supprimer/modifier)
4. L'utilisateur clique sur "Continue"

**Étape 4 - Statistiques et Systèmes Éducatifs:**
1. L'utilisateur entre le nombre d'étudiants
2. L'utilisateur entre le nombre d'enseignants
3. L'utilisateur entre le nombre de classes
4. L'utilisateur sélectionne les systèmes éducatifs (5 options):
   - Anglophone General
   - Francophone General
   - Anglophone Technical
   - Francophone Technical
   - University LMD
5. L'utilisateur entre l'année de fondation
6. L'utilisateur entre le type d'examen
7. L'utilisateur entre le taux de réussite
8. L'utilisateur clique sur "Continue"

**Étape 5 - Publication:**
1. L'utilisateur vérifie toutes les informations
2. L'utilisateur clique sur "Publish Website"
3. Le site web est publié
4. L'utilisateur est redirigé vers le dashboard

---

## Sélection Systèmes Éducatifs

### Flow 6: Sélection des Systèmes Éducatifs (Onboarding)

**Description:** Choix des systèmes éducatifs après onboarding

**Étapes:**
1. L'utilisateur arrive sur la page de sélection des systèmes
2. L'utilisateur voit les 5 systèmes disponibles:
   - Anglophone General (GCE O-Level & A-Level)
   - Francophone General (BEPC, Probatoire & Baccalauréat)
   - Anglophone Technical (TVEE IL & AL)
   - Francophone Technical (CAP, Brevet & Bac Technique)
   - University LMD (Licence, Master, Doctorate)
3. L'utilisateur clique sur les systèmes qu'il souhaite activer (multi-sélection possible)
4. Les systèmes sélectionnés sont mis en évidence (bordure colorée + checkmark)
5. L'utilisateur clique sur "Continue to dashboard"
6. **Si aucun système sélectionné:**
   - Un message d'erreur s'affiche "Please select at least one educational system"
7. **Si au moins un système sélectionné:**
   - La sélection est sauvegardée
   - L'utilisateur est redirigé vers le dashboard

---

## Dashboard Admin

### Flow 7: Accès au Dashboard

**Description:** Navigation et affichage du dashboard principal

**Étapes:**
1. L'utilisateur se connecte
2. L'utilisateur arrive sur le dashboard admin
3. Le dashboard affiche:
   - Statistiques globales (nombre d'étudiants, enseignants, classes)
   - Activités récentes
   - Revenus
   - Badges des systèmes éducatifs sélectionnés
4. L'utilisateur peut naviguer via la sidebar vers les différentes sections

---

## Gestion Étudiants

### Flow 8: Ajout d'un Étudiant

**Description:** Création d'un nouvel étudiant

**Étapes:**
1. L'utilisateur clique sur "Students" dans la sidebar
2. L'utilisateur clique sur "Add Student"
3. L'utilisateur remplit le formulaire:
   - Prénom
   - Nom
   - Date de naissance
   - Genre
   - Photo (upload)
   - Classe
   - Année académique
   - Tuteur (optionnel)
4. L'utilisateur clique sur "Save"
5. **Si réussi:**
   - L'étudiant est créé
   - Un matricule est généré automatiquement
   - L'étudiant apparaît dans la liste
6. **Si échec:**
   - Les erreurs s'affichent

---

### Flow 9: Modification d'un Étudiant

**Description:** Mise à jour des informations d'un étudiant

**Étapes:**
1. L'utilisateur clique sur "Students" dans la sidebar
2. L'utilisateur clique sur un étudiant dans la liste
3. L'utilisateur arrive sur la page de profil de l'étudiant
4. L'utilisateur clique sur "Edit"
5. L'utilisateur modifie les informations souhaitées
6. L'utilisateur clique sur "Save"
7. Les modifications sont sauvegardées

---

### Flow 10: Suppression d'un Étudiant

**Description:** Suppression d'un étudiant

**Étapes:**
1. L'utilisateur clique sur "Students" dans la sidebar
2. L'utilisateur clique sur un étudiant dans la liste
3. L'utilisateur clique sur "Delete"
4. Une confirmation apparaît "Are you sure you want to delete this student?"
5. L'utilisateur clique sur "Confirm"
6. L'étudiant est supprimé
7. L'utilisateur retourne à la liste

---

## Gestion Enseignants

### Flow 11: Ajout d'un Enseignant

**Description:** Création d'un nouvel enseignant

**Étapes:**
1. L'utilisateur clique sur "Teachers" dans la sidebar
2. L'utilisateur clique sur "Add Teacher"
3. L'utilisateur remplit le formulaire:
   - Prénom
   - Nom
   - Email
   - Téléphone
   - Matières enseignées
   - Classes assignées
4. L'utilisateur clique sur "Save"
5. **Si réussi:**
   - L'enseignant est créé
   - L'enseignant apparaît dans la liste
6. **Si échec:**
   - Les erreurs s'affichent

---

### Flow 12: Assignation Matière à Enseignant

**Description:** Associer une matière à un enseignant

**Étapes:**
1. L'utilisateur clique sur "Teachers" dans la sidebar
2. L'utilisateur clique sur un enseignant
3. L'utilisateur clique sur "Assign Subject"
4. L'utilisateur sélectionne une matière
5. L'utilisateur sélectionne une classe
6. L'utilisateur clique sur "Save"
7. L'assignation est créée

---

## Gestion Classes

### Flow 13: Création d'une Classe

**Description:** Création d'une nouvelle classe

**Étapes:**
1. L'utilisateur clique sur "Classes" dans la sidebar
2. L'utilisateur clique sur "Add Class"
3. L'utilisateur remplit le formulaire:
   - Nom de la classe (ex: Form 1, 6ème)
   - Niveau
   - Année académique
   - Capacité
   - Enseignant principal (optionnel)
4. L'utilisateur clique sur "Save"
5. **Si réussi:**
   - La classe est créée
   - La classe apparaît dans la liste
6. **Si échec:**
   - Les erreurs s'affichent

---

### Flow 14: Assignation Matière à Classe

**Description:** Associer une matière à une classe

**Étapes:**
1. L'utilisateur clique sur "Classes" dans la sidebar
2. L'utilisateur clique sur une classe
3. L'utilisateur clique sur "Subjects"
4. L'utilisateur clique sur "Add Subject"
5. L'utilisateur sélectionne une matière
6. L'utilisateur entre le coefficient
7. L'utilisateur clique sur "Save"
8. La matière est assignée à la classe

---

## Gestion Matières

### Flow 15: Création d'une Matière

**Description:** Création d'une nouvelle matière

**Étapes:**
1. L'utilisateur clique sur "Subjects" dans la sidebar
2. L'utilisateur clique sur "Add Subject"
3. L'utilisateur remplit le formulaire:
   - Nom de la matière
   - Type (théorique/pratique)
   - Coefficient par défaut
   - Description
4. L'utilisateur clique sur "Save"
5. **Si réussi:**
   - La matière est créée
   - La matière apparaît dans la liste
6. **Si échec:**
   - Les erreurs s'affichent

---

## Gestion Notes

### Flow 16: Saisie des Notes

**Description:** Entrer les notes des étudiants

**Étapes:**
1. L'utilisateur clique sur "Grades" dans la sidebar
2. L'utilisateur sélectionne une classe
3. L'utilisateur sélectionne une matière
4. L'utilisateur sélectionne une période (term/semestre)
5. L'utilisateur voit la liste des étudiants
6. L'utilisateur entre les notes pour chaque étudiant
7. L'utilisateur clique sur "Save"
8. Les notes sont sauvegardées
9. Les moyennes sont calculées automatiquement

---

### Flow 17: Génération de Bulletin

**Description:** Générer un bulletin pour un étudiant

**Étapes:**
1. L'utilisateur clique sur "Report Cards" dans la sidebar
2. L'utilisateur sélectionne une classe
3. L'utilisateur sélectionne un étudiant
4. L'utilisateur sélectionne une période
5. L'utilisateur clique sur "Generate Report Card"
6. Le bulletin est généré en PDF
7. Le PDF peut être téléchargé

---

## Gestion Présences

### Flow 18: Saisie de Présence

**Description:** Enregistrer la présence des étudiants

**Étapes:**
1. L'utilisateur clique sur "Attendance" dans la sidebar
2. L'utilisateur sélectionne une classe
3. L'utilisateur sélectionne une date
4. L'utilisateur voit la liste des étudiants
5. L'utilisateur marque la présence pour chaque étudiant (Present/Absent/Late)
6. L'utilisateur clique sur "Save"
7. La présence est sauvegardée

---

### Flow 19: Consultation Statistiques Présence

**Description:** Voir les statistiques de présence

**Étapes:**
1. L'utilisateur clique sur "Attendance" dans la sidebar
2. L'utilisateur clique sur "Statistics"
3. L'utilisateur sélectionne une classe
4. L'utilisateur sélectionne une période
5. Les statistiques s'affichent:
   - Taux de présence global
   - Taux de présence par étudiant
   - Tendance mensuelle

---

## Gestion Finance

### Flow 20: Création de Type de Frais

**Description:** Créer un nouveau type de frais

**Étapes:**
1. L'utilisateur clique sur "Finance" dans la sidebar
2. L'utilisateur clique sur "Fee Types"
3. L'utilisateur clique sur "Add Fee Type"
4. L'utilisateur remplit le formulaire:
   - Nom du frais (ex: Tuition, Registration)
   - Montant
   - Classe concernée
   - Période (annuel/semestriel/trimestriel)
5. L'utilisateur clique sur "Save"
6. Le type de frais est créé

---

### Flow 21: Enregistrement Paiement

**Description:** Enregistrer un paiement d'étudiant

**Étapes:**
1. L'utilisateur clique sur "Finance" dans la sidebar
2. L'utilisateur clique sur "Payments"
3. L'utilisateur clique sur "Record Payment"
4. L'utilisateur sélectionne un étudiant
5. L'utilisateur sélectionne un type de frais
6. L'utilisateur entre le montant payé
7. L'utilisateur entre la date de paiement
8. L'utilisateur entre le mode de paiement
9. L'utilisateur clique sur "Save"
10. Le paiement est enregistré

---

### Flow 22: Consultation Statut Paiement Étudiant

**Description:** Voir le statut de paiement d'un étudiant

**Étapes:**
1. L'utilisateur clique sur "Finance" dans la sidebar
2. L'utilisateur clique sur "Student Fees"
3. L'utilisateur sélectionne un étudiant
4. Le statut de paiement s'affiche:
   - Frais totaux dus
   - Montant payé
   - Montant restant
   - Liste des paiements effectués

---

## Configuration Systèmes Éducatifs

### Flow 23: Accès à la Configuration des Systèmes

**Description:** Accéder à la page de configuration des systèmes éducatifs

**Étapes:**
1. L'utilisateur clique sur "Settings" dans la sidebar
2. L'utilisateur clique sur "System Configuration"
3. L'utilisateur voit la liste des systèmes sélectionnés
4. L'utilisateur clique sur un système
5. L'utilisateur arrive sur la page de configuration de ce système

---

### Flow 24: Configuration Niveaux d'un Système

**Description:** Modifier les niveaux d'un système éducatif

**Étapes:**
1. L'utilisateur est sur la page de configuration d'un système
2. L'utilisateur clique sur l'onglet "Levels"
3. L'utilisateur voit la liste des niveaux actuels
4. L'utilisateur peut:
   - Ajouter un niveau: cliquer sur "Add Level", entrer le nom, cliquer sur "Save"
   - Modifier un niveau: cliquer sur "Edit", modifier, cliquer sur "Save"
   - Supprimer un niveau: cliquer sur "Delete", confirmer
5. Les modifications sont sauvegardées

---

### Flow 25: Configuration Séries/Filières d'un Système

**Description:** Modifier les séries ou filières d'un système

**Étapes:**
1. L'utilisateur est sur la page de configuration d'un système
2. L'utilisateur clique sur l'onglet "Series" (système francophone) ou "Streams" (système anglophone)
3. L'utilisateur voit la liste des séries/filières actuelles
4. L'utilisateur peut:
   - Ajouter une série/filière: cliquer sur "Add", entrer le nom, cliquer sur "Save"
   - Modifier une série/filière: cliquer sur "Edit", modifier, cliquer sur "Save"
   - Supprimer une série/filière: cliquer sur "Delete", confirmer
5. Les modifications sont sauvegardées

---

### Flow 26: Configuration Coefficients par Matière

**Description:** Modifier les coefficients des matières pour un système

**Étapes:**
1. L'utilisateur est sur la page de configuration d'un système
2. L'utilisateur clique sur l'onglet "Subject Coefficients"
3. L'utilisateur voit la liste des matières avec leurs coefficients
4. L'utilisateur modifie le coefficient d'une matière
5. L'utilisateur clique sur "Save"
6. Les modifications sont sauvegardées

---

### Flow 27: Réinitialisation aux Valeurs par Défaut

**Description:** Remettre la configuration d'un système à ses valeurs par défaut

**Étapes:**
1. L'utilisateur est sur la page de configuration d'un système
2. L'utilisateur clique sur "Reset to Defaults"
3. Une confirmation apparaît "Are you sure you want to reset to default values?"
4. L'utilisateur clique sur "Confirm"
5. La configuration est réinitialisée aux valeurs par défaut
6. Un message de succès s'affiche

---

## Années Académiques

### Flow 28: Création d'une Année Académique

**Description:** Créer une nouvelle année académique avec sélection de systèmes

**Étapes:**
1. L'utilisateur clique sur "Settings" dans la sidebar
2. L'utilisateur clique sur "Academic Years"
3. L'utilisateur clique sur "Add Academic Year"
4. L'utilisateur remplit le formulaire:
   - Nom de l'année (ex: 2024-2025)
   - Date de début
   - Date de fin
5. L'utilisateur sélectionne les systèmes éducatifs pour cette année (multi-sélection)
6. L'utilisateur coche "Generate periods automatically" (optionnel)
7. Si coché, les périodes sont générées automatiquement selon les systèmes:
   - Anglophone: 3 Terms
   - Francophone: 2 Semestres
   - University: 2 Semestres
8. L'utilisateur clique sur "Create"
9. **Si réussi:**
   - L'année académique est créée
   - Les périodes sont générées si option cochée
   - L'année apparaît dans la liste
10. **Si échec:**
   - Les erreurs s'affichent

---

### Flow 29: Activation d'une Année Académique

**Description:** Définir une année académique comme active

**Étapes:**
1. L'utilisateur clique sur "Settings" dans la sidebar
2. L'utilisateur clique sur "Academic Years"
3. L'utilisateur clique sur "Set Active" sur une année
4. L'année devient l'année active
5. Toutes les autres années sont désactivées
6. Un message de succès s'affiche

---

### Flow 30: Gestion des Périodes

**Description:** Gérer les périodes (terms/semestres) d'une année académique

**Étapes:**
1. L'utilisateur clique sur "Settings" dans la sidebar
2. L'utilisateur clique sur "Academic Years"
3. L'utilisateur clique sur une année académique
4. L'utilisateur voit la liste des périodes
5. L'utilisateur peut:
   - Ajouter une période: cliquer sur "Add Period", entrer nom/dates, cliquer sur "Save"
   - Modifier une période: cliquer sur "Edit", modifier, cliquer sur "Save"
   - Supprimer une période: cliquer sur "Delete", confirmer
6. Les modifications sont sauvegardées

---

## Paramètres École

### Flow 31: Modification des Informations de l'École

**Description:** Mettre à jour les informations générales de l'école

**Étapes:**
1. L'utilisateur clique sur "Settings" dans la sidebar
2. L'utilisateur clique sur "School Settings"
3. L'utilisateur modifie les informations:
   - Nom de l'école
   - Logo
   - Email de contact
   - Téléphone
   - Adresse
   - Ville
   - Région
4. L'utilisateur clique sur "Save"
5. Les modifications sont sauvegardées

---

### Flow 32: Configuration du Site Web

**Description:** Modifier l'apparence et le contenu du site web public

**Étapes:**
1. L'utilisateur clique sur "Settings" dans la sidebar
2. L'utilisateur clique sur "Website Settings"
3. L'utilisateur peut modifier:
   - Couleur principale
   - Template
   - Description de l'école
   - Statistiques (nombre d'étudiants, enseignants, classes)
   - Valeurs de l'école
   - Photos de la galerie
4. L'utilisateur clique sur "Save"
5. Les modifications sont appliquées au site web

---

### Flow 33: Publication du Site Web

**Description:** Publier ou dépublier le site web

**Étapes:**
1. L'utilisateur clique sur "Settings" dans la sidebar
2. L'utilisateur clique sur "Website Settings"
3. L'utilisateur clique sur "Publish Website"
4. **Si publié:**
   - Le site web devient accessible publiquement
   - Un message de succès s'affiche
5. **Si dépublié:**
   - Le site web n'est plus accessible publiquement
   - Un message de succès s'affiche

---

## Scénarios de Test Complets

### Scénario 1: Cycle Complet d'un Étudiant

**Description:** Tester le cycle de vie complet d'un étudiant

**Étapes:**
1. Créer une année académique
2. Créer une classe
3. Créer des matières
4. Assigner les matières à la classe
5. Créer un étudiant
6. Inscrire l'étudiant dans la classe
7. Saisir les présences de l'étudiant
8. Saisir les notes de l'étudiant
9. Générer le bulletin de l'étudiant
10. Enregistrer un paiement pour l'étudiant
11. Consulter le statut de paiement

---

### Scénario 2: Configuration Multi-Système

**Description:** Tester la configuration avec plusieurs systèmes éducatifs

**Étapes:**
1. Sélectionner 3 systèmes éducatifs (ex: Anglophone General, Francophone General, University)
2. Créer une année académique avec ces 3 systèmes
3. Vérifier que les périodes sont générées correctement (3 terms pour anglophone, 2 semestres pour franco/university)
4. Configurer les niveaux pour chaque système
5. Configurer les séries/filières pour chaque système
6. Créer des classes pour chaque système
7. Vérifier que les badges des systèmes apparaissent dans la sidebar

---

### Scénario 3: Onboarding Complet

**Description:** Tester le processus d'onboarding complet

**Étapes:**
1. Créer un nouveau compte école
2. Vérifier l'email
3. Compléter l'onboarding (5 étapes)
4. Sélectionner les systèmes éducatifs
5. Vérifier que le dashboard s'affiche correctement
6. Vérifier que les informations de l'école sont sauvegardées
7. Vérifier que le site web est publié

---

## Checklist de Test

### Authentification
- [ ] Login avec identifiants corrects
- [ ] Login avec identifiants incorrects
- [ ] Register avec données valides
- [ ] Register avec données invalides
- [ ] Mot de passe oublié
- [ ] Réinitialisation mot de passe

### Systèmes Éducatifs
- [ ] Sélection d'un seul système
- [ ] Sélection de plusieurs systèmes
- [ ] Tentative de sauvegarde sans sélection
- [ ] Configuration des niveaux
- [ ] Configuration des séries/filières
- [ ] Configuration des coefficients
- [ ] Réinitialisation aux valeurs par défaut

### Années Académiques
- [ ] Création année académique
- [ ] Création avec génération automatique de périodes
- [ ] Activation d'une année
- [ ] Gestion des périodes
- [ ] Création année avec plusieurs systèmes

### Étudiants
- [ ] Création étudiant
- [ ] Modification étudiant
- [ ] Suppression étudiant
- [ ] Inscription dans une classe
- [ ] Consultation profil

### Enseignants
- [ ] Création enseignant
- [ ] Assignation matière
- [ ] Assignation classe

### Notes
- [ ] Saisie notes
- [ ] Calcul automatique moyennes
- [ ] Génération bulletin

### Présence
- [ ] Saisie présence
- [ ] Consultation statistiques

### Finance
- [ ] Création type de frais
- [ ] Enregistrement paiement
- [ ] Consultation statut paiement

---

## Notes pour les Testeurs

1. **Tester avec différents rôles:** Admin, Enseignant, Parent, Étudiant
2. **Tester avec différents systèmes:** Anglophone, Francophone, Technique, University
3. **Tester les cas limites:** Champs vides, données invalides, suppression d'éléments utilisés
4. **Tester la réactivité:** Vérifier que l'application fonctionne bien sur mobile
5. **Tester la persistance:** Vérifier que les données sont bien sauvegardées après rechargement
6. **Tester les notifications:** Vérifier que les messages de succès/erreur sont clairs
7. **Tester la navigation:** Vérifier que tous les liens et boutons fonctionnent
