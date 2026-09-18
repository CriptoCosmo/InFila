import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Navigate, Link } from 'react-router-dom';
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
    if (canvas.current && !loading) {
      QRCode.toCanvas(canvas.current, url, { 
        width: 280, 
        margin: 2, 
        color: { dark: '#1C1A17', light: '#FFFFFF' } 
      });
    }
  }, [url, loading]);

  if (loading) return <Loader scuro />;
  if (error || !venue) return <NotFound slug={slug} />;
  if (venue.ownerUid !== owner?.uid) return <Navigate to="/dashboard" replace />;

  async function applica(vertical) {
    await updateDoc(venueRef(venue.id), { vertical, config: VERTICALS[vertical].config });
    setSalvato(true);
    setTimeout(() => setSalvato(false), 3000);
  }

  const handleDownloadQR = () => {
    if (!canvas.current) return;
    const link = document.createElement('a');
    link.download = `qrcode-${slug}.png`;
    link.href = canvas.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="schermo" style={{ paddingBottom: 64 }}>
      <header className="insegna" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
        <Link to="/dashboard" style={{ color: 'var(--grigio-testo)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
          ← Torna alla Dashboard
        </Link>
        <div>
          <h1 className="insegna__titolo" style={{ margin: 0 }}>{venue.name}</h1>
          <p className="insegna__occhiello" style={{ margin: 0, textTransform: 'none', letterSpacing: 0 }}>Gestione locale</p>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 24 }}>
        
        {/* QR CODE CARD */}
        <section className="card" style={{ alignItems: 'center', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>QR Code del locale</h2>
          <p style={{ margin: 0, color: 'var(--grigio-testo)', fontSize: 14 }}>
            Stampa questo codice e mettilo all'ingresso. I clienti lo scansioneranno per mettersi in coda.
          </p>
          <div style={{ padding: 16, background: '#fff', borderRadius: 'var(--r-md)', marginTop: 8 }}>
            <canvas ref={canvas} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
          </div>
          <button className="btn btn--secondary" onClick={handleDownloadQR}>
            Scarica Immagine
          </button>
          <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--terracotta)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
            Oppure visita il link diretto ↗
          </a>
        </section>

        {/* TIPO DI LOCALE */}
        <section className="card">
          <h2 style={{ margin: 0, fontSize: 18 }}>Tipo di locale</h2>
          <p style={{ margin: 0, color: 'var(--grigio-testo)', fontSize: 14 }}>
            Cambia il modello del tuo locale. I clienti attualmente in coda non subiranno interruzioni.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
            {Object.entries(VERTICALS).map(([key, v]) => {
              const isActive = venue.vertical === key;
              return (
                <div 
                  key={key} 
                  onClick={() => applica(key)}
                  style={{ 
                    cursor: 'pointer', 
                    padding: 16, 
                    borderRadius: 'var(--r-md)', 
                    border: isActive ? '2px solid var(--terracotta)' : '2px solid var(--crema)', 
                    background: isActive ? 'var(--crema-card)' : 'transparent',
                    display: 'flex', flexDirection: 'column', gap: 4,
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--cacao)', fontSize: 15 }}>{v.label}</span>
                  <span style={{ fontSize: 13, color: 'var(--grigio-testo)', lineHeight: 1.3 }}>{v.hint}</span>
                </div>
              );
            })}
          </div>
          {salvato && <div className="avviso" style={{ backgroundColor: 'var(--salvia)', color: '#fff', marginTop: 8 }}>Modello aggiornato con successo!</div>}
        </section>

        {/* CONFIGURAZIONE TECNICA */}
        <section className="card">
          <h2 style={{ margin: 0, fontSize: 18 }}>Regole attive</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, color: 'var(--grigio-testo)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dati richiesti</span>
              <span style={{ fontWeight: 500 }}>Nome: {cfg.askName ? 'Sì' : 'No'}</span>
              <span style={{ fontWeight: 500 }}>Gruppo: {cfg.askPartySize ? `Sì (max ${cfg.partyMax})` : 'No'}</span>
              <span style={{ fontWeight: 500 }}>Ordine: {cfg.askOrder ? 'Sì' : 'No'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, color: 'var(--grigio-testo)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coda</span>
              <span style={{ fontWeight: 500 }}>Prefisso: {cfg.prefix || 'Nessuno'}</span>
              <span style={{ fontWeight: 500 }}>Casse/Postazioni: {cfg.counters}</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
