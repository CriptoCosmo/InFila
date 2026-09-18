# Ticketz — elimina code su Firebase

Una sola app, più "versioni". Panificio, ristorante, bar e sportello sono lo
stesso deploy: cambia solo il documento di configurazione del locale.

## Come funziona

Il cliente inquadra il QR all'ingresso → si apre `/v/{slug}` → prende il numero.
La cassa apre `/v/{slug}/staff` e scoda. Il monitor in sala apre `/v/{slug}/display`
e mostra il numero in corso con la pubblicità che ruota.

| Schermata | Percorso | Dove gira |
|---|---|---|
| Ingresso in coda (QR) | `/v/:slug` | telefono del cliente |
| Biglietto in tempo reale | `/v/:slug/t/:ticketId` | telefono del cliente |
| Pannello operatore | `/v/:slug/staff` | tablet alla cassa |
| Monitor in sala | `/v/:slug/display` | TV / monitor |
| Impostazioni e QR | `/v/:slug/admin` | titolare |

## Dati su Firestore

```
venues/{venueId}
  slug, name, vertical, open
  config: { askName, askPartySize, askOrder, menu[], prefix, counters,
            avgServiceMinutes, words{}, display{}, ads[] }
  lastNumber, counterDay          ← contatore, azzerato il giorno dopo
  nowServing, nowServingName, nowServingCounter, callSeq

venues/{venueId}/tickets/{ticketId}
  uid, day, number, name, partySize, items[], note
  status: waiting | called | served | noshow | cancelled
  counter, createdAt, calledAt, closedAt

venues/{venueId}/staff/{uid}      ← chi può scodare
```

Due dettagli che evitano guai:

- **Il numero è assegnato in transazione** sul documento del locale, non con un
  `count()` dei ticket: due persone che scansionano insieme non prendono mai lo
  stesso numero.
- **Il reset giornaliero non ha bisogno di un cron**: il campo `counterDay` viene
  confrontato con la data dentro la stessa transazione del primo cliente del giorno.

## Le versioni

I preset stanno in `src/config/verticals.js` e vengono **copiati** dentro
`venues/{id}.config` alla creazione. Da lì si modificano da `/admin` o dalla
console Firebase, senza ripubblicare l'app.

| | panificio | ristorante | bar | sportello |
|---|---|---|---|---|
| nome | no | sì | sì | sì |
| persone | no | sì (max 14) | no | no |
| ordine | no | no | sì | no |
| prefisso | — | `T` | `B` | `A` |
| pubblicità | riquadro | schermo pieno | riquadro | spenta |

Il nome, quando serve, viene riproposto dal `localStorage` del telefono: chi
torna trova già il campo compilato e tocca solo il bottone.

## Pubblicità sul monitor

`config.display.adMode`:

- `box` — riquadro sempre visibile a fianco (o sotto, su schermi stretti), gli
  annunci si alternano ognuno per i propri `seconds`.
- `full` — ogni `adEverySeconds` l'annuncio copre lo schermo per `adDurationSeconds`.
- `off` — solo la coda.

In entrambi i casi **una nuova chiamata chiude subito l'annuncio**: il numero ha
sempre la precedenza sulla pubblicità. Gli annunci sono `{ kind: 'text'|'image',
title, body, src, seconds }`; per le immagini conviene caricarle su Firebase
Storage e mettere l'URL in `src`.

## Avvio

```bash
npm install
cp .env.example .env          # incolla la config dalla console Firebase
npm run dev
```

Su Firebase console servono: **Firestore** e **Authentication → Accesso anonimo**
attivo (il cliente non fa login, ma ogni biglietto ha un proprietario).

Crea il primo locale:

```bash
npm i -D firebase-admin
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json npm run seed -- panificio demo
```

Poi aggiungi te stesso allo staff creando `venues/demo/staff/{tuo-uid}` da console.

## Pubblicazione

```bash
firebase login
firebase init hosting firestore   # public = dist, single-page app = sì
npm run deploy
```

`firebase.json` ha già il rewrite `**` → `/index.html`, necessario perché i
percorsi `/v/...` funzionino al refresh.

## Cosa manca per andare in produzione

- **Notifica push quando tocca a te.** Ora la pagina deve restare aperta. Con FCM
  il cliente può chiudere il telefono e riceve la chiamata comunque.
- **Anti-abuso.** Un uid anonimo può prendere molti numeri: una Cloud Function
  `onCall` al posto della scrittura diretta permette rate limiting e un solo
  biglietto attivo per dispositivo.
- **Storico e statistiche.** I ticket restano per giorno: aggregare `served` per
  fascia oraria dà il tempo medio reale al posto di `avgServiceMinutes` a mano.
- **Privacy.** Le regole attuali rendono la coda leggibile a chiunque sia
  autenticato, perché è comunque esposta sul monitor. Se compaiono nomi completi,
  meglio mostrare solo l'iniziale sul display.
