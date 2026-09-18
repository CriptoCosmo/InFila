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
      <header className="insegna dashboard-header">
        <h1 className="insegna__titolo m-0">Dashboard</h1>
        <button className="btn btn--secondary" onClick={() => auth.signOut()}>Esci</button>
      </header>

      <div className="avviso mb-24">
        Accesso effettuato come: {owner?.email}
      </div>

      <div className="venue-list-cards">
        {venues.map(v => (
          <div key={v.id} className="card">
            <div className="venue-card__header">
              <div>
                <h2 className="venue-card__title">{v.name}</h2>
                <p className="admin-card__desc">
                  {v.vertical} • /{v.slug}
                </p>
              </div>
              <button 
                onClick={() => setVenueToDelete(v)}
                className="btn btn--ghost ad-btn"
                title="Elimina locale"
              >
                Elimina
              </button>
            </div>
            <div className="venue-card__actions">
              <Link to={`/v/${v.slug}/display`} className="btn btn--ghost venue-card__btn">Monitor</Link>
              <Link to={`/v/${v.slug}/staff`} className="btn btn--ghost venue-card__btn">Cassa</Link>
              <Link to={`/v/${v.slug}/admin`} className="btn btn--ghost venue-card__btn">Admin</Link>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-mt">
        <button className="btn btn--primary w-100" onClick={() => navigate('/new-venue')}>
          + Aggiungi locale
        </button>
      </div>

      {venueToDelete && (
        <div className="modal-overlay">
          <div className="card modal-content">
            <h3 className="modal-title">Conferma eliminazione</h3>
            <p className="modal-desc">
              Sei sicuro di voler eliminare definitivamente <strong>{venueToDelete.name}</strong>? Questa azione non può essere annullata.
            </p>
            <div className="modal-actions">
              <button className="btn btn--secondary modal-btn" onClick={() => setVenueToDelete(null)} disabled={isDeleting}>Annulla</button>
              <button className="btn btn--primary modal-btn modal-btn--danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Attendi...' : 'Sì, elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
