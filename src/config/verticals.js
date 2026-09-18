/**
 * "Versioni" dell'app.
 * Questi sono solo PRESET: alla creazione del locale vengono copiati dentro
 * venues/{id}.config, e da lì si modificano senza toccare il codice.
 */

export const DEFAULT_CONFIG = {
  // Cosa chiedere a chi scansiona il QR
  askName: true,
  nameRequired: true,
  rememberName: true,      // ripropone il nome usato l'ultima volta su quel telefono
  askPartySize: false,
  partyMin: 1,
  partyMax: 12,
  askOrder: false,
  menu: [],                // [{ id, name, price }]
  askNote: false,

  // Numerazione
  prefix: '',
  startAt: 1,
  resetDaily: true,

  // Lessico: cambia il tono dell'app senza cambiare il codice
  words: {
    unit: 'numero',
    join: 'Mettiti in coda',
    waiting: 'persone prima di te',
    counter: 'Cassa'
  },

  // Stima attesa
  avgServiceMinutes: 2,
  counters: 1,

  // Monitor in sala
  display: {
    adMode: 'box',         // 'box' | 'full' | 'off'
    adEverySeconds: 45,    // solo per 'full'
    adDurationSeconds: 12, // solo per 'full'
    recentCalls: 4,
    chime: true
  },
  ads: []                  // [{ kind:'text'|'image', title, body, src, seconds }]
};

export const VERTICALS = {
  panificio: {
    label: 'Panificio / Gastronomia',
    hint: 'Zero attriti: scansioni e hai il numero.',
    image: '/illustrations/panificio.jpg',
    config: {
      ...DEFAULT_CONFIG,
      askName: false,
      nameRequired: false,
      askPartySize: false,
      askOrder: false,
      prefix: '',
      avgServiceMinutes: 1.5,
      counters: 2,
      words: { unit: 'numero', join: 'Prendi il numero', waiting: 'persone prima di te', counter: 'Banco' },
      display: { ...DEFAULT_CONFIG.display, adMode: 'box', recentCalls: 3 },
      ads: [
        { kind: 'text', title: 'Focaccia appena sfornata', body: 'Dalle 11:00, finché dura.', seconds: 10 },
        { kind: 'text', title: 'Pane di grano duro', body: 'Lievito madre, 24 ore di lievitazione.', seconds: 10 }
      ]
    }
  },

  ristorante: {
    label: 'Ristorante / Pizzeria',
    hint: 'Nome e coperti: la lista d\'attesa dei tavoli.',
    image: '/illustrations/ristorante.jpg',
    config: {
      ...DEFAULT_CONFIG,
      askName: true,
      nameRequired: true,
      askPartySize: true,
      partyMax: 14,
      askNote: true,
      prefix: 'T',
      avgServiceMinutes: 9,
      counters: 1,
      words: { unit: 'tavolo', join: 'Mettiti in lista', waiting: 'gruppi prima di te', counter: 'Sala' },
      display: { ...DEFAULT_CONFIG.display, adMode: 'full', adEverySeconds: 40, adDurationSeconds: 14 },
      ads: [
        { kind: 'text', title: 'Carta dei vini', body: 'Oltre 60 etichette del territorio.', seconds: 12 }
      ]
    }
  },

  bar: {
    label: 'Bar / Take away',
    hint: 'Nome e ordine: prepari mentre sono ancora in coda.',
    image: '/illustrations/bar.jpg',
    config: {
      ...DEFAULT_CONFIG,
      askName: true,
      askPartySize: false,
      askOrder: true,
      menu: [
        { id: 'espresso', name: 'Espresso', price: 1.2 },
        { id: 'cappuccino', name: 'Cappuccino', price: 1.6 },
        { id: 'cornetto', name: 'Cornetto', price: 1.4 },
        { id: 'spremuta', name: 'Spremuta', price: 3.5 }
      ],
      prefix: 'B',
      avgServiceMinutes: 1,
      counters: 2,
      words: { unit: 'ordine', join: 'Ordina e mettiti in coda', waiting: 'ordini prima del tuo', counter: 'Bancone' },
      display: { ...DEFAULT_CONFIG.display, adMode: 'box' }
    }
  },

  ufficio: {
    label: 'Sportello / Studio',
    hint: 'Nome e motivo della visita.',
    image: '/illustrations/ufficio.jpg',
    config: {
      ...DEFAULT_CONFIG,
      askName: true,
      askPartySize: false,
      askNote: true,
      prefix: 'A',
      avgServiceMinutes: 12,
      words: { unit: 'numero', join: 'Prendi appuntamento', waiting: 'persone prima di te', counter: 'Sportello' },
      display: { ...DEFAULT_CONFIG.display, adMode: 'off' }
    }
  }
};

/** Unisce preset e configurazione salvata: i campi nuovi non rompono i locali già creati. */
export function resolveConfig(venue) {
  const base = VERTICALS[venue?.vertical]?.config ?? DEFAULT_CONFIG;
  return {
    ...base,
    ...(venue?.config ?? {}),
    words: { ...base.words, ...(venue?.config?.words ?? {}) },
    display: { ...base.display, ...(venue?.config?.display ?? {}) }
  };
}
