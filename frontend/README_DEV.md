# Guide de développement

## Lancement du serveur de développement

Pour lancer le serveur de développement, exécutez les commandes suivantes :

```bash
cd frontend
npm run dev
```

## Authentification Shopify

Pour initier le processus d'authentification OAuth de Shopify, visitez l'URL suivante dans votre navigateur :

```
https://<votre-tunnel-ngrok>/api/auth/start?shop=<le-nom-de-la-boutique>.myshopify.com
```

Remplacez `<votre-tunnel-ngrok>` par l'URL de votre tunnel ngrok et `<le-nom-de-la-boutique>` par le nom de votre boutique de développement Shopify.
