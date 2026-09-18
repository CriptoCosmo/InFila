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
      
      try {
        const available = await checkSlugAvailable(currentSlug);
        if (available) {
          setSlugStatus('available');
          setSuggestion('');
        } else {
          setSlugStatus('taken');
          setSuggestion(suggestSlug(currentSlug));
        }
      } catch (err) {
        console.error("Slug check failed:", err);
        setSlugStatus('invalid'); // fallback so they can't proceed with a broken state
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
      console.error("Errore durante la creazione del locale:", err);
      if (err.message.startsWith('slug-occupato')) {
        setSlugStatus('taken');
        const [, alternativeSlug] = err.message.split(':');
        if (sug) setSuggestion(alternativeSlug);
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

      <form className="modulo dashboard-mt" onSubmit={handleSubmit}>
        {error && <div className="avviso text-terracotta">{error}</div>}
        
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
          <div className="campo__aiuto nv-status-wrap">
            {slugStatus === 'checking' && 'Verifica in corso...'}
            {slugStatus === 'available' && <span className="text-salvia">✓ Disponibile</span>}
            {slugStatus === 'invalid' && <span className="text-terracotta">Usa solo lettere minuscole, numeri e trattini.</span>}
            {slugStatus === 'taken' && (
              <span className="text-terracotta">
                Non disponibile.{' '}
                {suggestion && (
                  <>Prova con: <button type="button" onClick={handleUseSuggestion} className="btn-link">{suggestion}</button></>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="campo">
          <label className="campo__etichetta">Tipo di locale</label>
          <div className="nv-vertical-grid">
            {Object.entries(VERTICALS).map(([key, v]) => (
              <label key={key} className={`nv-vertical-option ${vertical === key ? 'nv-vertical-option--active' : ''}`}>
                {v.image && (
                  <div className="nv-vertical-image-wrap">
                    <img src={v.image} alt={v.label} className="nv-vertical-image" />
                  </div>
                )}
                <div className="nv-vertical-content">
                  <input 
                    type="radio" 
                    name="vertical" 
                    value={key}
                    checked={vertical === key}
                    onChange={() => setVertical(key)}
                    className="nv-vertical-radio"
                  />
                  <div className="rules-col">
                    <span className="nv-vertical-title">{v.label}</span>
                    <span className="form-label">{v.hint}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          className="azione mt-16" 
          disabled={!formValid || isCreating}
        >
          {isCreating ? 'Creazione in corso...' : 'Crea locale'}
        </button>
      </form>
    </div>
  );
}
