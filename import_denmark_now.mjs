/**
 * Script d'import direct des 96 contacts danois vers Base44
 * Usage: APP_ID=ton_app_id node import_denmark_now.mjs
 *
 * Pour trouver ton APP_ID :
 *   1. Ouvre ton app sur app.base44.com
 *   2. DevTools > Console > tapez : localStorage.getItem('base44_app_id')
 *      OU regardez l'URL : app.base44.com/apps/TON_APP_ID/...
 *
 * Pour le TOKEN (optionnel si l'app est publique) :
 *   DevTools > Console > localStorage.getItem('base44_access_token')
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const APP_ID = process.env.APP_ID;
const TOKEN = process.env.TOKEN || null;
const FUNCTIONS_VERSION = process.env.FUNCTIONS_VERSION || 'prod';

if (!APP_ID) {
  console.error('❌ APP_ID manquant!');
  console.error('Usage: APP_ID=ton_app_id node import_denmark_now.mjs');
  console.error('       APP_ID=xxx TOKEN=yyy node import_denmark_now.mjs');
  process.exit(1);
}

const DATA_FILE = path.join(__dirname, 'denmark_import_data.json');
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

console.log(`📊 Données chargées:`);
console.log(`   - Contacts: ${data.contacts.length}`);
console.log(`   - Joueurs: ${data.joueurs.length}`);
console.log(`   - Clubs: ${data.clubs.length}`);
console.log(`   - Fichier: ${data.nom_fichier}`);
console.log('');
console.log(`🚀 Envoi vers Base44 (App: ${APP_ID}, Version: ${FUNCTIONS_VERSION})...`);

const url = `https://base44.app/api/apps/${APP_ID}/functions/${FUNCTIONS_VERSION}/importExcelData`;
const headers = {
  'Content-Type': 'application/json',
  'X-App-Id': APP_ID,
};
if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

try {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });

  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    result = responseText;
  }

  if (!response.ok) {
    console.error(`❌ Erreur HTTP ${response.status}:`);
    console.error(typeof result === 'object' ? JSON.stringify(result, null, 2) : result);
    process.exit(1);
  }

  console.log('✅ Import réussi!');
  if (result?.created !== undefined) console.log(`   Contacts créés: ${result.created}`);
  if (result?.updated !== undefined) console.log(`   Contacts mis à jour: ${result.updated}`);
  if (result?.errors?.length) {
    console.log(`   ⚠️  Erreurs (${result.errors.length}):`);
    result.errors.slice(0, 5).forEach(e => console.log(`      - ${e}`));
  }
  console.log('');
  console.log('Réponse complète:', JSON.stringify(result, null, 2));
} catch (err) {
  console.error('❌ Erreur réseau:', err.message);
  process.exit(1);
}
