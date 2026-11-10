import { apiRequest } from './api.js';

export function listUsers() {
  return apiRequest('/api/users');
}

export function listDocumentShares(documentId) {
  return apiRequest(`/api/documents/${encodeURIComponent(documentId)}/shares`);
}

export function shareDocument(documentId, userId, permission) {
  return apiRequest(`/api/documents/${encodeURIComponent(documentId)}/shares`, {
    method: 'POST',
    body: JSON.stringify({ user_id: Number(userId), permission }),
  });
}

export function revokeDocumentShare(documentId, userId) {
  return apiRequest(
    `/api/documents/${encodeURIComponent(documentId)}/shares/${encodeURIComponent(userId)}`,
    { method: 'DELETE' },
  );
}
