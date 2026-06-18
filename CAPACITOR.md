# App mobile (Capacitor) — iOS, iPadOS & Android

L'app web est empaquetée en application native via **Capacitor**. La WebView
pointe vers l'app **hébergée sur Base44**, donc le login Base44 fonctionne tel
quel et l'interface responsive (Tailwind) s'adapte automatiquement à
**iPhone, iPad, Android et tablettes**.

## ⚠️ Étape obligatoire : renseigner l'URL publiée

La WebView a besoin de l'URL de votre app **publiée** sur Base44.
Deux possibilités :

1. Éditer `capacitor.config.ts` → remplacer `SERVER_URL` par votre URL, **ou**
2. Passer la variable d'environnement à chaque sync :

```bash
CAP_SERVER_URL="https://votre-app.base44.app" npm run cap:sync
```

Tant que l'URL n'est pas la bonne, l'app native affichera une page vide.

## Prérequis

- **iOS / iPadOS** : macOS + Xcode (testé avec Xcode 26). Aucun CocoaPods requis
  (Capacitor 8 utilise Swift Package Manager).
- **Android** : Android Studio + un JDK 17 (`JAVA_HOME` configuré) + Android SDK.

## Lancer l'app

```bash
# build web + sync des deux plateformes
npm run cap:sync

# iOS : build + ouvre Xcode (puis ▶ sur simulateur ou appareil)
CAP_SERVER_URL="https://votre-app.base44.app" npm run cap:ios

# Android : build + ouvre Android Studio (puis ▶)
CAP_SERVER_URL="https://votre-app.base44.app" npm run cap:android
```

## Mises à jour

Comme la WebView charge l'app **hébergée**, toute modification publiée sur
Base44 est visible immédiatement au prochain lancement — pas besoin de
re-soumettre l'app sur les stores pour un changement d'UI.

Un `npm run cap:sync` n'est nécessaire que si l'on change la config Capacitor,
les plugins natifs, les icônes ou l'URL serveur.

## Tablettes / iPad

- iOS : la cible est universelle (`TARGETED_DEVICE_FAMILY = "1,2"`) → iPhone + iPad.
- Android : l'activité gère le redimensionnement (manifest `configChanges`),
  donc tablettes et multi-fenêtres OK.
- La mise en page s'appuie sur les breakpoints Tailwind déjà présents dans l'app web.

## Notes

- Les dossiers `ios/` et `android/` sont versionnés (projets natifs Capacitor) ;
  leurs artefacts de build sont ignorés via leurs `.gitignore` respectifs.
- Une app mobile **Expo/React Native** séparée existe aussi dans `mobile/` — c'est
  une approche alternative, indépendante de ce wrapper Capacitor.
