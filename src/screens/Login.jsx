import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase.js';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useOwnerAuth } from '../lib/hooks.js';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();
  const { owner, loading } = useOwnerAuth();

  useEffect(() => {
    if (!loading && owner) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, owner, navigate]);

  if (loading || owner) return null;

  const handleError = (e) => {
    let msg = 'Errore imprevisto. Riprova.';
    if (e.code === 'auth/email-already-in-use') msg = 'Email già in uso.';
    else if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = 'Password o email errata.';
    else if (e.code === 'auth/user-not-found') msg = 'Email non trovata.';
    setError(msg);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      handleError(e);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      handleError(e);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError('Inserisci la tua email per resettare la password.');
      return;
    }
    setError(null);
    setMsg(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setMsg('Email di ripristino inviata. Controlla la tua posta.');
    } catch (e) {
      handleError(e);
    }
  };

  return (
    <div className="schermo">
      <header className="insegna">
        <p className="insegna__occhiello">InFila Bottega</p>
        <h1 className="insegna__titolo">Area Esercenti</h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
        <button type="button" className="azione" onClick={handleGoogle}>
          Accedi con Google
        </button>

        <div style={{ textAlign: 'center', color: 'var(--grigio-testo)', fontWeight: 600 }}>oppure</div>

        <form className="modulo" onSubmit={handleEmailSubmit}>
          <div className="campo">
            <label className="campo__etichetta">Email</label>
            <input 
              type="email" 
              className="campo__input" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="campo">
            <label className="campo__etichetta">Password</label>
            <input 
              type="password" 
              className="campo__input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>

          {error && <p className="errore">{error}</p>}
          {msg && <p className="avviso">{msg}</p>}

          <button type="submit" className="azione azione--principale">
            {isLogin ? 'Accedi' : 'Registrati'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
          <button 
            type="button" 
            className="azione azione--discreta" 
            onClick={() => setIsLogin(!isLogin)}
            style={{ border: 'none', background: 'transparent', textDecoration: 'underline' }}
          >
            {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
          </button>
          
          {isLogin && (
            <button 
              type="button" 
              className="azione azione--discreta" 
              onClick={handleReset}
              style={{ border: 'none', background: 'transparent', textDecoration: 'underline' }}
            >
              Hai dimenticato la password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
