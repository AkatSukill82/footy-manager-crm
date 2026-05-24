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

// Téléverse un fichier local React Native vers Base44 Storage.
// Le SDK vérifie `instanceof File` (API browser) qui n'existe pas en RN,
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
  return response.data; // { file_url: "..." }
};
