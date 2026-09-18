import { useOwnerAuth, useOwnerVenues } from '../lib/hooks.js';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from '../firebase.js';
import { deleteVenue } from '../lib/queue.js';
import { Loader } from '../components.jsx';

export default function Dashboard() {
  const { owner, loading: ownerLoading } = useOwnerAuth();
  const { venues, loading: venuesLoading, error: venuesError } = useOwnerVenues(owner?.uid);
  const navigate = useNavigate();

  const [venueToDelete, setVenueToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (venuesError) console.error("Error fetching venues:", venuesError);
  }, [venuesError]);

  if (ownerLoading || venuesLoading) return <Loader scuro />;

  const handleDelete = async () => {
    if (!venueToDelete) return;
    setIsDeleting(true);
    try {
      await deleteVenue(venueToDelete.id);
    } catch (e) {
      console.error("Errore durante l'eliminazione:", e);
      alert("Si è verificato un errore durante l'eliminazione.");
    } finally {
      setIsDeleting(false);
      setVenueToDelete(null);
    }
  };

  return (
    <div className="schermo">
      <header className="insegna" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="insegna__titolo" style={{ margin: 0 }}>Dashboard</h1>
        <button className="btn btn--secondary" onClick={() => auth.signOut()}>Esci</button>
      </header>

      <div className="avviso" style={{ marginBottom: 24 }}>
        Accesso effettuato come: {owner?.email}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {venues.map(v => (
          <div key={v.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>{v.name}</h2>
                <p style={{ margin: 0, color: 'var(--grigio-testo)', fontSize: 14 }}>
                  {v.vertical} • /{v.slug}
                </p>
              </div>
              <button 
                onClick={() => setVenueToDelete(v)}
                className="btn btn--ghost" 
                style={{ color: 'var(--terracotta)', padding: '4px 8px', fontSize: 14 }}
                title="Elimina locale"
              >
                Elimina
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link to={`/v/${v.slug}/display`} className="btn btn--ghost" style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Monitor</Link>
              <Link to={`/v/${v.slug}/staff`} className="btn btn--ghost" style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cassa</Link>
              <Link to={`/v/${v.slug}/admin`} className="btn btn--ghost" style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Admin</Link>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="btn btn--primary" style={{ width: '100%' }} onClick={() => navigate('/new-venue')}>
          + Aggiungi locale
        </button>
      </div>

      {venueToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, gap: 24 }}>
            <h3 style={{ margin: 0, fontSize: 20 }}>Conferma eliminazione</h3>
            <p style={{ margin: 0, color: 'var(--grigio-testo)', lineHeight: 1.4 }}>
              Sei sicuro di voler eliminare definitivamente <strong>{venueToDelete.name}</strong>? Questa azione non può essere annullata.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn--secondary" style={{ flex: 1 }} onClick={() => setVenueToDelete(null)} disabled={isDeleting}>Annulla</button>
              <button className="btn btn--primary" style={{ flex: 1, backgroundColor: 'var(--terracotta)' }} onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Attendi...' : 'Sì, elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
