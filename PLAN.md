# ContaMì — Piano di sviluppo / Development plan

Questo documento governa lo sviluppo di ContaMì. Va aggiornato alla chiusura di ogni milestone. Il progetto procede in autonomia tra le milestone; sono richieste conferme soltanto per operazioni che richiedono credenziali, autorizzazioni del sistema operativo o altre azioni sensibili non già autorizzate.

## Visione del prodotto

ContaMì è un’app desktop bilingue (italiano/inglese) per macOS e Windows che rende semplice registrare e comprendere finanze personali complesse mantenendo un foglio di calcolo leggibile e archiviabile come fonte dati durevole. L’interfaccia è organizzata per viste — quadro generale, transazioni, immobili, investimenti, ricorrenze e spese condivise — con dashboard e inserimenti guidati.

## Decisioni architetturali iniziali

- Desktop: Electron, React e TypeScript, con renderer isolato dal sistema operativo.
- Struttura: moduli separati per dominio, casi d’uso, persistenza, adattatori spreadsheet, IPC, configurazione, i18n, tema e UI.
- Fonte dati: workbook progettato per ContaMì, semplice, tabellare, documentato e auditabile.
- Formato Excel: `.xlsx`, supportato su macOS e Windows e apribile anche con Apple Numbers.
- Formato Numbers: sincronizzazione nativa `.numbers` disponibile su macOS tramite un adattatore separato e Numbers installato; un workbook `.xlsx` interoperabile resta sempre disponibile come formato di scambio/recupero. Windows non può creare file `.numbers` nativi.
- Privacy: local-first, senza account, telemetria o servizi remoti nella prima versione.
- Distribuzione: repository GitHub privato, licenza Apache-2.0, build non firmate per macOS e Windows finché non saranno fornite credenziali di firma/notarizzazione.
- Versionamento: SemVer; prima release stabile prevista `v1.0.0`.

## Strategia Git e versioni

| Milestone | Branch previsto | Versione | Stato |
|---|---|---:|---|
| M0 — Piano e analisi | `milestone/00-plan-and-discovery` | `0.0.0` | Completata |
| M1 — Fondazioni dell’app | `milestone/01-foundation` | `0.1.0` | Completata localmente |
| M2 — Motore dati spreadsheet-first | `milestone/02-spreadsheet-engine` | `0.2.0` | Funzionale; collaudo Numbers pendente |
| M3 — Flussi finanziari principali | `milestone/03-finance-workflows` | `0.4.0` | Funzionale |
| M4 — Dashboard e reporting | `milestone/04-dashboards` | `0.6.0` | Funzionale |
| M5 — Archiviazione annuale e resilienza | `milestone/05-year-rollover` | `0.8.0` | Funzionale e testata |
| M6 — Sicurezza, qualità e accessibilità | `milestone/06-hardening` | `0.9.0` | In corso |
| M7 — Packaging e prima release | `milestone/07-release` | `1.0.0` | In corso |

## M0 — Piano, inventario e analisi del riferimento

**Obiettivo:** trasformare la richiesta e il file Numbers esistente in requisiti verificabili prima di implementare.

**Attività principali**

- Inventariare `assets/`, `sources/` e `STARTUP_PREFERENCES.md` senza modificare la fonte originale.
- Analizzare fogli, tabelle, categorie e relazioni del file Numbers; esportare una copia tecnica soltanto se necessario.
- Definire requisiti funzionali, schema dati iniziale, limiti del supporto Numbers e criteri privacy.
- Creare `PLAN.md` prima del codice.
- Inizializzare Git e collegare il repository GitHub privato `Contamì` (o la variante tecnicamente valida più vicina se GitHub rifiuta il carattere accentato).

**Criteri di accettazione**

- Il piano copre tutte le funzionalità richieste e distingue comportamento multipiattaforma e specifico macOS.
- La fonte Numbers rimane intatta.
- Le decisioni emerse dall’analisi sono riportate nel piano o in una nota di progetto versionata.

**Test/verifiche:** controllo inventario, hash della fonte prima/dopo l’analisi, verifica repository privato.

**Documentazione:** `PLAN.md`.

## M1 — Fondazioni applicative e design system

**Obiettivo:** consegnare un’app desktop avviabile, riconoscibile come ContaMì e pronta a ospitare funzionalità senza diventare monolitica.

**Attività principali**

- Scaffold Electron + React + TypeScript con processi main/preload/renderer separati.
- Configurare lint, typecheck, test unitari e build.
- Integrare logo e icone; derivare palette, tipografia, spaziature e stati UI dagli asset.
- Creare shell con navigazione per Overview, Transazioni, Immobili, Investimenti, Ricorrenze, Spese condivise e Impostazioni.
- Implementare dizionari italiano/inglese, rilevamento lingua di sistema e override persistente.
- Implementare tema sistema/chiaro/scuro con override persistente.
- Creare configurazione centrale validata e stati di errore/vuoto/caricamento.
- Creare `README.md`, `ISTRUZIONI.md`, `INSTRUCTIONS.md`, `MAP.md`, `SECURITY_MODEL.md`, `AGENTS.md`, `LICENSE` e `QUICK-START_Desktop.md`.

**Criteri di accettazione**

- L’app si avvia direttamente nella dashboard e tutte le viste sono navigabili.
- Lingua e tema seguono il sistema per default e possono essere cambiati senza riavvio.
- Nessuna stringa utente è hardcoded fuori dai dizionari.
- Main, preload e renderer sono separati; il renderer non ha accesso diretto a Node.js.

**Test richiesti:** lint, typecheck, unit test i18n/tema/configurazione, smoke test Electron, verifica visiva chiaro/scuro e IT/EN.

**Documentazione:** tutti i documenti obbligatori, con MAP iniziale e controlli di sicurezza effettivi.

## M2 — Modello finanziario e motore spreadsheet-first

**Obiettivo:** rendere il workbook ContaMì la fonte dati autorevole, con scritture atomiche, schema versionato e recupero verificabile.

**Attività principali**

- Definire entità e value object per transazioni, categorie, metodi di pagamento, conti, immobili, consumi, investimenti, risparmi/pensione, ricorrenze, rate e quote condivise.
- Definire tabelle del workbook con identificativi UUID, date ISO, importi numerici, valuta e stato attivo/chiuso.
- Implementare repository di dominio e casi d’uso indipendenti dal formato file.
- Implementare adattatore `.xlsx` multipiattaforma con lettura, validazione, migrazione e scrittura atomica.
- Implementare adattatore `.numbers` per macOS con capability detection, consenso esplicito e gestione sicura degli errori; mantenere un `.xlsx` interoperabile.
- Creare workbook iniziale pulito, foglio `Schema`, tabelle dati e fogli consuntivi leggibili manualmente.
- Implementare selezione/creazione file al primo avvio e preferenza di formato nelle impostazioni.
- Implementare lock, backup prima della sostituzione e rilevamento modifiche concorrenti.

**Criteri di accettazione**

- Un utente può creare/aprire un workbook, riavviare l’app e ritrovare gli stessi dati.
- Il file è apribile e comprensibile senza ContaMì.
- Un salvataggio interrotto non corrompe l’ultima copia valida.
- Formati o versioni non supportati producono un errore guidato senza sovrascrittura.

**Test richiesti:** unit test dominio, round-trip, migrazioni, file corrotto, path traversal, lock/concorrenza, salvataggio atomico, fixture workbook, apertura con Excel/LibreOffice e Numbers dove disponibile.

**Documentazione:** manuali, schema workbook, MAP, SECURITY_MODEL.

## M3 — Inserimento e gestione dei flussi finanziari

**Obiettivo:** coprire le attività quotidiane e patrimoniali attraverso moduli guidati e coerenti.

**Attività principali**

- CRUD e archiviazione logica per categorie, metodi di pagamento e conti.
- Transazioni con data, descrizione, categoria, metodo di pagamento, importo, valuta, note e collegamenti opzionali.
- Immobili: valore commerciale, entrate, uscite, consumi, mutui/costi e storico valutazioni.
- Investimenti: titoli, fondi, pensione integrativa e altre forme di risparmio; versamenti, prelievi, valore corrente e stato.
- Ricorrenze: abbonamenti, servizi, rate auto/prestiti, frequenza, prossima scadenza, fine e stato.
- Spese condivise: partecipanti, quota personale/partner, pagante, saldo e stato del rimborso.
- Chiusura/riapertura controllata degli elementi conclusi; cancellazione definitiva solo con conferma e quando sicura.
- Ricerca, filtri, ordinamento, validazione in tempo reale e feedback di salvataggio.

**Criteri di accettazione**

- Ogni inserimento richiesto arriva nel workbook con campi obbligatori e categoria corretta.
- Gli elementi chiusi restano nello storico ma non compaiono tra gli attivi per default.
- I moduli gestiscono importi negativi, date limite, campi mancanti e annullamento senza perdita dati.

**Test richiesti:** test casi d’uso e validazioni, integrazione UI/workbook, e2e dei principali inserimenti, modifica, chiusura e ripristino.

**Documentazione:** flussi utente IT/EN, esempi, troubleshooting, MAP.

## M4 — Dashboard e reporting

**Obiettivo:** offrire un quadro finanziario immediato, con numeri riconciliabili con il workbook.

**Attività principali**

- Dashboard iniziale: patrimonio netto, liquidità, investimenti, immobili, entrate/uscite, ricorrenze imminenti e saldo condiviso.
- Dashboard per Transazioni, Immobili, Investimenti, Ricorrenze e Spese condivise.
- Grafici accessibili, filtri temporali e confronto con periodo precedente.
- Indicatori con definizioni visibili e drill-down fino alle righe origine.
- Report mensile/annuale e riepiloghi esportati nel workbook tramite formule semplici e tabelle consuntive.
- Gestione esplicita di dati mancanti, valute multiple non convertite e valori stimati.

**Criteri di accettazione**

- Ogni KPI è riconciliato con le righe dati e ha una definizione documentata.
- Le dashboard funzionano in IT/EN e chiaro/scuro, anche con dataset vuoti o ampi.
- I dati non vengono inviati fuori dal dispositivo.

**Test richiesti:** unit test aggregazioni, dataset golden, riconciliazione workbook/UI, accessibilità di base, e2e filtri e drill-down, verifica visiva.

**Documentazione:** glossario KPI, manuali, README, MAP.

## M5 — Chiusura anno, archiviazione e resilienza

**Obiettivo:** automatizzare il passaggio annuale senza perdere storia e mantenendo file indipendenti e archiviabili.

**Attività principali**

- Procedura guidata “Chiudi anno” con anteprima e conferma esplicita.
- Creare un nuovo workbook per l’anno successivo includendo anagrafiche e situazioni attive.
- Conservare nel nuovo workbook solo i consuntivi aggregati dell’anno precedente necessari ai confronti.
- Rendere il vecchio workbook non più attivo, senza eliminarlo; proporre un percorso di archivio.
- Verificare hash, totali di controllo, backup e possibilità di rollback prima di cambiare file attivo.
- Gestire apertura di anni storici in sola lettura e recupero da backup.

**Criteri di accettazione**

- Il vecchio documento è intatto e archiviabile.
- Il nuovo documento contiene gli elementi ancora attivi e i soli consuntivi storici previsti.
- Totali di chiusura e apertura si riconciliano; un errore lascia il file attivo invariato.

**Test richiesti:** rollover con casi limite (ricorrenze, rate, investimenti, rimborsi, date), rollback, hash e riconciliazione, e2e procedura guidata.

**Documentazione:** guide chiusura anno e recupero IT/EN, SECURITY_MODEL, MAP.

## M6 — Hardening, qualità, accessibilità e prestazioni

**Obiettivo:** rendere la release affidabile per dati finanziari reali e verificare i confini di sicurezza dell’app locale.

**Attività principali**

- Applicare Electron hardening: `contextIsolation`, `nodeIntegration: false`, sandbox, preload minimo, CSP, blocco popup/navigazioni e IPC allowlist validato.
- Validare percorsi, estensioni, dimensioni, schema e payload; redigere errori e log.
- Implementare log locali minimali senza contenuti finanziari completi e rotazione limitata.
- Testare assenza di telemetria/rete inattesa e dipendenze vulnerabili.
- Accessibilità tastiera, focus, contrasto, etichette e riduzione movimento.
- Testare dataset ampi, avvio, salvataggio e dashboard; correggere colli di bottiglia.
- Eseguire revisione finale di sicurezza e allineare `SECURITY_MODEL.md` al codice.

**Criteri di accettazione**

- Nessun accesso diretto al filesystem dal renderer e nessun canale IPC generico.
- Nessun dato finanziario o segreto nei log e nessuna richiesta di rete in uso normale.
- Tutti i controlli automatici e gli e2e critici passano.
- Le limitazioni residue sono documentate chiaramente.

**Test richiesti:** suite completa, test IPC/CSP/path traversal/payload, audit dipendenze, smoke pacchettizzato, accessibilità e prestazioni.

**Documentazione:** SECURITY_MODEL definitivo, manuali, README, MAP, piano.

## M7 — Packaging multipiattaforma e release `v1.0.0`

**Obiettivo:** pubblicare una prima versione installabile e riproducibile per macOS e Windows nel repository GitHub privato.

**Attività principali**

- Configurare build macOS (`arm64` e, se sostenibile, `x64`/universal) e Windows (`x64`).
- Applicare icone e metadati, escludere fonti private, fixture sensibili e file locali.
- Configurare GitHub Actions per lint, typecheck, test, build, controlli documentali e packaging su macOS/Windows.
- Configurare workflow release su tag con artifact e checksum SHA-256.
- Verificare installazione/avvio fuori dal checkout; documentare Gatekeeper/SmartScreen per build non firmate.
- Aggiornare versione e documentazione, creare tag `v1.0.0` e GitHub Release privata.

**Criteri di accettazione**

- Artifact macOS e Windows sono prodotti dalla CI, hanno checksum e superano smoke test documentati.
- La release non contiene il file finanziario di esempio dell’utente né altri dati privati.
- Repository, workflow, tag e release restano privati.
- README e manuali permettono installazione, primo avvio, uso e recupero senza conoscenza del codice.

**Test richiesti:** CI completa, packaging smoke su entrambi i sistemi, controllo contenuto artifact, checksum, prova installazione e disinstallazione.

**Documentazione:** documenti obbligatori finali e note release bilingui.

## Checklist obbligatoria di chiusura per ogni milestone

- [ ] Branch milestone creato.
- [ ] Implementazione e migrazioni completate.
- [ ] Lint, typecheck e test pertinenti eseguiti.
- [ ] Smoke test o verifica manuale eseguiti.
- [ ] Versione sincronizzata quando prevista.
- [ ] `README.md`, `ISTRUZIONI.md` e `INSTRUCTIONS.md` aggiornati.
- [ ] `SECURITY_MODEL.md` aggiornato per cambi a sicurezza, rete, dati, file, IPC, logging o distribuzione.
- [ ] `MAP.md` e `AGENTS.md` aggiornati se struttura o regole operative cambiano.
- [ ] `PLAN.md` aggiornato con esito e limiti.
- [ ] Commit finale creato e diff controllato.
- [ ] PR/merge verso `main` eseguito secondo il flusso previsto.
- [ ] CI verificata sul branch/PR e su `main`.
- [ ] Tag/release creati soltanto per milestone rilasciabili.
- [ ] Artifact e checksum verificati quando esiste una release.
- [ ] Branch obsoleto eliminato solo dopo merge e verifiche.

## Registro di avanzamento — 2026-07-18

- M0: analizzato localmente e senza upload il workbook Numbers 26.3.1 (11 fogli, 43 tabelle nella sezione immobili); hash sorgente conservato nella nota di analisi e file originale intatto. Repository GitHub privato creato come `gloutchov/Contami`: GitHub non accetta `ì` nel nome tecnico e aveva convertito `Contamì` in `Contam-`, quindi è stata scelta la variante pulita più vicina.
- M1: shell Electron/React modulare, branding, i18n IT/EN, tema sistema/chiaro/scuro, configurazione validata e documenti obbligatori completati. Verifica Playwright di tutte le viste: 0 errori e 0 warning console.
- M2: schema workbook v1 con 14 fogli, round-trip validato, scrittura temporanea e rilettura, backup (10), rollback e rilevamento modifiche esterne. Workbook sintetico renderizzato con uno strumento indipendente. Il mirror `.numbers` è implementato ma non collaudabile su questa macchina perché Apple Numbers non è installato.
- M3/M4: inserimenti guidati e dashboard generale/tematiche completati; chiusura/riapertura logica implementata. La v1 iniziale non include modifica/cancellazione fisica delle righe né creazione automatica delle transazioni dalle ricorrenze.
- M5: rollover estratto in funzione di dominio e coperto da casi di test per saldi, posizioni attive, valutazioni, ricorrenze e spese condivise.
- M6: sandbox/isolamento/CSP/IPC allowlist/blocco rete implementati; audit npm 0 vulnerabilità; 8 test automatici passano. Restano da completare smoke del pacchetto firmato e misure prestazionali su dataset molto ampi.
- M7: workflow CI/release macOS+Windows e checksum configurati. Il codice Electron di produzione supera lo smoke test con il runtime ufficiale firmato; il bundle macOS locale non firmato viene bloccato su Apple Silicon. Firma ad-hoc con library validation ridotta non è stata abilitata senza approvazione esplicita. Tag `v1.0.0` e release restano sospesi finché CI e strategia firma macOS non sono risolti.

## Rischi e mitigazioni iniziali

| Rischio | Mitigazione |
|---|---|
| Il formato `.numbers` non è documentato né scrivibile nativamente su Windows | Adapter macOS isolato + `.xlsx` interoperabile e sempre recuperabile |
| Corruzione o conflitto durante il salvataggio | Scrittura temporanea, validazione, sostituzione atomica, backup e lock/version check |
| Errori nei KPI finanziari | Logica pura testata, dataset golden, totali di controllo e drill-down alle righe origine |
| Esposizione di dati personali | Local-first, zero telemetria, log redatti, dati di esempio sintetici, esclusioni packaging/Git |
| File modificato contemporaneamente in Excel/Numbers | Rilevamento impronta/mtime e blocco del salvataggio con scelta guidata |
| Build non firmate | Nessuna falsa promessa; avvisi documentati e workflow pronto per credenziali future |

## Criterio di completamento del progetto

Il progetto è completo quando la release `v1.0.0` privata include applicazioni installabili per macOS e Windows, tutte le funzioni richieste sono coperte da test proporzionati al rischio, il workbook resta leggibile fuori dall’app, la chiusura annuale è riconciliata, i documenti obbligatori sono aggiornati e la CI è verde.
