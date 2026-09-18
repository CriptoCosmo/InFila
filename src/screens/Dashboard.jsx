import { useOwnerAuth, useOwnerVenues } from '../lib/hooks.js';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { auth } from '../firebase.js';
import { Loader } from '../components.jsx';

export default function Dashboard() {
  const { owner, loading: ownerLoading } = useOwnerAuth();
  const { venues, loading: venuesLoading } = useOwnerVenues(owner?.uid);
  const navigate = useNavigate();

  useEffect(() => {
    if (!ownerLoading && !venuesLoading) {
      if (venues.length === 0) {
        navigate('/new-venue', { replace: true });
      }
    }
  }, [ownerLoading, venuesLoading, venues.length, navigate]);

  if (ownerLoading || venuesLoading) return <Loader scuro />;

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
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>{v.name}</h2>
              <p style={{ margin: 0, color: 'var(--grigio-testo)', fontSize: 14 }}>
                {v.vertical} • /{v.slug}
              </p>
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
    </div>
  );
}
