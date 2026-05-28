import { createClient } from '@base44/sdk';
import axios from 'axios';
import { appParams } from '../lib/app-params';

const { appId, functionsVersion, appBaseUrl } = appParams;

const BASE44_SERVER = 'https://base44.app';

export const base44 = createClient({
  appId,
  functionsVersion,
  serverUrl: BASE44_SERVER,
  requiresAuth: false,
  appBaseUrl,
});

export const setClientToken = (token) => {
  if (base44?.auth?.setToken) {
    base44.auth.setToken(token);
  }
};

// ── Cache auth.me() pour toute la session ────────────────────────────────────
// auth.me() est appelé 22 fois dans l'app (1 par query qui a besoin de l'email).
// On intercepte la méthode une seule fois ici pour que tous les appels
// existants obtiennent le résultat mis en cache sans modifier chaque fichier.
let _cachedUser = null;
const _origMe = base44.auth.me.bind(base44.auth);
base44.auth.me = async () => {
  if (_cachedUser) return _cachedUser;
  _cachedUser = await _origMe();
  return _cachedUser;
};

export const clearUserCache = () => {
  _cachedUser = null;
};

// ── Upload fichier React Native vers Base44 Storage ──────────────────────────
// Le SDK vérifie instanceof File (API browser) inexistant en RN,
// donc on passe par axios directement avec un FormData React Native.
export const uploadFileRN = async (fileAsset, tokenOrNull) => {
  const formData = new FormData();
  formData.append('file', {
    uri: fileAsset.uri,
    name: fileAsset.name || 'upload',
    type: fileAsset.mimeType || 'application/octet-stream',
  });

  const headers = {
    'Content-Type': 'multipart/form-data',
    'X-App-Id': appId,
  };
  if (tokenOrNull) headers['Authorization'] = `Bearer ${tokenOrNull}`;

  const response = await axios.post(
    `${BASE44_SERVER}/api/apps/${appId}/integration-endpoints/Core/UploadFile`,
    formData,
    { headers },
  );
  return response.data;
};
