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

  async function aggiornaCasse(delta) {
    const newVal = Math.max(1, Math.min(10, cfg.counters + delta));
    await updateDoc(venueRef(venue.id), { 'config.counters': newVal });
  }

  const handleDownloadQR = () => {
    if (!canvas.current) return;
    const link = document.createElement('a');
    link.download = `qrcode-${slug}.png`;
    link.href = canvas.current.toDataURL('image/png');
    link.click();
  };

  const [newAd, setNewAd] = useState({ title: '', body: '', seconds: 10 });

  async function rimuoviAnnuncio(index) {
    const newAds = [...(cfg.ads || [])];
    newAds.splice(index, 1);
    await updateDoc(venueRef(venue.id), { 'config.ads': newAds });
  }

  async function aggiungiAnnuncio(e) {
    e.preventDefault();
    if (!newAd.title) return;
    const newAds = [...(cfg.ads || []), { kind: 'text', title: newAd.title, body: newAd.body, seconds: Number(newAd.seconds) }];
    await updateDoc(venueRef(venue.id), { 'config.ads': newAds });
    setNewAd({ title: '', body: '', seconds: 10 });
  }

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
              <span style={{ fontWeight: 500, marginTop: 4 }}>Nome: {cfg.askName ? 'Sì' : 'No'}</span>
              <span style={{ fontWeight: 500, marginTop: 4 }}>Gruppo: {cfg.askPartySize ? `Sì (max ${cfg.partyMax})` : 'No'}</span>
              <span style={{ fontWeight: 500, marginTop: 4 }}>Ordine: {cfg.askOrder ? 'Sì' : 'No'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, color: 'var(--grigio-testo)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coda</span>
              <span style={{ fontWeight: 500, marginTop: 4 }}>Prefisso: {cfg.prefix || 'Nessuno'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontWeight: 500 }}>Casse: {cfg.counters}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button 
                    onClick={() => aggiornaCasse(-1)} 
                    disabled={cfg.counters <= 1} 
                    style={{ padding: '0 8px', borderRadius: 4, border: '1px solid #ccc', background: 'transparent', cursor: cfg.counters <= 1 ? 'not-allowed' : 'pointer', fontSize: 16 }}
                  >-</button>
                  <button 
                    onClick={() => aggiornaCasse(1)} 
                    disabled={cfg.counters >= 10} 
                    style={{ padding: '0 8px', borderRadius: 4, border: '1px solid #ccc', background: 'transparent', cursor: cfg.counters >= 10 ? 'not-allowed' : 'pointer', fontSize: 16 }}
                  >+</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ANNUNCI / PUBBLICITÀ */}
        <section className="card">
          <h2 style={{ margin: 0, fontSize: 18 }}>Annunci sul Monitor</h2>
          <p style={{ margin: 0, color: 'var(--grigio-testo)', fontSize: 14 }}>
            Questi messaggi compaiono a rotazione sul monitor in sala. Utili per promozioni, avvisi o comunicazioni di servizio.
          </p>

          {cfg.display?.adMode === 'off' && (
            <div style={{ padding: 12, backgroundColor: 'var(--crema)', borderRadius: 'var(--r-sm)', color: 'var(--grigio-testo)', fontSize: 14, marginTop: 8 }}>
              Nota: il tipo di locale "{VERTICALS[venue.vertical]?.label}" al momento non prevede la visualizzazione di annunci sul monitor.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {(!cfg.ads || cfg.ads.length === 0) ? (
              <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--grigio-testo)' }}>Nessun annuncio presente.</p>
            ) : (
              cfg.ads.map((ad, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid var(--crema)', borderRadius: 'var(--r-sm)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 16, color: 'var(--cacao)' }}>{ad.title}</h3>
                    {ad.body && <p style={{ margin: 0, fontSize: 14, color: 'var(--grigio-testo)' }}>{ad.body}</p>}
                    <span style={{ fontSize: 12, color: 'var(--terracotta)', display: 'block', marginTop: 4 }}>Durata: {ad.seconds}s</span>
                  </div>
                  <button 
                    onClick={() => rimuoviAnnuncio(idx)}
                    className="btn btn--ghost" 
                    style={{ color: 'var(--terracotta)', padding: '4px 8px', fontSize: 14 }}
                  >
                    Rimuovi
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={aggiungiAnnuncio} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24, padding: 16, backgroundColor: 'var(--crema-card)', borderRadius: 'var(--r-md)' }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Aggiungi nuovo annuncio</h3>
            <input 
              type="text" 
              placeholder="Titolo (es. Offerta del giorno)" 
              value={newAd.title} 
              onChange={e => setNewAd({ ...newAd, title: e.target.value })}
              style={{ padding: '10px 12px', borderRadius: 'var(--r-sm)', border: '1px solid #ccc', fontSize: 15 }}
              required
            />
            <input 
              type="text" 
              placeholder="Sottotitolo / Descrizione (opzionale)" 
              value={newAd.body} 
              onChange={e => setNewAd({ ...newAd, body: e.target.value })}
              style={{ padding: '10px 12px', borderRadius: 'var(--r-sm)', border: '1px solid #ccc', fontSize: 15 }}
            />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ fontSize: 14, color: 'var(--grigio-testo)' }}>Durata (secondi):</label>
              <input 
                type="number" 
                min="3" max="60" 
                value={newAd.seconds} 
                onChange={e => setNewAd({ ...newAd, seconds: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 'var(--r-sm)', border: '1px solid #ccc', width: 80, fontSize: 15 }}
              />
              <button type="submit" className="btn btn--primary" style={{ marginLeft: 'auto', padding: '8px 16px' }} disabled={!newAd.title}>
                Aggiungi
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
}
