import { useEffect, useMemo, useRef, useState } from 'react';
import { useVenue, useQueue, useCallSignal } from '../lib/hooks.js';
import { formatNumber } from '../lib/queue.js';
import { Loader, NotFound } from '../components.jsx';

function useAdRotation(ads, display, callSeq) {
  const [index, setIndex] = useState(0);
  const [fullOn, setFullOn] = useState(false);
  const timer = useRef(null);
  const n = ads.length;
  const mode = n === 0 ? 'off' : display.adMode;

  useEffect(() => {
    if (mode === 'off' || n < 2) return;
    const secs = ads[index % n]?.seconds ?? 10;
    const t = setTimeout(() => setIndex((i) => (i + 1) % n), secs * 1000);
    return () => clearTimeout(t);
  }, [mode, index, n, ads]);

  useEffect(() => {
    if (mode !== 'full') { setFullOn(false); return; }
    let vivo = true;
    const giro = () => {
      timer.current = setTimeout(() => {
        if (!vivo) return;
        setFullOn(true);
        timer.current = setTimeout(() => {
          if (!vivo) return;
          setFullOn(false);
          setIndex((i) => (i + 1) % n);
          giro();
        }, display.adDurationSeconds * 1000);
      }, display.adEverySeconds * 1000);
    };
    giro();
    return () => { vivo = false; clearTimeout(timer.current); };
  }, [mode, n, display.adEverySeconds, display.adDurationSeconds]);

  useEffect(() => { setFullOn(false); }, [callSeq]);

  return { ad: n ? ads[index % n] : null, fullOn, mode };
}

function AdContent({ ad }) {
  if (!ad) return null;
  if (ad.kind === 'image') return <img className="annuncio__img" src={ad.src} alt={ad.title ?? ''} />;
  return (
    <>
      <p className="monitor__annuncio-titolo">{ad.title}</p>
      {ad.body && <p className="monitor__annuncio-corpo">{ad.body}</p>}
    </>
  );
}

export default function Display({ slug }) {
  const { loading, venue, cfg, error } = useVenue(slug);
  const queue = useQueue(venue?.id);
  const flash = useCallSignal(venue, { sound: cfg?.display?.chime ?? true });
  const { ad, fullOn, mode } = useAdRotation(cfg?.ads ?? [], cfg?.display ?? {}, venue?.callSeq);

  const recenti = useMemo(
    () => queue
      .filter((t) => t.calledAt && t.number !== venue?.nowServing)
      .sort((a, b) => (b.calledAt?.seconds ?? 0) - (a.calledAt?.seconds ?? 0))
      .slice(0, cfg?.display?.recentCalls ?? 4),
    [queue, venue?.nowServing, cfg]
  );

  if (loading) return <Loader scuro />;
  if (error || !venue) return <NotFound slug={slug} />;

  return (
    <main className="display-schermo">
      <div className={`monitor${flash ? ' monitor--chiamata' : ''}`}>
        <div className="monitor__numero">
          <p className="monitor__numero-etichetta">Stiamo servendo</p>
          <p className="monitor__numero-grande">
            {venue.nowServing != null ? formatNumber(cfg, venue.nowServing) : '—'}
          </p>
          {venue.nowServingName && <p className="monitor__nome">{venue.nowServingName}</p>}
          {venue.nowServing != null && (
            <span className="monitor__cassa-badge">
              {cfg.words.counter} {venue.nowServingCounter ?? 1}
            </span>
          )}
        </div>

        <div className="monitor__lato">
          {mode === 'box' && ad && (
            <div className="monitor__annuncio">
              <p className="monitor__annuncio-label">{venue.name}</p>
              <AdContent ad={ad} />
            </div>
          )}
          {recenti.length > 0 && (
            <div className="monitor__prossimi">
              <span className="monitor__prossimi-label">Precedenti</span>
              {recenti.map((t) => (
                <span key={t.id} className="monitor__prossimi-badge">{formatNumber(cfg, t.number)}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {mode === 'full' && fullOn && ad && (
        <div className="annuncio--pieno" role="presentation">
          <p className="monitor__annuncio-label">{venue.name}</p>
          <AdContent ad={ad} />
        </div>
      )}
    </main>
  );
}
