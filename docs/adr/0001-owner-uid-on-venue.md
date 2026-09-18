# ADR-0001 — ownerUid come campo su venues/{id}

**Stato:** Accettato  
**Data:** 2026-09-18

## Contesto

InFila supporta più venue per account. Ogni venue deve sapere chi la possiede per proteggere le rotte `/staff` e `/admin` e per permettere alla dashboard di listare solo le venue dell'owner loggato.

## Decisione

Il campo `ownerUid: string` viene aggiunto direttamente sul documento `venues/{id}`. La dashboard usa `query(collection('venues'), where('ownerUid', '==', uid))` per listare le venue dell'owner.

## Alternative considerate

**Subcollection `users/{uid}/venues/{venueId}`**: richiederebbe due letture per ogni venue (il puntatore nella subcollection + il documento reale), complica le Firestore rules, e non offre vantaggi per questo modello di accesso.

## Conseguenze

- Le Firestore rules sostituiscono `isStaff(v)` con `isOwner(v)` — `resource.data.ownerUid == request.auth.uid` — per le operazioni di scrittura su configurazione e stato della venue.
- Il seed script (`scripts/seed.mjs`) accetta un parametro `ownerUid` opzionale; in development/emulatore può rimanere `null`.
- Le venue create prima di questa modifica (es. seed "demo") hanno `ownerUid: null` e sono inaccessibili dalla dashboard. Vanno ri-seedate o aggiornate manualmente in console.
