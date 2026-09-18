import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVenue, useQueue, useLocal } from '../lib/hooks.js';
import { joinQueue, waitMinutes, humanWait } from '../lib/queue.js';
import { Loader, NotFound } from '../components.jsx';

export default function Join({ slug }) {
  const { loading, venue, cfg, error } = useVenue(slug);
  const queue = useQueue(venue?.id);
  const nav = useNavigate();

  const [remembered, setRemembered] = useLocal('ticketz:nome', '');
  const [name, setName] = useState(null);           // null = non ancora toccato dall'utente
  const [party, setParty] = useState(2);
  const [items, setItems] = useState({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const value = name ?? (cfg?.rememberName ? remembered : '') ?? '';
  const waiting = useMemo(() => queue.filter((t) => t.status === 'waiting').length, [queue]);

  if (loading) return <Loader />;
  if (error || !venue) return <NotFound slug={slug} />;

  const chiuso = venue.open === false;
  const nomeMancante = cfg.askName && cfg.nameRequired && !value.trim();

  async function submit() {
    if (nomeMancante || busy) return;
    setBusy(true); setErr(null);
    try {
      const scelti = Object.entries(items)
        .filter(([, q]) => q > 0)
        .map(([id, q]) => ({ id, qty: q, name: cfg.menu.find((m) => m.id === id)?.name ?? id }));

      const { id } = await joinQueue(venue.id, cfg, {
        name: cfg.askName ? value : null,
        partySize: cfg.askPartySize ? party : 1,
        items: scelti,
        note
      });
      if (cfg.askName && cfg.rememberName) setRemembered(value.trim());
      nav(`/v/${slug}/t/${id}`);
    } catch (e) {
      setErr("Non è stato possibile prendere il numero. Riprova.");
      console.error(e);
      setBusy(false);
    }
  }

  return (
    <main className="schermo schermo--cliente">
      <header className="insegna">
        <p className="insegna__occhiello">{venue.name}</p>
        <h1 className="insegna__titolo">{cfg.words.join}</h1>
      </header>

      <p className="stato-coda">
        {waiting === 0
          ? 'Nessuno in attesa in questo momento.'
          : `${waiting} ${cfg.words.waiting} · attesa stimata ${humanWait(waitMinutes(cfg, waiting))}`}
      </p>

      {chiuso ? (
        <div className="avviso">Il servizio è chiuso. Riprova quando il locale riapre.</div>
      ) : (
        <div className="modulo">
          {cfg.askName && (
            <label className="campo">
              <span className="campo__etichetta">Nome</span>
              <input
                className="campo__input"
                value={value}
                onChange={(e) => setName(e.target.value)}
                placeholder="Come ti chiamiamo"
                autoComplete="given-name"
                maxLength={40}
                enterKeyHint="done"
              />
              {cfg.rememberName && remembered && name === null && (
                <span className="campo__aiuto">Nome dell'ultima volta. Cambialo se serve.</span>
              )}
            </label>
          )}

          {cfg.askPartySize && (
            <div className="campo">
              <span className="campo__etichetta">Quante persone</span>
              <div className="contatore">
                <button className="contatore__btn" onClick={() => setParty((p) => Math.max(cfg.partyMin, p - 1))} aria-label="Una persona in meno">−</button>
                <output className="contatore__valore">{party}</output>
                <button className="contatore__btn" onClick={() => setParty((p) => Math.min(cfg.partyMax, p + 1))} aria-label="Una persona in più">+</button>
              </div>
            </div>
          )}

          {cfg.askOrder && cfg.menu.length > 0 && (
            <div className="campo">
              <span className="campo__etichetta">Ordine</span>
              <ul className="menu">
                {cfg.menu.map((m) => (
                  <li key={m.id} className="menu__riga">
                    <span className="menu__nome">{m.name}</span>
                    <span className="menu__prezzo">{m.price.toFixed(2).replace('.', ',')} €</span>
                    <div className="contatore contatore--piccolo">
                      <button className="contatore__btn" onClick={() => setItems((s) => ({ ...s, [m.id]: Math.max(0, (s[m.id] ?? 0) - 1) }))} aria-label={`Togli ${m.name}`}>−</button>
                      <output className="contatore__valore">{items[m.id] ?? 0}</output>
                      <button className="contatore__btn" onClick={() => setItems((s) => ({ ...s, [m.id]: (s[m.id] ?? 0) + 1 }))} aria-label={`Aggiungi ${m.name}`}>+</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {cfg.askNote && (
            <label className="campo">
              <span className="campo__etichetta">Note</span>
              <input className="campo__input" value={note} maxLength={200}
                onChange={(e) => setNote(e.target.value)} placeholder="Allergie, seggiolone, altro" />
            </label>
          )}

          {err && <p className="errore">{err}</p>}

          <button className="azione azione--principale" onClick={submit} disabled={busy || nomeMancante}>
            {busy ? 'Un attimo…' : cfg.words.join}
          </button>
          {nomeMancante && <p className="campo__aiuto">Scrivi il nome per continuare.</p>}
        </div>
      )}
    </main>
  );
}
