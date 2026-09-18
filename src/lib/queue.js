import {
  collection, doc, getDoc, getDocs, onSnapshot, query, where, orderBy, limit,
  runTransaction, writeBatch, serverTimestamp, updateDoc, setDoc, deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase.js';
import { VERTICALS } from '../config/verticals.js';
import { suggestSlug } from './slug.js';

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const venueRef = (venueId) => doc(db, 'venues', venueId);
export const ticketsRef = (venueId) => collection(db, 'venues', venueId, 'tickets');

export const formatNumber = (cfg, n) => `${cfg.prefix || ''}${n}`;

/* ---------------------------------------------------------------- lettura */

export function watchVenue(venueId, cb) {
  return onSnapshot(venueRef(venueId), (s) => cb(s.exists() ? { id: s.id, ...s.data() } : null));
}

/** Coda del giorno, in ordine di chiamata. */
export function watchQueue(venueId, cb) {
  const q = query(ticketsRef(venueId), where('day', '==', todayKey()), orderBy('number'));
  return onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function watchTicket(venueId, ticketId, cb) {
  return onSnapshot(doc(db, 'venues', venueId, 'tickets', ticketId), (s) =>
    cb(s.exists() ? { id: s.id, ...s.data() } : null)
  );
}

export async function findVenueBySlug(slug) {
  const q = query(collection(db, 'venues'), where('slug', '==', slug), limit(1));
  const s = await getDocs(q);
  return s.empty ? null : { id: s.docs[0].id, ...s.docs[0].data() };
}

/* -------------------------------------------------------------- scrittura */

/**
 * Entra in coda. Il numero viene assegnato in transazione sul documento del
 * locale: due clienti che scansionano nello stesso istante non prendono mai
 * lo stesso numero. Il reset giornaliero avviene qui, senza cron job.
 */
export async function joinQueue(venueId, cfg, payload) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('auth-mancante');

  const day = todayKey();
  const tRef = doc(ticketsRef(venueId));

  const number = await runTransaction(db, async (tx) => {
    const snap = await tx.get(venueRef(venueId));
    if (!snap.exists()) throw new Error('locale-inesistente');
    const v = snap.data();
    const sameDay = !cfg.resetDaily || v.counterDay === day;
    const next = sameDay ? (v.lastNumber ?? cfg.startAt - 1) + 1 : cfg.startAt;

    tx.update(venueRef(venueId), { lastNumber: next, counterDay: day });
    tx.set(tRef, {
      uid,
      day,
      number: next,
      name: payload.name?.trim() || null,
      partySize: Number(payload.partySize) || 1,
      items: payload.items ?? [],
      note: (payload.note ?? '').slice(0, 200),
      status: 'waiting',
      counter: null,
      createdAt: serverTimestamp(),
      calledAt: null,
      closedAt: null
    });
    return next;
  });

  return { id: tRef.id, number };
}

/**
 * Chiama il prossimo. Chiude il ticket ancora aperto sulla stessa cassa e
 * aggiorna il "sto servendo" sul documento del locale, così il monitor
 * riceve un solo aggiornamento.
 */
export async function callNext(venueId, counter = 1) {
  const day = todayKey();
  const qWaiting = query(
    ticketsRef(venueId), where('day', '==', day), where('status', '==', 'waiting'),
    orderBy('number'), limit(1)
  );
  const openNow = query(
    ticketsRef(venueId), where('day', '==', day), where('status', '==', 'called'), orderBy('number')
  );

  const [nextSnap, openSnap] = await Promise.all([getDocs(qWaiting), getDocs(openNow)]);
  if (nextSnap.empty) return null;

  const next = nextSnap.docs[0];
  const batch = writeBatch(db);

  openSnap.docs
    .filter((d) => d.data().counter === counter)
    .forEach((d) => batch.update(d.ref, { status: 'served', closedAt: serverTimestamp() }));

  batch.update(next.ref, { status: 'called', counter, calledAt: serverTimestamp() });
  batch.update(venueRef(venueId), {
    nowServing: next.data().number,
    nowServingName: next.data().name ?? null,
    nowServingCounter: counter,
    nowServingAt: serverTimestamp(),
    callSeq: (Date.now() % 1e9)   // cambia a ogni chiamata: fa scattare monitor e vibrazione
  });

  await batch.commit();
  return { id: next.id, ...next.data() };
}

export const recall = (venueId, counter, number) =>
  updateDoc(venueRef(venueId), { nowServing: number, nowServingCounter: counter, callSeq: Date.now() % 1e9 });

export const setStatus = (venueId, ticketId, status) =>
  updateDoc(doc(db, 'venues', venueId, 'tickets', ticketId), { status, closedAt: serverTimestamp() });

export const cancelOwnTicket = (venueId, ticketId) =>
  updateDoc(doc(db, 'venues', venueId, 'tickets', ticketId), { status: 'cancelled' });

/* ------------------------------------------------------------------ stime */

export function positionOf(queue, ticket) {
  if (!ticket || ticket.status !== 'waiting') return 0;
  return queue.filter((t) => t.status === 'waiting' && t.number < ticket.number).length;
}

/** Minuti stimati: posizione x tempo medio, diviso il numero di casse attive. */
export function waitMinutes(cfg, position) {
  const casse = Math.max(1, cfg.counters || 1);
  return Math.max(0, Math.round((position * cfg.avgServiceMinutes) / casse));
}

export function humanWait(min) {
  if (min <= 0) return 'Tocca a te';
  if (min < 60) return `~${min} min`;
  const h = Math.floor(min / 60);
  return `~${h}h ${min % 60}m`;
}

export async function createVenue(owner, { name, slug, vertical }) {
  if (!owner?.uid) throw new Error('Manca owner');
  if (!slug || !name || !vertical) throw new Error('Dati mancanti');

  // Verifica che lo slug non sia già stato preso nel frattempo
  const existing = await findVenueBySlug(slug);
  if (existing) {
    throw new Error(`slug-occupato:${suggestSlug(slug)}`);
  }

  const verticalData = VERTICALS[vertical];
  if (!verticalData) throw new Error('Verticale non valido');

  const newDocRef = doc(collection(db, 'venues'));
  
  await setDoc(newDocRef, {
    ownerUid: owner.uid,
    slug,
    name,
    vertical,
    config: verticalData.config,
    createdAt: serverTimestamp(),
  });

  return newDocRef.id;
}

export async function deleteVenue(venueId) {
  if (!venueId) throw new Error('Manca ID locale');
  await deleteDoc(doc(db, 'venues', venueId));
}
