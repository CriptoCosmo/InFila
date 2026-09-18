import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Genera uno slug URL-safe a partire dal nome di un locale.
 * (lowercase, accenti rimossi, spazi multipli collassati in trattini,
 * caratteri non alfanumerici rimossi).
 */
export function generateSlug(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .normalize('NFD') // Remove diacritics (accents)
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-') // Replace any non-alphanumeric character with a hyphen
    .replace(/^-+|-+$/g, ''); // Trim hyphens from start and end
}

/**
 * Genera uno slug suggerito aggiungendo un suffisso casuale
 * corto (4 caratteri) senza caratteri ambigui (no 0/O, 1/l, I).
 */
export function suggestSlug(base) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${base}-${suffix}`;
}

/**
 * Verifica se lo slug è disponibile interrogando Firestore.
 * Ritorna true se disponibile (nessuna venue usa questo slug), false altrimenti.
 */
export async function checkSlugAvailable(slug) {
  if (!slug) return false;
  
  const venuesRef = collection(db, 'venues');
  const q = query(venuesRef, where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);
  
  return snapshot.empty;
}
