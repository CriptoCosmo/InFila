import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useVenue, useQueue, useLocal, useOwnerAuth } from '../lib/hooks.js';
import { callNext, recall, setStatus, formatNumber } from '../lib/queue.js';
import { Loader, NotFound } from '../components.jsx';

export default function Staff({ slug }) {
  const { loading, venue, cfg, error } = useVenue(slug);
  const { owner } = useOwnerAuth();
  const queue = useQueue(venue?.id);
  const [counter, setCounter] = useLocal('ticketz:cassa', 1);
  const [busy, setBusy] = useState(false);

  const attesa = useMemo(() => queue.filter((t) => t.status === 'waiting'), [queue]);
  const miei = useMemo(() => queue.filter((t) => t.status === 'called' && t.counter === counter), [queue, counter]);
  const corrente = miei[miei.length - 1] ?? null;

  if (loading) return <Loader />;
  if (error || !venue) return <NotFound slug={slug} />;
  if (venue.ownerUid !== owner?.uid) return <Navigate to="/dashboard" replace />;

  async function prossimo() {
    setBusy(true);
    try { await callNext(venue.id, counter); } finally { setBusy(false); }
  }

  return (
    <main className="schermo schermo--staff">
      <header className="barra">
        <span className="barra__nome">{venue.name}</span>
        {cfg.counters > 1 && (
          <div className="selettore-cassa">
            {Array.from({ length: cfg.counters }, (_, i) => i + 1).map((c) => (
              <button key={c} className={`selettore-cassa__btn ${c === counter ? 'is-attiva' : ''}`} onClick={() => setCounter(c)}>
                {cfg.words.counter} {c}
              </button>
            ))}
          </div>
        )}
      </header>

      <section className="pannello">
        <p className="pannello__etichetta">Stai servendo</p>
        <p className="pannello__numero">{corrente ? formatNumber(cfg, corrente.number) : '—'}</p>
        {corrente?.name && <p className="pannello__dettaglio">{corrente.name}{corrente.partySize > 1 ? ` · ${corrente.partySize} persone` : ''}</p>}
        {corrente?.items?.length > 0 && (
          <p className="pannello__dettaglio">{corrente.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</p>
        )}
        {corrente?.note && <p className="pannello__nota">{corrente.note}</p>}

        <div className="pannello__azioni">
          <button className="azione azione--principale" onClick={prossimo} disabled={busy || attesa.length === 0}>
            {attesa.length === 0 ? 'Nessuno in coda' : `Chiama il prossimo (${attesa.length})`}
          </button>
          <div className="pannello__secondarie">
            <button className="azione azione--discreta" disabled={!corrente}
              onClick={() => recall(venue.id, counter, corrente.number)}>Richiama</button>
            <button className="azione azione--discreta" disabled={!corrente}
              onClick={() => setStatus(venue.id, corrente.id, 'served')}>Servito</button>
            <button className="azione azione--discreta" disabled={!corrente}
              onClick={() => setStatus(venue.id, corrente.id, 'noshow')}>Assente</button>
          </div>
        </div>
      </section>

      <section className="lista">
        <h2 className="lista__titolo">In coda</h2>
        {attesa.length === 0 && <p className="lista__vuota">La coda è vuota. Il prossimo QR scansionato comparirà qui.</p>}
        <ul>
          {attesa.map((t, i) => (
            <li key={t.id} className="lista__riga">
              <span className="lista__numero">{formatNumber(cfg, t.number)}</span>
              <span className="lista__chi">
                {t.name ?? '—'}
                {t.partySize > 1 && <em className="lista__coperti"> · {t.partySize}p</em>}
                {t.items?.length > 0 && <em className="lista__coperti"> · {t.items.map((x) => `${x.qty}×${x.name}`).join(' ')}</em>}
              </span>
              <span className="lista__pos">{i === 0 ? 'prossimo' : `+${i}`}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
