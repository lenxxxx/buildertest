# Instructions de développement

Pour lancer l'application en mode développement, exécutez la commande suivante à la racine du projet :

```bash
cd frontend && npm run dev
```

## Configuration Firebase

Pour le développement local, la configuration Firebase est incluse directement dans `src/app/lib/firebase.js` via `devConfig`. Cela permet de démarrer rapidement sans configuration manuelle.

**Pour la production ou un environnement spécifique :**

Créez un fichier `.env.local` à la racine du dossier `frontend/` et renseignez les variables d'environnement suivantes avec vos propres valeurs Firebase :

```
NEXT_PUBLIC_FIREBASE_API_KEY="VOTRE_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="VOTRE_AUTH_DOMAIN"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="VOTRE_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="VOTRE_STORAGE_BUCKET"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="VOTRE_MESSAGING_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="VOTRE_APP_ID"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="VOTRE_MEASUREMENT_ID"
```

Le système utilisera automatiquement ces variables si elles sont définies, sinon il basculera sur la configuration de développement (`devConfig`).

## Règles Firestore

Assurez-vous que vos règles Firestore sont configurées pour permettre l'accès aux données des utilisateurs. Voici un exemple de règles à ajouter dans la console Firebase (Firestore -> Règles) :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/shops/{shopId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```