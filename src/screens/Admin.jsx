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
  const [newAd, setNewAd] = useState({ title: '', body: '', seconds: 10 });

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
    <div className="schermo pb-64">
      <header className="insegna admin-header">
        <Link to="/dashboard" className="admin-header__link">
          ← Torna alla Dashboard
        </Link>
        <div>
          <h1 className="insegna__titolo m-0">{venue.name}</h1>
          <p className="insegna__occhiello m-0 admin-occhiello">Gestione locale</p>
        </div>
      </header>

      <div className="admin-form-group">
        
        {/* QR CODE CARD */}
        <section className="card admin-card--center">
          <h2 className="admin-card__title">QR Code del locale</h2>
          <p className="admin-card__desc">
            Stampa questo codice e mettilo all'ingresso. I clienti lo scansioneranno per mettersi in coda.
          </p>
          <div className="qr-container">
            <canvas ref={canvas} className="qr-canvas" />
          </div>
          <button className="btn btn--secondary" onClick={handleDownloadQR}>
            Scarica Immagine
          </button>
          <a href={url} target="_blank" rel="noreferrer" className="qr-link">
            Oppure visita il link diretto ↗
          </a>
        </section>

        {/* TIPO DI LOCALE */}
        <section className="card">
          <h2 className="admin-card__title">Tipo di locale</h2>
          <p className="admin-card__desc">
            Cambia il modello del tuo locale. I clienti attualmente in coda non subiranno interruzioni.
          </p>
          <div className="vertical-grid">
            {Object.entries(VERTICALS).map(([key, v]) => {
              const isActive = venue.vertical === key;
              return (
                <div 
                  key={key} 
                  onClick={() => applica(key)}
                  className={`vertical-card ${isActive ? 'vertical-card--active' : ''}`}
                >
                  <span className="vertical-card__title">{v.label}</span>
                  <span className="vertical-card__hint">{v.hint}</span>
                </div>
              );
            })}
          </div>
          {salvato && <div className="avviso avviso--success">Modello aggiornato con successo!</div>}
        </section>

        {/* CONFIGURAZIONE TECNICA */}
        <section className="card">
          <h2 className="admin-card__title">Regole attive</h2>
          <div className="rules-grid">
            <div className="rules-col">
              <span className="rules-section-title">Dati richiesti</span>
              <span className="rules-item">Nome: {cfg.askName ? 'Sì' : 'No'}</span>
              <span className="rules-item">Gruppo: {cfg.askPartySize ? `Sì (max ${cfg.partyMax})` : 'No'}</span>
              <span className="rules-item">Ordine: {cfg.askOrder ? 'Sì' : 'No'}</span>
            </div>
            <div className="rules-col">
              <span className="rules-section-title">Coda</span>
              <span className="rules-item">Prefisso: {cfg.prefix || 'Nessuno'}</span>
              <div className="rules-counters">
                <span className="rules-item">Casse: {cfg.counters}</span>
                <div className="counter-actions">
                  <button 
                    onClick={() => aggiornaCasse(-1)} 
                    disabled={cfg.counters <= 1} 
                    className="counter-btn"
                  >-</button>
                  <button 
                    onClick={() => aggiornaCasse(1)} 
                    disabled={cfg.counters >= 10} 
                    className="counter-btn"
                  >+</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ANNUNCI / PUBBLICITÀ */}
        <section className="card">
          <h2 className="admin-card__title">Annunci sul Monitor</h2>
          <p className="admin-card__desc">
            Questi messaggi compaiono a rotazione sul monitor in sala. Utili per promozioni, avvisi o comunicazioni di servizio.
          </p>

          {cfg.display?.adMode === 'off' && (
            <div className="ad-notice">
              Nota: il tipo di locale "{VERTICALS[venue.vertical]?.label}" al momento non prevede la visualizzazione di annunci sul monitor.
            </div>
          )}

          <div className="ad-list">
            {(!cfg.ads || cfg.ads.length === 0) ? (
              <p className="ad-empty">Nessun annuncio presente.</p>
            ) : (
              cfg.ads.map((ad, idx) => (
                <div key={idx} className="ad-item">
                  <div>
                    <h3 className="ad-item__title">{ad.title}</h3>
                    {ad.body && <p className="ad-item__desc">{ad.body}</p>}
                    <span className="ad-item__duration">Durata: {ad.seconds}s</span>
                  </div>
                  <button 
                    onClick={() => rimuoviAnnuncio(idx)}
                    className="btn btn--ghost ad-btn"
                  >
                    Rimuovi
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={aggiungiAnnuncio} className="ad-form">
            <h3 className="ad-form__title">Aggiungi nuovo annuncio</h3>
            <input 
              type="text" 
              placeholder="Titolo (es. Offerta del giorno)" 
              value={newAd.title} 
              onChange={e => setNewAd({ ...newAd, title: e.target.value })}
              className="form-input"
              required
            />
            <input 
              type="text" 
              placeholder="Sottotitolo / Descrizione (opzionale)" 
              value={newAd.body} 
              onChange={e => setNewAd({ ...newAd, body: e.target.value })}
              className="form-input"
            />
            <div className="form-row">
              <label className="form-label">Durata (secondi):</label>
              <input 
                type="number" 
                min="3" max="60" 
                value={newAd.seconds} 
                onChange={e => setNewAd({ ...newAd, seconds: e.target.value })}
                className="form-input-number"
              />
              <button type="submit" className="btn btn--primary form-submit" disabled={!newAd.title}>
                Aggiungi
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
}
