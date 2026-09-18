import { useEffect, useState } from 'react';
import { useVenue, useQueue, useCallSignal } from '../lib/hooks.js';
import { watchTicket, positionOf, waitMinutes, humanWait, formatNumber, cancelOwnTicket } from '../lib/queue.js';
import { Loader, NotFound } from '../components.jsx';

export default function Ticket({ slug, ticketId }) {
  const { loading, venue, cfg, error } = useVenue(slug);
  const queue = useQueue(venue?.id);
  const [ticket, setTicket] = useState(undefined);
  useCallSignal(venue, { sound: false, vibrate: true });

  useEffect(() => (venue?.id ? watchTicket(venue.id, ticketId, setTicket) : undefined), [venue?.id, ticketId]);

  if (loading || ticket === undefined) return <Loader />;
  if (error || !venue) return <NotFound slug={slug} />;
  if (!ticket) return <NotFound slug={slug} messaggio="Questo biglietto non esiste più." />;

  const pos = positionOf(queue, ticket);
  const min = waitMinutes(cfg, pos);
  const tocca = ticket.status === 'called';
  const chiuso = ['served', 'cancelled', 'noshow'].includes(ticket.status);

  return (
    <main className={`schermo schermo--cliente ${tocca ? 'schermo--tocca' : ''}`}>
      <header className="insegna">
        <p className="insegna__occhiello">{venue.name}</p>
        <h1 className="insegna__titolo">
          {tocca ? `Tocca a te — ${cfg.words.counter} ${ticket.counter ?? 1}` : `Il tuo ${cfg.words.unit}`}
        </h1>
      </header>

      <section className="biglietto" aria-live="polite">
        <div className="riquadro-numero">
          <p className="riquadro-numero__etichetta">Il tuo {cfg.words.unit}</p>
          <p className="riquadro-numero__numero">{formatNumber(cfg, ticket.number)}</p>
          {!chiuso && !tocca && (
            <div className="pallini" aria-label={`${pos} ${cfg.words.waiting}`}>
              {Array.from({ length: Math.min(pos, 8) }, (_, i) => (
                <span key={i} className="pallino pallino--attesa" />
              ))}
              {pos > 8 && <span className="biglietto__riga--tenue" style={{ fontSize: 13 }}>+{pos - 8}</span>}
              <span className="pallino pallino--io" />
            </div>
          )}
        </div>
        {ticket.name && <p className="biglietto__nome">{ticket.name}{ticket.partySize > 1 ? ` · ${ticket.partySize} persone` : ''}</p>}
        {ticket.items?.length > 0 && (
          <p className="biglietto__ordine">{ticket.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</p>
        )}

        <div className="biglietto__stato">
          {chiuso && <p className="biglietto__riga">{ticket.status === 'cancelled' ? 'Biglietto annullato.' : 'Servito. Grazie!'}</p>}
          {!chiuso && tocca && <p className="biglietto__riga biglietto__riga--forte">Vai al {cfg.words.counter.toLowerCase()} {ticket.counter ?? 1}</p>}
          {!chiuso && !tocca && (
            <>
              <p className="biglietto__riga">{pos === 0 ? 'Sei il prossimo' : `${pos} ${cfg.words.waiting}`}</p>
              <p className="biglietto__riga biglietto__riga--tenue">{humanWait(min)}</p>
            </>
          )}
        </div>
      </section>

      <p className="promemoria">
        {chiuso ? 'Puoi chiudere questa pagina.' : 'Tieni aperta questa pagina: si aggiorna da sola quando tocca a te.'}
      </p>

      {!chiuso && (
        <button className="azione azione--discreta" onClick={() => cancelOwnTicket(venue.id, ticket.id)}>
          Annulla il biglietto
        </button>
      )}

      {venue.nowServing != null && !chiuso && (
        <p className="ora-serviamo">In corso: <strong>{formatNumber(cfg, venue.nowServing)}</strong></p>
      )}
    </main>
  );
}
