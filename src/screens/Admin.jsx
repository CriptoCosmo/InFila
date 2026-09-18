import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Navigate } from 'react-router-dom';
import { useVenue, useOwnerAuth } from '../lib/hooks.js';
import { VERTICALS } from '../config/verticals.js';
import { venueRef } from '../lib/queue.js';
import { updateDoc } from 'firebase/firestore';
import { Loader, NotFound } from '../components.jsx';

export default function Admin({ slug }) {
  const { loading, venue, cfg, error } = useVenue(slug);
  const { owner } = useOwnerAuth();
  const canvas = useRef(null);
  const [salvato, setSalvato] = useState(false);

  const url = `${location.origin}/v/${slug}`;

  useEffect(() => {
    if (canvas.current) {
      QRCode.toCanvas(canvas.current, url, { width: 320, margin: 1, color: { dark: '#1C1A17', light: '#FFFFFF' } });
    }
  }, [url]);

  if (loading) return <Loader />;
  if (error || !venue) return <NotFound slug={slug} />;
  if (venue.ownerUid !== owner?.uid) return <Navigate to="/dashboard" replace />;

  async function applica(vertical) {
    await updateDoc(venueRef(venue.id), { vertical, config: VERTICALS[vertical].config });
    setSalvato(true);
    setTimeout(() => setSalvato(false), 2000);
  }

  return (
    <main className="schermo schermo--admin">
      <header className="insegna">
        <p className="insegna__occhiello">{venue.name}</p>
        <h1 className="insegna__titolo">Impostazioni</h1>
      </header>

      <section className="qr">
        <canvas ref={canvas} className="qr__canvas" />
        <p className="qr__url">{url}</p>
        <p className="campo__aiuto">Stampa questo codice e attaccalo all'ingresso. Porta direttamente alla coda.</p>
      </section>

      <section className="modulo">
        <span className="campo__etichetta">Versione dell'app</span>
        <div className="versioni">
          {Object.entries(VERTICALS).map(([key, v]) => (
            <button key={key} className={`versione ${venue.vertical === key ? 'is-attiva' : ''}`} onClick={() => applica(key)}>
              <span className="versione__nome">{v.label}</span>
              <span className="versione__hint">{v.hint}</span>
            </button>
          ))}
        </div>
        {salvato && <p className="campo__aiuto">Versione applicata. I clienti in coda non vengono toccati.</p>}
      </section>

      <section className="modulo">
        <span className="campo__etichetta">Configurazione attiva</span>
        <ul className="riepilogo">
          <li>Chiede il nome: <strong>{cfg.askName ? 'sì' : 'no'}</strong></li>
          <li>Chiede le persone: <strong>{cfg.askPartySize ? `sì (max ${cfg.partyMax})` : 'no'}</strong></li>
          <li>Chiede l'ordine: <strong>{cfg.askOrder ? 'sì' : 'no'}</strong></li>
          <li>Prefisso numero: <strong>{cfg.prefix || 'nessuno'}</strong></li>
          <li>Casse: <strong>{cfg.counters}</strong></li>
          <li>Pubblicità: <strong>{cfg.display.adMode}</strong>{cfg.display.adMode === 'full' && ` · ogni ${cfg.display.adEverySeconds}s per ${cfg.display.adDurationSeconds}s`}</li>
        </ul>
        <p className="campo__aiuto">Ogni voce vive in <code>venues/{venue.id}.config</code> su Firestore: si modifica anche da console, senza ripubblicare.</p>
      </section>

      <section className="modulo">
        <span className="campo__etichetta">Schermi</span>
        <div className="collegamenti">
          <a className="azione azione--discreta" href={`/v/${slug}/display`}>Monitor in sala</a>
          <a className="azione azione--discreta" href={`/v/${slug}/staff`}>Pannello operatore</a>
          <a className="azione azione--discreta" href={`/v/${slug}`}>Vista cliente</a>
        </div>
      </section>
    </main>
  );
}
