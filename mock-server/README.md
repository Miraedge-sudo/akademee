# Akademee Mock Server

Mock JSON Server pour le développement de la gestion des systèmes éducatifs camerounais.

## Installation

```bash
cd mock-server
npm install
```

## Démarrage

```bash
npm start
```

Le serveur démarrera sur `http://localhost:3000`

## Endpoints Disponibles

### École
- `GET /school` - Récupérer la configuration de l'école
- `PATCH /school` - Mettre à jour la configuration de l'école

### Systèmes Éducatifs
- `GET /educationalSystems` - Liste des 5 systèmes éducatifs camerounais
- `GET /educationalSystems/:id` - Détails d'un système spécifique

### Autres Ressources
- `GET /classes` - Liste des classes
- `GET /subjects` - Liste des matières
- `GET /series` - Liste des séries
- `GET /academicYears` - Liste des années académiques

## Structure des Données

### School
```json
{
  "id": 1,
  "name": "École Test",
  "educationalSystems": ["anglo_general", "franco_general"],
  "systemConfigurations": {
    "anglo_general": {
      "isCustomized": false,
      "levels": ["Form 1", "Form 2", ...],
      "streams": ["General", "Science", ...],
      "subjectTypes": ["core", "elective", ...],
      "periods": ["Term 1", "Term 2", "Term 3"],
      "sequences": true,
      "coefficientRange": { "min": 1, "max": 4 }
    }
  }
}
```

### Educational Systems
5 systèmes supportés:
1. **anglo_general** - Anglophone Général (GCE O/A Level)
2. **anglo_tech** - Anglophone Technique (GCE Technical)
3. **franco_general** - Francophone Général (BEPC, Probatoire, Bac)
4. **franco_tech** - Francophone Technique (CAP, BEP, Bac Tech)
5. **university** - Université LMD (Licence-Master-Doctorat)

## Configuration Personnalisable

Chaque système peut être personnalisé par l'école:
- Ajout/suppression de niveaux
- Ajout/suppression de séries/filières
- Modification des plages de coefficients
- Ajout de types de matières personnalisés

Le flag `isCustomized` indique si la configuration diffère des standards camerounais.

## Utilisation avec le Frontend

Le frontend doit inclure le `EducationalSystemProvider` dans `App.jsx`:

```jsx
import { EducationalSystemProvider } from './core/context/EducationalSystemContext';

function App() {
  return (
    <EducationalSystemProvider>
      <YourApp />
    </EducationalSystemProvider>
  );
}
```

## Scripts

- `npm start` - Démarrage normal
- `npm run dev` - Démarrage avec délai de 500ms (simule latence réseau)
