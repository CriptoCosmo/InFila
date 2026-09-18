import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOwnerAuth } from '../lib/hooks.js';
import { generateSlug, checkSlugAvailable, suggestSlug } from '../lib/slug.js';
import { createVenue } from '../lib/queue.js';
import { VERTICALS } from '../config/verticals.js';
import { Loader } from '../components.jsx';

export default function NewVenue() {
  const { owner, loading } = useOwnerAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [vertical, setVertical] = useState('');
  
  const [slugStatus, setSlugStatus] = useState('idle'); // idle, checking, available, taken
  const [suggestion, setSuggestion] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  // Pre-fill slug on name change (if user hasn't heavily customized it or if it matches previous auto-generation)
  // Actually, standard is to pre-fill while typing until user touches slug
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (!slugEdited) {
      setSlug(generateSlug(name));
    }
  }, [name, slugEdited]);

  // Debounced check
  useEffect(() => {
    const currentSlug = slug;
    if (!currentSlug) {
      setSlugStatus('idle');
      return;
    }
    
    setSlugStatus('checking');
    const timer = setTimeout(async () => {
      // inline validation: only a-z, 0-9, -
      if (!/^[a-z0-9-]+$/.test(currentSlug)) {
        setSlugStatus('invalid');
        return;
      }
      
      const available = await checkSlugAvailable(currentSlug);
      if (available) {
        setSlugStatus('available');
        setSuggestion('');
      } else {
        setSlugStatus('taken');
        setSuggestion(suggestSlug(currentSlug));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug]);

  const handleSlugChange = (e) => {
    setSlugEdited(true);
    // restrict characters inline
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(val);
  };

  const handleUseSuggestion = (e) => {
    e.preventDefault();
    setSlug(suggestion);
    setSuggestion('');
    setSlugEdited(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!owner || slugStatus !== 'available' || !name || !vertical) return;
    
    setIsCreating(true);
    setError(null);
    try {
      await createVenue(owner, { name, slug, vertical });
      navigate('/dashboard');
    } catch (err) {
      setIsCreating(false);
      if (err.message.startsWith('slug-occupato')) {
        setSlugStatus('taken');
        const [, sug] = err.message.split(':');
        if (sug) setSuggestion(sug);
        setError('Lo slug è appena stato preso da un altro utente. Scegline un altro.');
      } else {
        setError(err.message);
      }
    }
  };

  if (loading) return <Loader scuro />;
  if (!owner) return <div className="schermo">Accesso negato</div>;

  const formValid = name && vertical && slugStatus === 'available' && slug.length > 0;

  return (
    <div className="schermo">
      <header className="insegna">
        <h1 className="insegna__titolo">Nuovo locale</h1>
      </header>

      <form className="modulo" onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        {error && <div className="avviso" style={{ color: 'var(--terracotta)' }}>{error}</div>}
        
        <div className="campo">
          <label className="campo__etichetta">Nome del locale</label>
          <input 
            className="campo__input" 
            placeholder="es. Panificio Rossi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="campo">
          <label className="campo__etichetta">Slug (indirizzo)</label>
          <input 
            className="campo__input" 
            placeholder="es. panificio-rossi"
            value={slug}
            onChange={handleSlugChange}
            required
          />
          <div className="campo__aiuto" style={{ minHeight: '1.5rem' }}>
            {slugStatus === 'checking' && 'Verifica in corso...'}
            {slugStatus === 'available' && <span style={{ color: 'var(--salvia)' }}>✓ Disponibile</span>}
            {slugStatus === 'invalid' && <span style={{ color: 'var(--terracotta)' }}>Usa solo lettere minuscole, numeri e trattini.</span>}
            {slugStatus === 'taken' && (
              <span style={{ color: 'var(--terracotta)' }}>
                Non disponibile.{' '}
                {suggestion && (
                  <>Prova con: <button type="button" onClick={handleUseSuggestion} style={{ background:'none', border:'none', color:'var(--terracotta)', textDecoration:'underline', cursor:'pointer', padding:0 }}>{suggestion}</button></>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="campo">
          <label className="campo__etichetta">Tipo di locale</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {Object.entries(VERTICALS).map(([key, v]) => (
              <label key={key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', background: 'var(--crema-card)', padding: 16, borderRadius: 'var(--r-md)', border: vertical === key ? '2px solid var(--terracotta)' : '2px solid transparent' }}>
                <input 
                  type="radio" 
                  name="vertical" 
                  value={key}
                  checked={vertical === key}
                  onChange={() => setVertical(key)}
                  style={{ marginTop: 4 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, color: 'var(--cacao)', fontSize: 16 }}>{v.label}</span>
                  <span style={{ fontSize: 14, color: 'var(--grigio-testo)' }}>{v.hint}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          className="azione" 
          disabled={!formValid || isCreating}
          style={{ marginTop: 16 }}
        >
          {isCreating ? 'Creazione in corso...' : 'Crea locale'}
        </button>
      </form>
    </div>
  );
}
