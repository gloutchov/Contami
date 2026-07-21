# ContaMì — Piano di sviluppo / Development plan

Questo documento governa lo sviluppo di ContaMì. Va aggiornato alla chiusura di ogni milestone. Il progetto procede in autonomia tra le milestone; sono richieste conferme soltanto per operazioni che richiedono credenziali, autorizzazioni del sistema operativo o altre azioni sensibili non già autorizzate.

## Visione del prodotto

ContaMì è un’app desktop bilingue (italiano/inglese) per macOS e Windows che rende semplice registrare e comprendere finanze personali complesse mantenendo un foglio di calcolo leggibile e archiviabile come fonte dati durevole. L’interfaccia è organizzata per viste — quadro generale, transazioni, immobili, automobile, investimenti, pensione integrativa, ricorrenze e spese condivise — con dashboard e inserimenti guidati.

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

Le versioni pre-1.0 indicano un **checkpoint di maturità verificato**, non il numero della milestone né la percentuale aritmetica di codice scritto. Una versione viene promossa soltanto dopo la revisione dei criteri di accettazione pertinenti; le correzioni che non cambiano checkpoint incrementano la patch. La `v1.0.0` resta la prima release stabile installabile e verificata su macOS e Windows.

La milestone M8 è stata aggiunta dopo la prima stesura del piano, ma completa ed estende i flussi applicativi prima dell’hardening finale; per maturità si colloca quindi tra M5 e M6. Il tag `v0.2.0` resta la **preview storica** precedente. La revisione applicativa ha confermato il codice completato fino a M8 come checkpoint funzionale `v0.8.0`; il lavoro successivo riparte dal gate di hardening `v0.9.0`.

| Milestone | Branch previsto | Checkpoint di maturità | Stato |
|---|---|---:|---|
| M0 — Piano e analisi | `milestone/00-plan-and-discovery` | `0.0.0` | Completata |
| M1 — Fondazioni dell’app | `milestone/01-foundation` | `0.1.0` | Completata; CI macOS/Windows verde |
| M2 — Motore dati spreadsheet-first | `milestone/02-spreadsheet-engine` | `0.2.0` | Completata; adattatore Numbers collaudato |
| M3 — Flussi finanziari principali | `milestone/03-finance-workflows` | `0.4.0` | Completata |
| M4 — Dashboard e reporting | `milestone/04-dashboards` | `0.6.0` | Completata |
| M5 — Archiviazione annuale e resilienza | `milestone/05-year-rollover` | confluisce in `0.8.0` | Completata e testata |
| M8 — Dati collegati, automobile, CRUD e confronti storici | `milestone/08-linked-finance-workflows` | `0.8.0` | Completata, revisionata e promossa al checkpoint funzionale |
| M6 — Sicurezza, qualità e accessibilità | `milestone/06-hardening` | `0.9.0` | Completata; CI/release macOS e Windows verdi |
| M7 — Packaging e prima release | `milestone/07-release` | `1.0.0` | In corso; gate di installazione e rimozione in verifica |
| M9 — Valutazioni immobiliari web e mercati ISIN | `milestone/09-market-data` | `1.1.0` | Pianificata e subordinata al gate provider/privacy |

**Sequenza di promozione corrente:** `v0.2.0` preview storica → `v0.8.0` checkpoint funzionale → hardening `v0.9.0` → stabile `v1.0.0` → funzionalità di rete opzionali `v1.1.0`.

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
- Creare shell con navigazione per Overview, Transazioni, Immobili, Automobile, Investimenti, Pensione Integrativa, Ricorrenze, Spese condivise e Impostazioni.
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

- Definire entità e value object per transazioni, categorie, metodi di pagamento, conti, immobili, consumi domestici, veicoli e relativi costi/consumi, investimenti, pensioni integrative/comparti, ricorrenze, rate e quote condivise.
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
- Automobile: anagrafica delle vetture attuali e precedenti, rifornimenti e consumi, rate, bollo, assicurazione, pneumatici, manutenzione ordinaria e straordinaria.
- Investimenti: titoli, fondi e altre forme di risparmio; versamenti, liquidazioni, valore corrente e stato.
- Pensione Integrativa: pensioni usate come raccoglitori, comparti associati, totale aggregato senza doppio conteggio, versamenti, liquidazioni, valutazioni e piani periodici.
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
- Dashboard per Transazioni, Immobili, Automobile, Investimenti, Pensione Integrativa, Ricorrenze e Spese condivise.
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
- Conservare nel nuovo workbook i consuntivi aggregati dell’anno precedente necessari ai confronti, con dettaglio annuale per singolo immobile/utenza, investimento/comparto pensione e veicolo/categoria di costo.
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

## M8 — Dati collegati, automobile, CRUD e confronti storici

**Obiettivo:** eliminare gli inserimenti duplicati, completare la gestione delle anagrafiche e rendere confrontabili situazione e flussi con gli anni precedenti.

**Attività principali**

- Migrare il workbook allo schema v3 mantenendo la lettura/migrazione dei file v1 e v2 e aggiungendo collegamenti espliciti tra transazioni, immobili, investimenti, automobile, ricorrenze e spese condivise.
- Implementare creazione, modifica e cancellazione controllata per categorie, metodi di pagamento, immobili, investimenti, movimenti, ricorrenze e spese condivise; aggiungere la gestione dei tipi di investimento.
- Mostrare accanto a categorie e metodi di pagamento il numero di utilizzi effettivi in tutte le sezioni collegate, usando lo stesso conteggio completo per impedire cancellazioni che lascerebbero riferimenti orfani.
- Rendere bidirezionale la registrazione dei movimenti collegati: una sola riga economica autorevole, riflessa automaticamente nelle viste pertinenti senza doppio conteggio.
- Estendere le transazioni con filtri per testo, categoria, metodo di pagamento e mese, parziali filtrati, totali assoluti e alla data odierna, più evidenza visiva delle registrazioni ricorrenti.
- Estendere gli immobili con scheda anagrafica, destinazione residenza/locazione, indirizzo, superficie, quota di proprietà, valore catastale, movimenti, consumi, spese comuni e controllo degli affitti attesi.
- Aggiungere alla scheda dell’abitazione grafici annuali separati per consumi di elettricità, gas e acqua, ottenuti dalle registrazioni correnti e dai consuntivi ereditati.
- Aggiungere alla residenza i consuntivi monetari e i grafici annuali di spesa per elettricità, gas e acqua; aggiungere a ogni immobile il grafico del valore commerciale, ai locati il confronto entrate/uscite e al dettaglio i filtri per mese e descrizione.
- Aggiungere la sezione Automobile con CRUD di vetture e registrazioni, rifornimenti/consumi, rate, bollo, assicurazione, pneumatici, manutenzione ordinaria/straordinaria, dettaglio costi e confronto con vetture precedenti.
- Confrontare le vetture per nome sull’asse orizzontale e costo per chilometro sull’asse verticale, ricavando percorrenza e costi della vettura attuale dalle registrazioni di dettaglio e i consuntivi delle precedenti dai dati storici.
- Estendere gli investimenti non pensionistici con raggruppamento per tipologia, dettaglio movimenti, totali parziali, soli movimenti Versamento/Liquidazione e piani periodici collegati alle ricorrenze.
- Mostrare per ogni investimento e comparto pensione il confronto storico tra cifra investita e controvalore, aggregando i comparti nel raccoglitore senza perdere i valori individuali.
- Portare nei grafici finanziari tutte le osservazioni datate disponibili, non soltanto un punto annuale, mantenendo i consuntivi annuali come continuità per gli anni privi di registrazioni di dettaglio.
- Separare la Pensione Integrativa dagli Investimenti: consentire la creazione di pensioni-raccoglitore e comparti associati, con CRUD, dettaglio, movimenti, valutazioni e piani periodici collegati. Rappresentare il Fondo Pensione Fideuram come pensione e Linea Equilibrio, Linea Crescita e Linea Valore come comparti, aggregando il totale senza duplicazioni.
- Estendere le ricorrenze con direzione entrata/uscita, frequenza mensile o annuale, filtri e collegamento opzionale a un investimento o immobile.
- Estendere le spese condivise con collegamento alle transazioni, filtri mensili, saldo massivo del mese e stampa delle voci non saldate.
- Riconciliare le spese condivise del workbook privato con tutte le righe mensili del foglio sorgente `SPESE ORDINARIE`, conservando quote, pagante e stato e collegando una transazione soltanto quando la corrispondenza è non ambigua.
- Aggiungere alla Panoramica tre grafici storici: patrimonio/liquidità/immobili/investimenti, entrate/uscite e impegni mensili; conservare i valori nei consuntivi annuali durante il rollover.
- Estendere il rollover con `Property History`, `Investment History` e `Vehicle History`, mantenendo il nuovo workbook pulito senza perdere le serie necessarie ai confronti.
- Limitare le liste recenti della Panoramica ai movimenti confermati fino alla data odierna e aggiungere il riepilogo separato delle spese ricorrenti recenti.
- Uniformare i filtri di Transazioni, Ricorrenze e Spese condivise; completare la scheda residenza con Telefono/Internet e Canone TV.
- Correggere il rilevamento di Apple Numbers quando installato tramite Apple Creator Studio e uniformare la splash screen al logo.
- Integrare nel workbook ContaMì 2026 i dati mancanti ricavati localmente dal documento Numbers di esempio, senza versionare o distribuire dati personali.
- Riconciliare l’importazione privata con le transazioni sorgente come unica lista autorevole, importi unitari delle ricorrenze, investimenti cumulativi convertiti in variazioni, consuntivi immobiliari/utenze e totali storici delle vetture; rappresentare acquisti e liquidazioni finanziarie come trasferimenti direzionati che incidono sulla liquidità ma non sulle entrate/uscite correnti.

**Criteri di accettazione**

- Un movimento collegato inserito o modificato da una vista è immediatamente coerente in tutte le altre viste coinvolte e viene contabilizzato una sola volta.
- Investimenti e Pensione Integrativa hanno viste e totali distinti; i comparti sono associati a una sola pensione-raccoglitore e il patrimonio complessivo li conta una sola volta.
- Tutte le anagrafiche richieste sono modificabili e cancellabili con conferma; i riferimenti esistenti non possono restare orfani.
- Filtri, parziali e grafici storici sono riconciliabili con le righe e i consuntivi del workbook.
- I file v1 e v2 si aprono senza perdita dati e vengono salvati come v3 soltanto dopo validazione e backup.
- Consumi domestici, posizioni finanziarie/comparti e costi delle automobili restano confrontabili dopo il cambio d’anno tramite consuntivi annuali dettagliati.
- Il workbook personale completato resta escluso da Git, CI e pacchetti di distribuzione.

**Test richiesti:** migrazione v1/v2→v3, sincronizzazione bidirezionale e cancellazione, aggregazioni storiche di utenze/veicoli/investimenti, filtri, rollover, round-trip workbook, e2e dei flussi principali, verifica visiva chiaro/scuro e IT/EN, apertura del workbook con strumento indipendente.

**Documentazione:** aggiornamento di manuali, README, MAP, SECURITY_MODEL e schema del workbook.

## M9 — Valutazioni immobiliari web e andamento titoli tramite ISIN

**Obiettivo:** arricchire le valutazioni con dati esterni verificabili mantenendo controllo manuale, privacy e funzionamento offline.

**Attività pianificate**

- Aggiungere il codice ISIN agli investimenti e validarne il formato senza assumere che identifichi sempre un titolo quotato.
- Integrare un fornitore di dati di mercato con licenza e limiti d’uso compatibili, cache locale, indicazione di fonte/data/valuta e grafico storico; lasciare sempre disponibile l’inserimento manuale.
- Integrare uno o più fornitori autorizzati di quotazioni immobiliari per zona, con indirizzo minimizzato o livello geografico configurabile, consenso esplicito e tracciamento di fonte/data del valore al metro quadrato.
- Calcolare una stima automatica dal valore €/m², superficie e quota di proprietà, distinguendola visivamente dalle valutazioni manuali e consentendo override e disattivazione.
- Eseguire l’aggiornamento all’avvio solo se abilitato, con timeout breve, cache e fallback offline; non bloccare mai l’apertura dell’app.
- Documentare chiavi API, privacy, condizioni d’uso, accuratezza e limiti: i dati esterni sono indicativi e non costituiscono consulenza finanziaria o perizia immobiliare.

**Gate di avvio:** selezione del fornitore e approvazione delle relative condizioni/costi e dell’invio dei dati strettamente necessari. Questa milestone introduce rete in un’app oggi local-first e richiede quindi una decisione esplicita prima dell’implementazione.

**Test richiesti:** mock dei provider, rete assente/lenta, rate limit, dati obsoleti o incoerenti, conversioni valutarie, cache, consenso/opt-out, accessibilità dei grafici e assenza di segreti nei pacchetti.

**Documentazione:** privacy e sicurezza di rete, fonti e disclaimer, configurazione provider, manuali IT/EN, MAP e note di rilascio.

## Checklist obbligatoria di chiusura per ogni milestone

La checklist seguente è un gate riutilizzabile da verificare alla chiusura di ciascuna milestone; non è il registro cumulativo dello stato del progetto. Gli esiti effettivi sono riportati nella tabella e nei registri di avanzamento.

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
- M2: schema workbook aggiornato alla v2 con 15 fogli, lettura/migrazione v1, round-trip validato, scrittura temporanea e rilettura, backup (10), rollback e rilevamento modifiche esterne. Il mirror `.numbers` è stato collaudato con successo sulla nuova installazione **Numbers Creator Studio**, rilevata tramite bundle id `com.apple.Numbers`.
- M3/M4: inserimenti guidati, CRUD controllato, dettagli, filtri e dashboard generale/tematiche completati; chiusura/riapertura logica e transazioni pianificate da ricorrenze implementate.
- M5: rollover estratto in funzione di dominio e coperto da casi di test per saldi, posizioni attive, valutazioni, ricorrenze e spese condivise.
- M6: sandbox/isolamento/CSP/IPC allowlist/blocco rete, misure prestazionali su dataset ampi, accessibilità, supply chain e smoke dei pacchetti completati; audit npm con 0 vulnerabilità e checkpoint `v0.9.0` verificato su macOS e Windows.
- M7: repository privato e workflow CI/release macOS+Windows con checksum configurati; CI cross-platform verde nel run `29643193163`. Per scelta progettuale le preview sono prodotte senza certificati e senza firma ad-hoc del bundle. Il crash del primo bundle Apple Silicon dipendeva dai metadati Unicode del pacchetto, non da Gatekeeper: bundle, metadati tecnici ed eseguibile usano `Contami`, mentre logo, titolo e UI mantengono `ContaMì`. Il bundle ARM non firmato supera lo smoke locale mantenendo l’Hardened Runtime predefinito. Manuali e note release documentano Gatekeeper, SmartScreen e Smart App Control senza suggerire di disattivare globalmente le protezioni. La preview `v0.1.0` precede la futura stabile `v1.0.0`.
- M8: schema v3 con migrazione v1/v2, sincronizzazione bidirezionale, CRUD, filtri/parziali, viste di dettaglio, dashboard storiche, grafici dei consumi domestici e sezione Automobile completati. Investimenti e Pensione Integrativa restano aree distinte; il rollover conserva consuntivi dettagliati per immobile/utenza, investimento/comparto e veicolo. Il workbook personale 2026 è stato ricostruito localmente dalla nuova copia Numbers, validato con rilettura dell’adapter applicativo e mantenuto escluso da Git e release; nessun dato reale è usato nei test o nella documentazione. Preflight locale completato con 29 test automatici, build renderer/Electron, controllo documenti, audit npm senza vulnerabilità e verifica Playwright IT/EN, chiaro/scuro a 1080 px senza errori console. CI cross-platform verde sul branch nel run `29694831210` e su `main` nel run `29694927686`; il checkpoint fu inizialmente pubblicato come preview storica `v0.2.0` ed è stato successivamente promosso, senza cambiare il perimetro funzionale, al tag di maturità `v0.8.0`. Gli artifact restano non firmati come documentato.
- M9: registrate come funzionalità future la stima immobiliare automatica €/m² e i grafici di mercato tramite ISIN; l’implementazione resta subordinata alla scelta consapevole dei provider e delle condizioni di privacy/licenza.

## Registro ritocchi — 2026-07-19

- Panoramica: le liste recenti usano la data odierna, escludono movimenti futuri/pianificati e distinguono le spese ricorrenti confermate.
- UI: filtri distribuiti su tutta la larghezza disponibile in Transazioni, Ricorrenze e Spese condivise, con etichette accessibili per i controlli.
- Immobili: aggiunti gli indicatori bilingui Telefono/Internet e Canone TV alla residenza, con aggregazione testata su categoria e descrizione.
- Pensione Integrativa: nuova area separata dagli Investimenti con pulsanti **Crea pensione** e **Crea comparto**; Fondo Pensione Fideuram è il raccoglitore e Linea Equilibrio, Linea Valore e Linea Crescita sono i comparti correlati. Dashboard e patrimonio evitano il doppio conteggio.
- Avvio: se il workbook ricordato è stato spostato o cancellato, il percorso obsoleto viene rimosso e l’app si apre nello stato non configurato con le azioni per aprire o creare un file; workbook non validi continuano a produrre errore senza essere sovrascritti.
- Impostazioni: categorie e metodi di pagamento mostrano un badge con il numero di utilizzi prima dei comandi di modifica; il conteggio include tutte le registrazioni collegate ed è condiviso con la protezione dalla cancellazione.
- Spese condivise: l’importazione privata è stata ricostruita dai dodici prospetti mensili `SPESE ORDINARIE`, riconciliando le quote al centesimo e collegando soltanto le corrispondenze certe con le Transazioni.
- Investimenti e Pensione Integrativa: i grafici cifra investita/controvalore usano tutte le valutazioni e i movimenti datati disponibili, con etichette temporali compatte e aggregazione dei comparti.
- Automobile: il confronto usa i nomi delle vetture sull’asse X e il costo/km sull’asse Y; per la vettura corrente distanza e costi provengono dalle registrazioni di dettaglio, mentre i consuntivi storici restano disponibili per le vetture precedenti.

## Revisione del piano — 2026-07-20

- Ripristinata la progressione di maturità originaria: la `v0.2.0` resta la preview storica precedente e il perimetro funzionale completato con M8 è stato promosso alla `v0.8.0`; `v0.9.0` e `v1.0.0` restano rispettivamente i gate di hardening e stabilità installabile.
- Corretti gli stati superati: il mirror Numbers e la CI M8 risultano collaudati; la checklist generale è esplicitamente un modello di gate e non un elenco globale di attività ancora aperte.
- `npm install` conclude con 0 vulnerabilità note ma segnala pacchetti transitivi deprecati. Le catene correnti partono da `exceljs` (`lodash.isequal`, `fstream`, `rimraf`, `glob`, `inflight`) e dalla toolchain `electron-builder` (`boolean`, `rimraf`, `glob`, `inflight`); nessuno di questi pacchetti è una dipendenza diretta di ContaMì. Il gate `v0.9.0` deve rivalutare gli aggiornamenti upstream o alternative compatibili senza usare override non verificati.
- npm richiede inoltre di autorizzare consapevolmente gli script di installazione di `esbuild` e `electron-winstaller`; la decisione e l’eventuale configurazione riproducibile vanno verificate insieme alla build e al packaging, senza approvazioni automatiche indiscriminate.
- Revisione applicativa `v0.8.0`: corretti controvalori di investimenti e comparti pensione includendo movimenti confermati e valutazioni in ordine temporale; aggiunto il versamento iniziale con Transazione collegata e limitato il badge Ricorrente ai soli collegamenti espliciti.
- Immobili: aggiunta valutazione per totale o €/m²; introdotti flussi dedicati Utenze (fasce F1/F2/F3/F2+F3, m³ gas/acqua) e Tasse (Canone TV, IMU, TARI, numero rata e checkbox per il riepilogo delle Spese comuni), collegati atomicamente a Transazioni e opzionalmente a Spese condivise tra persone. I dettagli propongono tutti i dodici mesi e i grafici di valore commerciale ed entrate/uscite seguono le date effettive degli inserimenti.
- Preflight della revisione completato con lint, typecheck, build renderer/Electron e 42 test automatici; controllo documentale superato. La verifica visiva interattiva delle nuove modali resta da ripetere quando è disponibile un browser integrato o sull'app Electron locale.

## Avvio e chiusura M6 — 2026-07-21

- Creato il branch `milestone/06-hardening` dal checkpoint pulito `v0.8.0`; chiarita nel registro M8 la distinzione tra preview storica `v0.2.0` e promozione di maturità `v0.8.0`.
- Rafforzato il confine Electron: IPC accettato soltanto dal frame principale e dall’URL autorizzato, tuple e arità validate, blocco anche di WebSocket/webview/drag navigation, doppio diniego delle autorizzazioni e DevTools disabilitati nel pacchetto.
- Migliorata l’accessibilità delle modali con focus iniziale, contenimento Tab/Shift+Tab, Escape e ripristino del focus; aggiunti riduzione movimento, navigazione tradotta e stato di salvataggio annunciato.
- Ottimizzate dashboard e valorizzazione investimenti eliminando scansioni ripetute; aggiunto un budget automatico con 25.000 transazioni, 1.200 immobili e 1.200 investimenti sintetici.
- Aggiunti Playwright riproducibile a 1080 px per IT/EN, chiaro/scuro, focus e overflow, smoke dell’eseguibile unpacked nei workflow release, controllo del perimetro `asar`/packaging e pin SHA delle GitHub Actions.
- L’audit M6 ha rilevato la vulnerabilità high di `shell-quote 1.8.4` nella toolchain `concurrently`: risolta con override compatibile `>=1.10.0`. Gli script npm sono ora negati salvo allowlist versionata per i soli `esbuild@0.28.1` ed `electron-winstaller@5.4.0` necessari.
- Il percorso di avvio Electron con profilo QA separato supera lo smoke locale. Il packaging Windows locale resta bloccato prima della copia applicativa da un lock `EPERM` sulla rinomina dell’Electron appena estratto, riprodotto anche fuori sandbox; la verifica dei pacchetti effettivi resta quindi affidata alla CI macOS/Windows prima di promuovere `v0.9.0`.
- Gate locale M6 superato: lint, typecheck, build renderer/Electron, 48 test Vitest, Playwright Chromium, controllo documentale e `npm audit` con 0 vulnerabilità; i successivi gate CI e release hanno poi completato la verifica multipiattaforma riportata nei punti seguenti.
- PR M6 `#12` unita nel commit `8f0d663`; CI macOS/Windows verde sulla PR nel run `29820819987` e su `main` nel run `29821309419`. Manifest e lockfile sono sincronizzati a `0.9.0`; resta il solo gate del workflow release sul tag con artifact, smoke e checksum.
- Preparazione release unita con PR `#13` nel commit `3db6cbd`; CI finale verde su PR e `main`. Il tag annotato `v0.9.0` ha completato CI nel run `29822581872` e Release nel run `29822581930`: packaging e smoke degli eseguibili superati su macOS e Windows, sei artifact `0.9.0` pubblicati e digest riconciliati con `SHA256SUMS.txt`. M6 è completata; la release resta una preview privata non firmata.

## Avvio M7 — 2026-07-21

- Creato `milestone/07-release` dalla `main` pulita successiva a M6 e corrette le due descrizioni storiche che presentavano ancora come incompleti gate già superati da `v0.9.0`.
- Sincronizzati manifest e lockfile a `1.0.0`; aggiunti ispezione del contenuto effettivo di `app.asar` e delle risorse, installazione temporanea da DMG/NSIS, avvio smoke e rimozione automatica sui runner macOS/Windows.
- Aggiornati workflow, README, quick start, manuali IT/EN, mappa e modello di sicurezza per descrivere la release stabile e le procedure esplicite di installazione/disinstallazione; gli artifact restano privati e non firmati.

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
