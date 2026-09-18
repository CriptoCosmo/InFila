# InFila — Glossario di dominio

## Termini canonici

### Venue
Un esercizio commerciale che usa InFila per gestire la propria coda. Ogni venue ha uno **slug** univoco, un **vertical** (panificio, ristorante, bar, ufficio) e un **owner**.

### Owner
L'esercente che ha creato la venue. Può accedere a tutte le schermate operative: operatore cassa (`/staff`), configurazione (`/admin`), e dashboard. Un owner può possedere più venue.

### Slug
Identificatore testuale univoco della venue nell'URL (`/v/:slug`). Auto-generato dal nome della venue, editabile dall'owner al momento della creazione. In caso di collisione, viene proposto un suffisso casuale corto (es. `panificio-rossi-k7x2`).

### Vertical
Preset di configurazione che determina il comportamento della venue: cosa chiedere al cliente, il lessico (numero/tavolo/ordine), i tempi medi, le pubblicità predefinite. Valori: `panificio`, `ristorante`, `bar`, `ufficio`.

### Ticket
Il "numero" preso dal cliente entrando in coda. Contiene: numero progressivo, stato (`waiting` / `called` / `served` / `noshow` / `cancelled`), dati opzionali (nome, coperti, ordine, nota).

### Coda
L'insieme dei ticket in stato `waiting` per una venue in un dato giorno.

### Cliente
Chi scansiona il QR e prende un numero. Non ha un account: accede con autenticazione anonima Firebase. Non è un Owner.

### Dashboard
Schermata riservata all'owner (`/dashboard`): lista le sue venue con link rapidi a monitor, cassa e admin. Punto di partenza dopo il login.

### Wizard creazione venue
Pagina singola mostrata all'owner al primo login (e raggiungibile dalla dashboard con "Aggiungi locale"). Raccoglie: nome venue, slug (auto-generato, editabile), vertical.

### Monitor / Display
Schermata pubblica (`/v/:slug/display`) pensata per un TV o tablet in sala d'attesa. Mostra il numero in corso e gli annunci pubblicitari. Non richiede login.

## Confini espliciti

- **Owner ≠ Staff invitato**: nell'MVP esiste un solo ruolo. La distinzione tra proprietario e operatore di cassa è rimandato a v2.
- **Cliente ≠ Owner**: un cliente che scansiona il QR non ha bisogno di un account. Se un owner scansiona il QR del proprio locale, lo fa come cliente (auth anonima sostituita dalla sua sessione autenticata — comportamento accettato).
- **Venue ≠ Vertical**: il vertical è un preset copiato in `venues/{id}.config` alla creazione. Da quel momento la config vive sul documento Firestore e il vertical è solo un'etichetta.
