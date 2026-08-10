const config = require('./index');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];

  if (!config.firebaseServiceAccount) {
    const err = new Error(
      'FIREBASE_SERVICE_ACCOUNT não configurado. Defina a variável de ambiente com o JSON (ou base64) do service account do Firebase.'
    );
    err.code = 'FIREBASE_NOT_CONFIGURED';
    throw err;
  }

  const app = initializeApp({
    credential: cert(config.firebaseServiceAccount),
    projectId: config.firebaseProjectId
  });
  return app;
}

let db = null;

function getDb() {
  if (!db) db = getFirestore(getFirebaseApp());
  return db;
}

function isConfigured() {
  return Boolean(config.firebaseServiceAccount);
}

module.exports = { getFirebaseApp, getDb, isConfigured, FieldValue };
