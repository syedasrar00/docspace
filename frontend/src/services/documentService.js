import { apiRequest } from './api.js';

export function listDocuments() {
  return apiRequest('/api/documents');
}

export function getDocument(documentId) {
  return apiRequest(`/api/documents/${encodeURIComponent(documentId)}`);
}

export function createDocument(payload = {}) {
  return apiRequest('/api/documents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateDocument(documentId, payload) {
  return apiRequest(`/api/documents/${encodeURIComponent(documentId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteDocument(documentId) {
  return apiRequest(`/api/documents/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}

export function importDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/api/documents/import', {
    method: 'POST',
    body: formData,
  });
}
