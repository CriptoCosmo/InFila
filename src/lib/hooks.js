import { useEffect, useRef, useState } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { ensureAuth, auth, db } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { findVenueBySlug, watchVenue, watchQueue } from './queue.js';
import { resolveConfig } from '../config/verticals.js';

/** Risolve lo slug del QR in un locale e ne segue le modifiche in tempo reale. */
export function useVenue(slug) {
  const [state, setState] = useState({ loading: true, venue: null, cfg: null, error: null });

  useEffect(() => {
    let stop = () => {};
    let alive = true;

    (async () => {
      try {
        await ensureAuth();
        const found = await findVenueBySlug(slug);
        if (!alive) return;
        if (!found) return setState({ loading: false, venue: null, cfg: null, error: 'not-found' });
        stop = watchVenue(found.id, (v) => {
          if (v && alive) setState({ loading: false, venue: v, cfg: resolveConfig(v), error: null });
        });
      } catch (e) {
        if (alive) setState({ loading: false, venue: null, cfg: null, error: e.message });
      }
    })();

    return () => { alive = false; stop(); };
  }, [slug]);

  return state;
}

export function useQueue(venueId) {
  const [queue, setQueue] = useState([]);
  useEffect(() => (venueId ? watchQueue(venueId, setQueue) : undefined), [venueId]);
  return queue;
}

/** Suona e vibra quando il locale chiama un nuovo numero. */
export function useCallSignal(venue, { sound = true, vibrate = false } = {}) {
  const prev = useRef(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const seq = venue?.callSeq;
    if (seq == null) return;
    if (prev.current === null) { prev.current = seq; return; }
    if (seq === prev.current) return;
    prev.current = seq;

    setFlash(true);
    const t = setTimeout(() => setFlash(false), 4000);

    if (sound) {
      try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        [880, 1320].forEach((f, i) => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = 'sine'; o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, ac.currentTime + i * 0.18);
          g.gain.exponentialRampToValueAtTime(0.25, ac.currentTime + i * 0.18 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + i * 0.18 + 0.35);
          o.connect(g).connect(ac.destination);
          o.start(ac.currentTime + i * 0.18); o.stop(ac.currentTime + i * 0.18 + 0.4);
        });
      } catch { /* l'audio richiede un'interazione: si attiva al primo tocco */ }
    }
    if (vibrate && navigator.vibrate) navigator.vibrate([200, 100, 200]);

    return () => clearTimeout(t);
  }, [venue?.callSeq, sound, vibrate]);

  return flash;
}

export function useLocal(key, initial) {
  const [v, setV] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial; }
    catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* privato */ } }, [key, v]);
  return [v, setV];
}

export function useOwnerAuth() {
  const [state, setState] = useState({ owner: null, loading: true });
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setState({ owner: user && !user.isAnonymous ? user : null, loading: false });
    });
  }, []);
  return state;
}

export function useOwnerVenues(uid) {
  const [state, setState] = useState({ loading: true, venues: [], error: null });

  useEffect(() => {
    if (!uid) {
      setState({ loading: false, venues: [], error: null });
      return;
    }

    setState(s => ({ ...s, loading: true }));

    const q = query(collection(db, 'venues'), where('ownerUid', '==', uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const venues = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setState({ loading: false, venues, error: null });
    }, (e) => {
      setState({ loading: false, venues: [], error: e.message });
    });

    return () => unsubscribe();
  }, [uid]);

  return state;
}
