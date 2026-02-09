# Mon Agent IA

Un agent IA conversationnel moderne avec interface type Copilot, incluant chat en temps réel, multi-modèles LLM gratuits, historique persistant, génération de code, analyse de documents, recherche web, speech-to-text, et génération d'images.

## 🚀 Fonctionnalités

### Chat Intelligent
- **Interface moderne type Copilot** avec design dark élégant
- **Chat en temps réel** avec affichage fluide des réponses
- **Support multi-modèles LLM** : GPT-4.1-nano, Gemini 2.5 Flash, GPT-4o Mini
- **Rendu Markdown avancé** avec coloration syntaxique pour le code
- **Historique persistant** avec recherche et organisation

### Recherche et Information
- **Recherche web intégrée** via DuckDuckGo et Wikipedia
- **Accès à l'information en temps réel** pour enrichir les réponses
- **Résultats contextualisés** directement dans les conversations

### Traitement de Fichiers
- **Upload et analyse de documents** (PDF, TXT, MD, JSON, CSV)
- **Extraction de texte** pour recherche et analyse
- **Stockage sécurisé** sur S3 avec métadonnées en base de données

### Fonctionnalités Multimédia
- **Speech-to-text** via Whisper API pour interactions vocales
- **Génération d'images** à partir de descriptions textuelles
- **Support audio** pour dictée et transcription

### Organisation
- **Système de favoris** pour marquer les conversations importantes
- **Tags personnalisables** pour organiser les discussions
- **Recherche avancée** dans l'historique des conversations
- **Export de données** pour sauvegarder vos conversations

## 🎨 Design

L'interface utilise un thème dark moderne avec :
- Palette de couleurs bleues élégantes
- Animations fluides et micro-interactions
- Design responsive (mobile et desktop)
- Mode clair/sombre commutable
- Sidebar pour navigation rapide dans l'historique

## 🛠️ Technologies

### Frontend
- **React 19** avec TypeScript
- **Tailwind CSS 4** pour le styling
- **shadcn/ui** pour les composants
- **tRPC** pour la communication type-safe avec le backend
- **Streamdown** pour le rendu Markdown

### Backend
- **Express 4** avec TypeScript
- **tRPC 11** pour les APIs type-safe
- **Drizzle ORM** pour la base de données
- **MySQL/TiDB** pour le stockage persistant
- **S3** pour le stockage de fichiers

### Intégrations
- **OpenAI API** (GPT-4.1-nano, GPT-4o-mini)
- **Gemini API** (Gemini 2.5 Flash)
- **DuckDuckGo Search API** (gratuit)
- **Wikipedia API** (gratuit)
- **Whisper API** pour speech-to-text
- **Image Generation API** pour création d'images

## 📦 Installation

```bash
# Installer les dépendances
pnpm install

# Configurer la base de données
pnpm db:push

# Lancer le serveur de développement
pnpm dev
```

## 🧪 Tests

```bash
# Exécuter les tests unitaires
pnpm test

# Vérifier les types TypeScript
pnpm check
```

## 🚀 Déploiement

L'application est prête pour le déploiement sur Manus avec :
- Hébergement intégré avec support de domaines personnalisés
- Base de données MySQL/TiDB managée
- Stockage S3 pour les fichiers
- Variables d'environnement sécurisées

## 📝 Structure du Projet

```
mon-agent-ia/
├── client/                 # Application React frontend
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   │   ├── ChatLayout.tsx      # Layout principal avec sidebar
│   │   │   └── ChatInterface.tsx   # Interface de chat
│   │   ├── pages/         # Pages de l'application
│   │   │   ├── Home.tsx   # Page d'accueil
│   │   │   └── Chat.tsx   # Page de conversation
│   │   └── lib/           # Utilitaires
│   └── public/            # Assets statiques
├── server/                # Backend Express + tRPC
│   ├── routers.ts         # Routeur principal
│   ├── chatRouter.ts      # Routes pour le chat
│   ├── advancedRouter.ts  # Routes pour fonctionnalités avancées
│   ├── llmService.ts      # Service LLM multi-modèles
│   ├── webSearch.ts       # Service de recherche web
│   └── db.ts              # Fonctions de base de données
├── drizzle/               # Schéma et migrations
│   └── schema.ts          # Tables de la base de données
└── shared/                # Code partagé frontend/backend
```

## 🔑 Variables d'Environnement

Les variables suivantes sont automatiquement injectées par Manus :

- `DATABASE_URL` : Connexion MySQL/TiDB
- `JWT_SECRET` : Secret pour les sessions
- `BUILT_IN_FORGE_API_KEY` : Clé API pour les services Manus
- `BUILT_IN_FORGE_API_URL` : URL des services Manus

## 🎯 Utilisation

1. **Créer une conversation** : Cliquez sur "Nouvelle conversation" ou "Commencer une conversation"
2. **Poser une question** : Tapez votre message dans la zone de texte
3. **Activer la recherche web** : Cliquez sur le bouton "Recherche web" pour enrichir les réponses
4. **Organiser** : Marquez les conversations importantes avec l'étoile (favoris)
5. **Rechercher** : Utilisez la barre de recherche dans la sidebar pour retrouver des conversations

## 🔮 Fonctionnalités à Venir

- Système d'agents autonomes pour tâches complexes
- Export complet de conversations et données
- Interface complète pour upload de fichiers
- Interface de génération d'images intégrée
- Interface speech-to-text avec enregistrement

## 📄 Licence

MIT

## 👥 Auteur

Créé avec Manus - Votre assistant IA pour le développement
