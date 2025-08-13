// frontend/src/app/lib/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
// Correction : Import de toutes les fonctions d'authentification nécessaires directement depuis firebase/auth.
import { 
  getAuth, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TEMP – config hard-codée pour débloquer le dev local
const devConfig = {
  apiKey: "AIzaSyDV9FFyo5A7rd9MP7lSUm3m_dQAwBlbWdE",
  authDomain: "shopifybuilder-58858.firebaseapp.com",
  projectId: "shopifybuilder-58858",
  storageBucket: "shopifybuilder-58858.appspot.com",
  messagingSenderId: "744121861158",
  appId: "1:744121861158:web:bc6c00da0b640347b812e7",
  measurementId: "G-V3KP6K4K6M"
};

// Correction : Utilisation des variables d'environnement avec fallback pour le dev local.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || devConfig.apiKey,
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || devConfig.authDomain,
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || devConfig.projectId,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    devConfig.storageBucket,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    devConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || devConfig.appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || devConfig.measurementId
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Sanity check sur la clé API utilisée
const usedKey = firebaseConfig.apiKey ?? '(undefined)';
if (usedKey.length < 30 || !usedKey.startsWith('AI')) {
  console.warn('[Firebase:init] API key suspect :', usedKey);
  // Force l'utilisation de devConfig si la clé est suspecte
  Object.assign(firebaseConfig, devConfig);
}

// Log DEV unique (NODE_ENV !== 'production')
if (process.env.NODE_ENV !== 'production') {
  console.info('[Firebase:init] projectId='+firebaseConfig.projectId,
               'apiKey(4)=' + usedKey.slice(-4));
}

// Vérification si .env.local existe et écrase devConfig
if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== devConfig.apiKey) {
  // TODO: Supprimez ou mettez à jour .env.local pour ne pas écraser devConfig
  console.warn('[Firebase:init] .env.local est défini et écrase devConfig.apiKey. Veuillez vérifier votre configuration.');
}

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Export de toutes les instances et fonctions Firebase nécessaires pour l'application.
export { 
  app, 
  auth, 
  db, 
  googleProvider, 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup 
};

// --- DEV ONLY --- //
// Helpers DEV uniquement (ne s'exécutent qu'au navigateur et hors prod)
/**
 * @global
 * @typedef {import('firebase/auth').Auth} Auth
 * @property {Auth} auth
 * @property {() => Promise<string|null|undefined>} __getIdToken
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // expose l'instance d'auth
  window.auth = auth;
  // helper pour obtenir un ID token frais
  window.__getIdToken = async () => {
    const u = auth.currentUser;
    return u ? await u.getIdToken(true) : null;
  };
  console.log('[DEV] Firebase auth helpers disponibles sur window.auth et window.__getIdToken()');
}
// --- END DEV ONLY --- //