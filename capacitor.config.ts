import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor enveloppe l'app web HÉBERGÉE sur Base44 (WebView pointant l'URL
 * publiée). Le login Base44 fonctionne ainsi tel quel, et le responsive
 * iPhone/iPad/Android/tablette est géré par les classes Tailwind de l'app web.
 *
 * ⚠️ À FAIRE : renseigner l'URL de VOTRE app publiée (Base44 → Publier),
 * soit ici dans SERVER_URL, soit via la variable d'environnement CAP_SERVER_URL :
 *     CAP_SERVER_URL="https://votre-app.base44.app" npx cap sync
 */
const SERVER_URL = process.env.CAP_SERVER_URL || 'https://REMPLACER-PAR-VOTRE-APP.base44.app';

const config: CapacitorConfig = {
  appId: 'com.fdm.footymanager',
  appName: 'Global Sports Agency',
  webDir: 'dist',
  server: {
    url: SERVER_URL,
    cleartext: false,
  },
  ios: {
    // Respecte les encoches / barres système (iPhone à notch, iPad).
    contentInset: 'always',
    backgroundColor: '#0f172a',
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    backgroundColor: '#0f172a',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: '#0f172a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a',
    },
  },
};

export default config;
