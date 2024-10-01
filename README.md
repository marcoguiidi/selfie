## Membri e contributi

### Marco Guidi

- Email: marco.guidi24@studio.unibo.it

### Fabio Chiarini

- Email: fabio.chiarini2@studio.unibo.it

Entrambi i membri hanno partecipato attivamente allo sviluppo del progetto, lavorando in sessioni di Pair Programming. In particolare:

#### [ENTRAMBI I MEMBRI]

- Project setup and architecture
- Sviluppo Back-End (Node.js, Express, MongoDB)
- Sviluppo Front-End (React)
- Time Machine feature
- Contributi alle altre funzionalità del progetto

#### [Marco Guidi]

- Principale focus sullo sviluppo della funzionalità del Calendario

#### [Fabio Chiarini]

- Principale focus sullo sviluppo della funzionalità del Pomodoro Timer

## Funzionalità implementate

L'applicazione è stata sviluppata utilizzando un'architettura client-server composta da un frontend in React e un backend basato su Node.js/Express, con il supporto di un database MongoDB per la persistenza dei dati. Il progetto offre una serie di funzionalità per la gestione degli eventi, la creazione e visualizzazione di note, e l'uso di un timer Pomodoro per ottimizzare la produttività. L'interfaccia è stata progettata per essere responsiva, adattandosi perfettamente sia a desktop che a dispositivi mobili.

#### Autenticazione Utente

- **Registrazione e Login**: Gli utenti possono registrarsi fornendo nome utente, email, password, nome reale e data di nascita. Il sistema implementa un'autenticazione sicura per l'accesso.
- **Evento di Compleanno**: Al momento della registrazione, viene creato automaticamente un evento di compleanno per l'utente, che verrà visualizzato nel calendario.

#### Home Page
La home page mostra una preview delle principali sezioni dell'applicazione:
* **Eventi della settimana o del giorno corrente.**
* **Ultima nota creata.**
* **Report dell'ultimo ciclo di Pomodoro completato.**

#### Calendario
Il calendario è una delle componenti centrali dell'applicazione, offrendo diverse funzionalità avanzate:

- **Gestione Eventi**: Creazione, modifica e cancellazione di eventi.
- **Eventi Ricorrenti**: Possibilità di impostare eventi singoli o ricorrenti su base giornaliera, settimanale, mensile o annuale.
- **Visualizzazioni Multiple**: Gli eventi possono essere visualizzati in modalità giornaliera, settimanale o mensile.
- **Deadline**: Gli eventi possono essere contrassegnati come "deadline" (isDeadline), gestendo attività con scadenze.
- **Personalizzazione**: Gli eventi possono essere personalizzati nei colori e nello stato (attivo, scaduto o completato).

- **Completamento Deadline**: È possibile completare un evento con scadenza una volta raggiunto l'obiettivo.
- **Lista Attività**: Gli eventi sono organizzabili anche in una lista separata di attività.
- **Modifica degli Eventi**: Gli eventi possono essere modificati in ogni loro parte dopo la creazione.

#### Note

La sezione note consente la gestione di appunti personali:

- **Creazione, Modifica e Cancellazione**: Gli utenti possono creare note con titolo, contenuto e categorie.
- **Ordinamento**: Le note possono essere ordinate per data di creazione, ultima modifica o categoria.
- **Markdown**: È supportato il Markdown per la formattazione del testo nelle note (Estensione 18-24).
- **Visualizzazione Dettagliata**: Le note possono essere visualizzate in dettaglio con il rendering del Markdown.
- **Categorie Personalizzabili**: Gli utenti possono personalizzare le categorie oltre a quelle predefinite ("Unibo" e "Altro"), create automaticamente al momento della registrazione.

#### Timer Pomodoro

Il timer Pomodoro consente la gestione dei cicli di studio e pausa:

- **Impostazioni Personalizzabili**: È possibile personalizzare i tempi di studio, pausa breve e pausa lunga.
- **Cicli Configurabili**: Gli utenti possono configurare il numero di cicli di studio e pause lunghe.
- **Pause e Riprese**: Il timer può essere messo in pausa, ripreso o interrotto in qualsiasi momento.
- **Animazioni CSS**: Durante le fasi di studio e pausa vengono visualizzate animazioni CSS.

#### Time Machine

La funzionalità Time Machine permette agli utenti di esplorare eventi passati e futuri:

- **Navigazione Temporale**: Si può scorrere avanti o indietro nel tempo per visualizzare eventi di altri giorni o settimane.
- **Sincronizzazione con Pomodoro**: La Time Machine è sincronizzata con il timer Pomodoro, permettendo di visualizzare eventi passati o futuri legati ai cicli Pomodoro.

#### Interfaccia e Responsività

L'applicazione è progettata per essere completamente responsiva, adattandosi sia a schermi desktop che a dispositivi mobili. L'interfaccia è moderna e intuitiva, offrendo un'esperienza utente fluida.

#### Funzionalità Estese

L'applicazione include diverse funzionalità avanzate, legate a estensioni specifiche del progetto:

- **Supporto Markdown nelle Note** (Estensione 18-24).
- **Eventi con Invitati**: Gli eventi possono includere invitati, con la possibilità per gli utenti di declinare un invito (parzialmente implementato, Estensione 18-27).
- **Integrazione Timer Pomodoro**: Il timer Pomodoro è integrato con il calendario, creando automaticamente eventi relativi ai cicli di studio (Estensione 18-24).
- **Cicli Pomodoro Non Completati**: I cicli non completati vengono automaticamente trasferiti ai giorni successivi (Estensione 18-24).

#### Conclusioni

L'applicazione sviluppata rappresenta una soluzione completa per la gestione di eventi, note e cicli di produttività Pomodoro. La sua architettura flessibile e le numerose funzionalità avanzate offrono agli utenti un'esperienza personalizzabile e integrata per la gestione del proprio tempo e delle proprie attività.
