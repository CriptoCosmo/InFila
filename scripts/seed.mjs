/**
 * Crea un locale di prova con l'Admin SDK.
 *   npm i -D firebase-admin
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json node scripts/seed.mjs panificio
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { VERTICALS } from '../src/config/verticals.js';

const vertical = process.argv[2] ?? 'panificio';
const slug = process.argv[3] ?? 'demo';
const ownerUid = process.argv[4] ?? null;
const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

initializeApp(isEmulator
  ? { projectId: process.env.GCLOUD_PROJECT ?? 'demo' }
  : { credential: applicationDefault() });
const db = getFirestore();

const preset = VERTICALS[vertical];
if (!preset) { console.error(`Versione sconosciuta: ${vertical}`); process.exit(1); }

await db.collection('venues').doc(slug).set({
  slug,
  name: preset.label,
  vertical,
  config: preset.config,
  open: true,
  lastNumber: preset.config.startAt - 1,
  counterDay: null,
  nowServing: null,
  nowServingName: null,
  nowServingCounter: null,
  callSeq: 0,
  ownerUid
});

console.log(`Locale "${slug}" creato come ${vertical}.`);
console.log(`QR:      /v/${slug}`);
console.log(`Monitor: /v/${slug}/display`);
console.log(`Cassa:   /v/${slug}/staff  (aggiungi il tuo uid in venues/${slug}/staff/{uid})`);
process.exit(0);
