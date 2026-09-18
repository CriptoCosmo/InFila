# ADR-0002 — Doppia autenticazione: anonima (clienti) + reale (owner)

**Stato:** Accettato  
**Data:** 2026-09-18

## Contesto

I clienti che prendono il numero non hanno un account. Gli owner che gestiscono la venue accedono con Google o email/password. Firebase Auth supporta entrambe le modalità nella stessa app.

## Decisione

- **Clienti**: `signInAnonymously()` tramite `ensureAuth()` esistente. Ogni ticket porta `uid` dell'utente anonimo; le Firestore rules validano che `request.auth.uid == resource.data.uid` per le operazioni sul proprio ticket.
- **Owner**: `signInWithPopup(GoogleAuthProvider)` o `signInWithEmailAndPassword()`. La sessione owner sostituisce quella anonima nello stesso browser se l'owner usa il proprio locale come cliente — comportamento accettato per MVP.

## Alternative considerate

**Auth separata per owner su sottodominio** (es. `admin.infila.app`): isola le sessioni ma raddoppia la complessità di deploy e routing.

## Conseguenze

- `ensureAuth()` rimane invariato per i percorsi cliente.
- Le schermate `/staff`, `/admin` e `/dashboard` usano `onAuthStateChanged` direttamente e non chiamano `ensureAuth()`.
- Un owner che scansiona il proprio QR entra in coda con il proprio `uid` reale (non anonimo). Il ticket è funzionalmente identico; l'unico effetto è che non può "dimenticare" quel ticket cambiando browser.
