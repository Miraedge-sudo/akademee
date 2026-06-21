# Akademee Frontend - Documentation Complète

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [Structure du Projet](#structure-du-projet)
5. [Composants Core](#composants-core)
6. [Features](#features)
7. [Internationalisation](#internationalisation)
8. [Theming](#theming)
9. [Routing](#routing)
10. [API Integration](#api-integration)
11. [Déploiement](#déploiement)

---

## Vue d'ensemble

Akademee Frontend est une application React moderne construite avec **Vite**, offrant une interface utilisateur responsive et intuitive pour le système de gestion scolaire. L'application supporte le mode sombre/clair et l'internationalisation (anglais/français).

### Stack Technique

- **Framework**: React 19.2.6
- **Build Tool**: Vite 8.0.12
- **Routing**: React Router DOM 7.17.0
- **Styling**: TailwindCSS 4.0.0
- **Internationalisation**: i18next 26.3.1 + react-i18next 17.0.8
- **Détection langue**: i18next-browser-languagedetector 8.2.1
- **Linting**: ESLint 10.3.0

### Fonctionnalités Principales

- ✅ Interface utilisateur moderne et responsive
- ✅ Mode sombre/clair avec persistance
- ✅ Internationalisation (anglais/français)
- ✅ Authentification utilisateur
- ✅ Layout administratif avec navigation
- ✅ Gestion des étudiants
- ✅ Processus d'intégration (onboarding)
- ✅ Architecture feature-based
- ✅ Context API pour la gestion d'état global
- ✅ Configuration Axios avec interceptors
- ✅ Proxy Vite pour l'API backend

---

## Architecture

### Pattern Architecture

Le frontend suit une architecture **feature-based** avec séparation des préoccupations :

- **Core**: Fonctionnalités réutilisables (API, hooks, context, utils, i18n)
- **Features**: Modules fonctionnels spécifiques (auth, students, dashboard, etc.)
- **Layout**: Composants de mise en page (navbar, sidebar, etc.)
- **Shared**: Composants partagés entre features

### Flux de Données

- **Context API**: Pour l'état global (thème, authentification)
- **Props**: Pour le passage de données local
- **Custom Hooks**: Pour la logique réutilisable
- **API Calls**: Via le module API core avec Axios

### Gestion d'État

- **État Global**: React Context (ThemeContext, AuthContext)
- **État Local**: useState, useReducer
- **État Serveur**: À implémenter avec React Query ou SWR

---

## Configuration

### Variables d'Environnement

Créez un fichier `.env` à la racine du dossier frontend :

```env
# API Backend
VITE_API_BASE_URL=http://localhost:5000
VITE_API_TIMEOUT=30000

# Configuration
VITE_APP_NAME=Akademee
VITE_APP_VERSION=1.0.0

# Features
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_I18N=true

# Default Language
VITE_DEFAULT_LANGUAGE=en
```

### Configuration Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
```

Le proxy Vite permet de rediriger les requêtes `/api` vers le backend sur `http://localhost:5000`, évitant les problèmes CORS en développement.

### Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Crée le build de production |
| `npm run preview` | Prévisualise le build de production |
| `npm run lint` | Vérifie le code avec ESLint |

---

## Structure du Projet

```
frontend/
├── public/                         # Fichiers statiques
│   └── vite.svg
│
├── src/
│   ├── App.jsx                     # Composant racine
│   ├── App.css                     # Styles globaux
│   ├── main.jsx                    # Point d'entrée
│   ├── index.css                   # Styles de base
│   │
│   ├── app/                        # Application principale
│   │   ├── core/                   # Fonctionnalités core
│   │   │   ├── api/                # Integration API
│   │   │   │   ├── axios.js        # Configuration Axios
│   │   │   │   └── endpoints.js    # Définitions endpoints (à implémenter)
│   │   │   │
│   │   │   ├── constants/          # Constantes application
│   │   │   │
│   │   │   ├── context/            # React Context
│   │   │   │   ├── ThemeContext.jsx    # Gestion thème
│   │   │   │   └── AuthContext.jsx     # Gestion authentification (à implémenter)
│   │   │   │
│   │   │   ├── guards/             # Route guards (à implémenter)
│   │   │   │
│   │   │   ├── hooks/              # Custom hooks
│   │   │   │   ├── useAuth.js      # Hook authentification (à implémenter)
│   │   │   │   ├── useTheme.js     # Hook thème
│   │   │   │   └── useDebounce.js  # Hook debounce (à implémenter)
│   │   │   │
│   │   │   ├── i18n/               # Internationalisation
│   │   │   │   ├── i18n.js         # Configuration i18next
│   │   │   │   └── locales/        # Fichiers de traduction
│   │   │   │       ├── en/         # Anglais
│   │   │   │       │   ├── common.json
│   │   │   │       │   └── auth.json
│   │   │   │       └── fr/         # Français
│   │   │   │           ├── common.json
│   │   │   │           └── auth.json
│   │   │   │
│   │   │   └── utils/              # Utilitaires (à implémenter)
│   │   │
│   │   ├── features/               # Features fonctionnelles
│   │   │   ├── auth/               # Authentification
│   │   │   │   ├── components/    # Composants auth (à implémenter)
│   │   │   │   └── pages/          # Pages auth
│   │   │   │       ├── LoginPage.jsx
│   │   │   │       └── RegisterPage.jsx
│   │   │   │
│   │   │   ├── students/           # Gestion étudiants
│   │   │   │   ├── components/    # Composants étudiants
│   │   │   │   │   └── AddStudentDrawer.jsx (à implémenter)
│   │   │   │   └── pages/          # Pages étudiants
│   │   │   │       ├── StudentsListPage.jsx (à implémenter)
│   │   │   │       └── StudentProfilePage.jsx (à implémenter)
│   │   │   │
│   │   │   ├── dashboard/          # Dashboard
│   │   │   │   └── pages/         # Pages dashboard (à implémenter)
│   │   │   │
│   │   │   ├── onboarding/         # Processus onboarding
│   │   │   │   ├── components/    # Composants onboarding (à implémenter)
│   │   │   │   └── pages/          # Pages onboarding
│   │   │   │       └── OnboardingPage.jsx
│   │   │   │
│   │   │   ├── attendance/         # Présences (à implémenter)
│   │   │   ├── classes/            # Classes (à implémenter)
│   │   │   ├── finance/            # Finance (à implémenter)
│   │   │   ├── grades/             # Notes (à implémenter)
│   │   │   ├── settings/           # Paramètres (à implémenter)
│   │   │   ├── subjects/           # Matières (à implémenter)
│   │   │   └── website-builder/    # Constructeur site web (à implémenter)
│   │   │
│   │   ├── layout/                 # Layout components
│   │   │   ├── AdminLayout.jsx     # Layout admin principal
│   │   │   ├── Navbar.jsx          # Barre de navigation
│   │   │   ├── Sidebar.jsx         # Sidebar (à implémenter)
│   │   │   ├── MobileBottomNav.jsx # Navigation mobile (à implémenter)
│   │   │   └── layout.jsx          # Layout générique (à implémenter)
│   │   │
│   │   ├── shared/                 # Composants partagés (à implémenter)
│   │   │
│   │   └── assets/                 # Assets statiques
│   │       └── react.svg
│   │
├── index.html                      # HTML entry point
├── package.json                    # Dépendances
├── vite.config.js                  # Configuration Vite
├── eslint.config.js                # Configuration ESLint
└── README.md
```

---

## Composants Core

### ThemeContext

Gère le thème sombre/clair de l'application avec persistance locale.

```javascript
// app/core/context/ThemeContext.jsx
import { createContext, useEffect, useState } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('akademee-theme') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('akademee-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**Usage**
```javascript
import { useTheme } from '../core/hooks/useTheme';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### AuthContext

Gère l'état d'authentification (à implémenter complètement).

```javascript
// app/core/context/AuthContext.jsx
import { createContext, useContext, useState } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    // Implémentation login
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      loading, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Custom Hooks

#### useTheme

Hook personnalisé pour utiliser le ThemeContext.

```javascript
// app/core/hooks/useTheme.js
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

#### useAuth

Hook personnalisé pour utiliser l'AuthContext (à implémenter).

```javascript
// app/core/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

#### useDebounce

Hook pour debounce les valeurs (à implémenter).

```javascript
// app/core/hooks/useDebounce.js
import { useEffect, useState } from 'react';

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## Features

### Authentification

#### LoginPage

Page de connexion utilisateur.

**Emplacement**: `app/features/auth/pages/LoginPage.jsx`

**Fonctionnalités**
- Formulaire de connexion (email, mot de passe)
- Validation des champs
- Gestion des erreurs
- Redirection après connexion

#### RegisterPage

Page d'inscription utilisateur.

**Emplacement**: `app/features/auth/pages/RegisterPage.jsx`

**Fonctionnalités**
- Formulaire d'inscription
- Validation des champs
- Création de compte
- Redirection vers login

### Étudiants

#### StudentsListPage

Page listant tous les étudiants (à implémenter).

**Emplacement**: `app/features/students/pages/StudentsListPage.jsx`

**Fonctionnalités**
- Liste paginée des étudiants
- Filtres (classe, statut)
- Recherche
- Actions (voir, modifier, supprimer)

#### StudentProfilePage

Page de profil d'un étudiant (à implémenter).

**Emplacement**: `app/features/students/pages/StudentProfilePage.jsx`

**Fonctionnalités**
- Informations personnelles
- Historique académique
- Notes
- Présences
- Informations tuteurs

#### AddStudentDrawer

Composant drawer pour ajouter un étudiant (à implémenter).

**Emplacement**: `app/features/students/components/AddStudentDrawer.jsx`

**Fonctionnalités**
- Formulaire d'ajout étudiant
- Validation
- Upload photo
- Création étudiant

### Dashboard

#### DashboardPage

Page principale du dashboard (à implémenter).

**Emplacement**: `app/features/dashboard/pages/`

**Fonctionnalités**
- Statistiques globales
- Graphiques
- Activités récentes
- Raccourcis

### Onboarding

#### OnboardingPage

Page d'intégration pour les nouvelles écoles.

**Emplacement**: `app/features/onboarding/pages/OnboardingPage.jsx`

**Fonctionnalités**
- Étape 1: Informations école
- Étape 2: Choix plan
- Étape 3: Choix template
- Étape 4: Confirmation
- Progress indicator

---

## Internationalisation

### Configuration i18next

```javascript
// app/core/i18n/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    resources: {
      en: { common: enCommon, auth: enAuth },
      fr: { common: frCommon, auth: frAuth },
    },
    ns: ['common', 'auth'],
    defaultNS: 'common',
  });

export default i18n;
```

### Structure des Fichiers de Traduction

```
locales/
├── en/
│   ├── common.json    # Traductions communes
│   └── auth.json      # Traductions authentification
└── fr/
    ├── common.json    # Traductions communes
    └── auth.json      # Traductions authentification
```

### Exemple: common.json (Anglais)

```json
{
  "appName": "Akademee",
  "navbar": {
    "dashboard": "Dashboard",
    "students": "Students",
    "classes": "Classes",
    "grades": "Grades",
    "attendance": "Attendance",
    "finance": "Finance",
    "settings": "Settings",
    "search": "Search..."
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "view": "View"
  },
  "status": {
    "active": "Active",
    "inactive": "Inactive",
    "pending": "Pending"
  }
}
```

### Exemple: common.json (Français)

```json
{
  "appName": "Akademee",
  "navbar": {
    "dashboard": "Tableau de bord",
    "students": "Étudiants",
    "classes": "Classes",
    "grades": "Notes",
    "attendance": "Présences",
    "finance": "Finance",
    "settings": "Paramètres",
    "search": "Rechercher..."
  },
  "actions": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "add": "Ajouter",
    "view": "Voir"
  },
  "status": {
    "active": "Actif",
    "inactive": "Inactif",
    "pending": "En attente"
  }
}
```

### Utilisation dans les Composants

```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');
  
  return (
    <div>
      <h1>{t('navbar.dashboard')}</h1>
      <button>{t('actions.save')}</button>
    </div>
  );
}
```

### Changement de Langue

```javascript
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en');
  };
  
  return (
    <button onClick={toggleLanguage}>
      {i18n.language === 'en' ? 'FR' : 'EN'}
    </button>
  );
}
```

---

## Theming

### Configuration TailwindCSS

Le projet utilise TailwindCSS 4.0 avec support du mode sombre.

### Classes Utilitaires

**Mode clair**
```jsx
<div className="bg-white text-surface-800">
  Contenu en mode clair
</div>
```

**Mode sombre**
```jsx
<div className="dark:bg-surface-800 dark:text-surface-100">
  Contenu en mode sombre
</div>
```

**Responsive**
```jsx
<div className="bg-white dark:bg-surface-800">
  S'adapte automatiquement au thème
</div>
```

### Palette de Couleurs

**Surface Colors**
- `surface-50` à `surface-900` : Nuances de gris pour les surfaces

**Semantic Colors**
- `teal-700` : Couleur primaire
- `red-500` : Couleur d'erreur
- `green-500` : Couleur de succès

### Exemple Navbar avec Theme Toggle

```javascript
import { useTheme } from '../core/hooks/useTheme';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation('common');

  return (
    <header className="h-14 bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700">
      <button
        onClick={toggleTheme}
        className="w-9 h-9 flex items-center justify-center rounded-md text-surface-500 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
      >
        {theme === 'light' ? (
          <svg>/* Moon icon */</svg>
        ) : (
          <svg>/* Sun icon */</svg>
        )}
      </button>
    </header>
  );
}
```

---

## Routing

### Configuration React Router

```javascript
// App.jsx
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./app/features/auth/pages/LoginPage";
import RegisterPage from "./app/features/auth/pages/RegisterPage";
import OnboardingPage from "./app/features/onboarding/pages/OnboardingPage";
import AdminLayout from "./app/layout/AdminLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Protected dashboard routes */}
        <Route path="/dashboard" element={<AdminLayout />}>
          {/* Admin routes will be here */}
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Routes Publiques

- `/login` - Page de connexion
- `/register` - Page d'inscription
- `/onboarding` - Processus d'intégration

### Routes Protégées

- `/dashboard/*` - Routes protégées par AdminLayout
- Nécessite implémentation de route guards

### Layout Admin

```javascript
// app/layout/AdminLayout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-900">
      {/* Sidebar */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### Navbar

```javascript
// app/layout/Navbar.jsx
import { useTheme } from '../core/hooks/useTheme';
import { useTranslation } from 'react-i18next';

export default function Navbar({ onToggleSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation('common');
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en');
  };

  return (
    <header className="h-14 bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700 flex items-center px-4 gap-3">
      {/* Burger menu */}
      <button onClick={onToggleSidebar} aria-label="Toggle sidebar">
        <svg>/* Menu icon */</svg>
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-1">
        <span className="text-sm text-surface-400">Akademee</span>
        <span className="text-surface-300">/</span>
        <span className="text-sm font-medium">{t('navbar.dashboard')}</span>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-surface-50 dark:bg-surface-900 rounded-md px-3 h-9">
        <svg>/* Search icon */</svg>
        <input type="text" placeholder={t("navbar.search")} />
      </div>

      {/* Theme toggle */}
      <button onClick={toggleTheme}>
        {theme === 'light' ? <svg>/* Moon */</svg> : <svg>/* Sun */</svg>}
      </button>

      {/* Language toggle */}
      <button onClick={toggleLanguage}>
        {i18n.language === "en" ? 'FR' : 'EN'}
      </button>

      {/* Notifications */}
      <button>
        <svg>/* Bell icon */</svg>
      </button>

      {/* User pill */}
      <button>
        <div className="w-6.5 h-6.5 rounded-full bg-teal-700">JD</div>
        <span>Jean Dupont</span>
      </button>
    </header>
  );
}
```

---

## API Integration

### Configuration Axios

```javascript
// app/core/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Endpoints

Le fichier `app/core/api/endpoints.js` est actuellement vide et doit être implémenté avec les définitions des endpoints API.

**Structure suggérée:**

```javascript
// app/core/api/endpoints.js
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    VERIFY_SCHOOL: '/api/auth/verify-school',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  
  // Schools
  SCHOOLS: {
    REGISTER: '/api/schools/register',
    CHECK_SUBDOMAIN: '/api/schools/check-subdomain',
    PLANS: '/api/schools/plans',
    TEMPLATES: '/api/schools/templates',
    VERIFY_EMAIL: '/api/schools/verify-email',
    ONBOARDING: '/api/schools/onboarding',
    ONBOARDING_MEDIA: '/api/schools/onboarding/media',
    RESEND_VERIFICATION: '/api/schools/resend-verification',
    LIST: '/api/schools',
    CREATE: '/api/schools',
    GET: (id) => `/api/schools/${id}`,
    UPDATE: (id) => `/api/schools/${id}`,
  },
  
  // Students
  STUDENTS: {
    LIST: '/api/students',
    CREATE: '/api/students',
    GET: (id) => `/api/students/${id}`,
    UPDATE: (id) => `/api/students/${id}`,
    DELETE: (id) => `/api/students/${id}`,
  },
  
  // Guardians
  GUARDIANS: {
    LIST: '/api/guardians',
    CREATE: '/api/guardians',
    GET: (id) => `/api/guardians/${id}`,
    UPDATE: (id) => `/api/guardians/${id}`,
  },
  
  // Academic
  ACADEMIC: {
    YEARS: '/api/academics/years',
    CLASSES: '/api/classes',
    SUBJECTS: '/api/subjects',
  },
  
  // Grades
  GRADES: {
    LIST: '/api/grades',
    CREATE: '/api/grades',
    STUDENT: (id) => `/api/grades/student/${id}`,
    UPDATE: (id) => `/api/grades/${id}`,
  },
  
  // Attendance
  ATTENDANCE: {
    LIST: '/api/attendance',
    CREATE: '/api/attendance',
    STUDENT: (id) => `/api/attendance/student/${id}`,
  },
  
  // Finance
  FINANCE: {
    FEES: '/api/finance/fees',
    PAYMENTS: '/api/payments',
    PAYMENT: (id) => `/api/payments/${id}`,
  },
  
  // Reports
  REPORTS: {
    BULLETIN: (id) => `/api/reports/bulletin/${id}`,
    CLASS: (id) => `/api/reports/class/${id}`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    MARK_READ: (id) => `/api/notifications/${id}/read`,
  },
  
  // Config
  CONFIG: '/api/config',
};

export default API_ENDPOINTS;
```

### Exemple d'Utilisation

```javascript
import api from '../core/api/axios';
import { API_ENDPOINTS } from '../core/api/endpoints';

// Login
const login = async (credentials) => {
  const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  return response.data;
};

// Get students
const getStudents = async (params) => {
  const response = await api.get(API_ENDPOINTS.STUDENTS.LIST, { params });
  return response.data;
};

// Create student
const createStudent = async (studentData) => {
  const response = await api.post(API_ENDPOINTS.STUDENTS.CREATE, studentData);
  return response.data;
};
```

---

## Déploiement

### Build de Production

```bash
# Créer le build
npm run build

# Prévisualiser le build
npm run preview
```

### Configuration Production

1. **Configurer les variables d'environnement**
2. **Configurer l'URL de l'API backend**
3. **Activer la compression**
4. **Configurer le cache**

### Déploiement sur Vercel

```bash
# Installation Vercel CLI
npm i -g vercel

# Déploiement
vercel
```

### Déploiement sur Netlify

```bash
# Build
npm run build

# Déploiement du dossier dist
netlify deploy --prod --dir=dist
```

### Configuration Nginx (Optionnel)

```nginx
server {
    listen 80;
    server_name akademee.cm;
    
    root /var/www/akademee-frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker (Optionnel)

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Bonnes Pratiques

### Développement

1. **Utiliser les composants réutilisables** du dossier `shared`
2. **Suivre la convention de nommage** des fichiers
3. **Gérer les erreurs** proprement avec try-catch
4. **Utiliser les custom hooks** pour la logique réutilisable
5. **Maintenir les fichiers de traduction** à jour

### Performance

1. **Lazy loading** des routes avec React.lazy()
2. **Optimiser les images** avec next/image ou équivalent
3. **Utiliser useMemo/useCallback** pour les calculs coûteux
4. **Éviter les re-renders** inutiles
5. **Utiliser React Query** pour la gestion du cache serveur

### Accessibilité

1. **Utiliser des balises sémantiques** HTML
2. **Ajouter des attributs ARIA** appropriés
3. **Assurer le contraste** des couleurs
4. **Supporter la navigation clavier**
5. **Tester avec lecteurs d'écran**

### Sécurité

1. **Valider les entrées** côté client
2. **Ne jamais stocker** de données sensibles dans localStorage
3. **Utiliser HTTPS** en production
4. **Implémenter CSRF protection**
5. **Sanitizer les inputs** utilisateur

---

## Support & Maintenance

### Dépannage

#### Erreur "Module not found"
**Solution**: Vérifiez que le module est installé avec `npm install`

#### Problème de thème non persistant
**Solution**: Vérifiez que localStorage est activé dans le navigateur

#### Traductions non chargées
**Solution**: Vérifiez la configuration i18next et les fichiers de traduction

#### Erreur CORS
**Solution**: Configurez le proxy dans vite.config.js ou le backend

### Maintenance

- **Mises à jour dépendances**: `npm update`
- **Nettoyage cache**: `npm run build -- --force`
- **Audit sécurité**: `npm audit`
- **Tests**: Implémenter des tests unitaires et E2E

---

**Akademee Frontend v1.0.0** | **React 19** | **Vite 8** | **TailwindCSS 4**

*Dernière mise à jour: Janvier 2024*
