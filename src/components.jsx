export function Loader({ scuro }) {
  return (
    <div className={`caricamento ${scuro ? 'caricamento--scuro' : ''}`} role="status">
      <span className="caricamento__barra" />
      <span className="caricamento__testo">Un istante…</span>
    </div>
  );
}

export function NotFound({ slug, messaggio }) {
  return (
    <main className="schermo schermo--cliente">
      <h1 className="insegna__titolo">Coda non trovata</h1>
      <p className="promemoria">
        {messaggio ?? `Nessun locale risponde a "${slug}". Controlla di aver scansionato il QR giusto.`}
      </p>
    </main>
  );
}
