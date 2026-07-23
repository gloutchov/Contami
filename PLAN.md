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
| M7 — Packaging e prima release | `milestone/07-release` | `1.0.0` | Completata; release stabile macOS/Windows verificata |
| M13 — Catalogo tasse configurabile | `milestone/13-configurable-taxes` | `1.1.0` | Completata; CI/release macOS e Windows verdi |
| M14 — Template Excel per importazione | `milestone/14-import-templates` | `1.2.0` | Completata e testata localmente; CI/release da verificare |
| M15 — Importazione guidata e atomica | `milestone/15-guided-import` | `1.3.0` | Pianificata |
| M9 — Hardening apertura workbook | `milestone/09-workbook-hardening` | `1.4.0` | Pianificata dopo M15 |
| M10 — Integrità e concorrenza dei salvataggi | `milestone/10-save-integrity` | `1.5.0` | Pianificata dopo M9 |
| M11 — CSP senza stili inline | `milestone/11-strict-csp` | `1.6.0` | Pianificata dopo M10 |

**Sequenza di promozione corrente:** `v0.2.0` preview storica → `v0.8.0` checkpoint funzionale → hardening `v0.9.0` → stabile `v1.0.0` → catalogo tasse `v1.1.0` → template Excel `v1.2.0` → importazione guidata `v1.3.0` → apertura workbook `v1.4.0` → integrità salvataggi `v1.5.0` → CSP rigorosa `v1.6.0`.

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

## M9 — Hardening dell’apertura dei workbook

**Obiettivo:** respingere file `.xlsx` con espansione ZIP o struttura ostile prima che il parser possa consumare quantità eccessive di memoria o tempo.

**Attività pianificate**

- Introdurre un preflight ZIP isolato dall’adapter Excel che controlli numero di entry, dimensione totale e per-entry non compressa, rapporto di compressione, duplicati e percorsi anomali prima del parsing del workbook.
- Definire limiti espliciti, centralizzati e documentati, con errori sicuri che non espongano percorsi completi o contenuti finanziari.
- Conservare i limiti di schema e collezione già applicati dopo l’apertura, evitando che il preflight sostituisca la validazione del dominio.
- Valutare l’esecuzione del parsing in un worker/processo terminabile con budget di tempo e memoria, se il solo preflight non offre un confine sufficiente sulle piattaforme supportate.
- Aggiungere corpus e generatori esclusivamente sintetici per workbook troncati, archivi annidati, rapporti di compressione estremi, entry duplicate e metadati incoerenti.

**Criteri di accettazione**

- I workbook ContaMì validi e i file v1/v2 migrabili continuano ad aprirsi senza regressioni su macOS e Windows.
- I casi ostili noti vengono rifiutati prima del caricamento completo, entro budget riproducibili di tempo e memoria.
- Nessun workbook privato entra in fixture, log, Git, CI o artifact.

**Test richiesti:** unit test del preflight, fuzz/property test con seed riproducibili, integrazione con l’adapter, regressione round-trip/migrazioni, file troncati e zip bomb sintetiche, budget di risorse in CI.

**Documentazione:** limiti workbook, messaggi di recupero, SECURITY_MODEL, MAP e note di rilascio.

## M10 — Integrità e concorrenza dei salvataggi

**Obiettivo:** ridurre ulteriormente il rischio di sovrascrivere modifiche esterne o concorrenti, senza compromettere backup, rollback e compatibilità con Excel/Numbers.

**Attività pianificate**

- Affiancare a dimensione e timestamp un hash crittografico del contenuto acquisito dopo apertura e dopo ogni salvataggio verificato.
- Ricontrollare l’impronta immediatamente prima della sostituzione atomica e bloccare il salvataggio quando la copia su disco non corrisponde alla revisione caricata.
- Introdurre un lock cooperativo con identità non sensibile, lease/scadenza e recupero guidato dei lock obsoleti; non assumere che applicazioni esterne rispettino il lock.
- Definire in modo deterministico i casi di crash, doppia istanza, file spostato, filesystem senza primitive attese e modifica durante la finestra tra verifica e rename.
- Mantenere copie recuperabili e richiedere conferma prima di ogni eventuale recupero distruttivo.

**Criteri di accettazione**

- Una modifica esterna viene rilevata anche quando dimensione e timestamp non cambiano.
- Due istanze o due salvataggi sovrapposti non producono una perdita silenziosa di dati.
- Lock obsoleti e crash hanno un percorso di recupero documentato e testato; l’ultima copia valida resta recuperabile.

**Test richiesti:** hash e revision guard, gare controllate tra writer, lock attivo/obsoleto, crash recovery, modifica con stesso timestamp/dimensione, filesystem macOS/Windows, backup e rollback.

**Documentazione:** flussi di conflitto e recupero IT/EN, SECURITY_MODEL, MAP e note di rilascio.

## M11 — CSP senza stili inline

**Obiettivo:** rimuovere `style-src 'unsafe-inline'` dalla Content Security Policy del renderer senza regressioni visive o di accessibilità.

**Attività pianificate**

- Inventariare attributi `style`, stili React dinamici e dipendenze che iniettano CSS nel renderer.
- Migrare gli stili applicativi verso classi e fogli locali; sostituire le varianti dinamiche con un insieme limitato e validato di classi o attributi sicuri.
- Definire una CSP di produzione che neghi gli stili inline e mantenere separata la sola eccezione strettamente necessaria allo sviluppo locale.
- Aggiungere controlli automatici che falliscano in presenza di nuove violazioni o di un allargamento non autorizzato della policy.

**Criteri di accettazione**

- La build pacchettizzata funziona con stili inline negati e senza errori CSP.
- Tutte le viste restano leggibili in IT/EN, chiaro/scuro e a 1080 px, inclusi grafici, modali, focus e stati vuoti/errore/disabilitato.
- Il renderer non acquisisce nuove capacità di rete, script o contenuto attivo.

**Test richiesti:** unit/integration test per le varianti dinamiche, verifica CSP in build, Playwright IT/EN e chiaro/scuro, focus tastiera, screenshot/overflow e smoke Electron pacchettizzato.

**Documentazione:** SECURITY_MODEL, MAP, manuali se cambia la resa visibile e note di rilascio.

## M13 — Catalogo tasse configurabile

**Obiettivo:** sostituire le tasse immobiliari codificate nell’app con un catalogo modificabile dall’utente, mantenendo integre le registrazioni storiche e i collegamenti con Transazioni e Spese condivise.

**Attività pianificate**

- Introdurre nel dominio un’entità `TaxType` con UUID stabile, nome, ambito di applicazione (residenza, immobile locato o entrambi), stato attivo/archiviato e configurazione opzionale delle rate; limiti e unicità sono validati centralmente.
- Migrare lo schema workbook dalla v3 alla v4 aggiungendo il catalogo tasse e il riferimento `taxTypeId` nelle registrazioni immobiliari. La migrazione crea le voci iniziali Canone TV, IMU e TARI e riconcilia deterministicamente i precedenti `detailKind` senza perdere dati.
- Rimuovere dal dominio e dai moduli immobiliari le scelte fiscali hardcoded; i selettori usano soltanto tasse attive provenienti dal catalogo del workbook.
- Aggiungere in Impostazioni una sezione bilingue **Tasse / Taxes** con creazione, modifica, archiviazione/riattivazione, conteggio utilizzi e cancellazione definitiva con conferma quando la voce non è referenziata.
- Per una tassa già usata, impedire riferimenti orfani: può essere archiviata affinché non sia più proposta, mentre la cancellazione definitiva resta disponibile soltanto per voci mai utilizzate.
- Generalizzare la gestione delle rate senza assumere che ogni tassa abbia soltanto pagamento unico, prima rata o seconda rata; conservare comunque la lettura e la resa delle registrazioni esistenti.
- Mantenere atomica la creazione o modifica di una tassa immobiliare, della Transazione collegata e dell’eventuale Spesa condivisa, senza duplicare importi nei consuntivi.
- Conservare il catalogo nel workbook autorevole, non nel file locale `settings.json`, affinché tasse e registrazioni restino portabili insieme tra macOS, Windows, Excel e Numbers.

**Criteri di accettazione**

- L’utente può aggiungere, rinominare, archiviare, riattivare e rimuovere in sicurezza le tasse dalla Configurazione senza modificare codice o file manualmente.
- I nuovi inserimenti immobiliari mostrano immediatamente il catalogo aggiornato; una tassa archiviata non è più selezionabile ma resta leggibile nello storico.
- I workbook v1, v2 e v3 continuano ad aprirsi e vengono salvati in v4 soltanto dopo migrazione, validazione completa e backup.
- Modifica e cancellazione non producono riferimenti orfani, non alterano gli importi storici e non interrompono i collegamenti bidirezionali.
- La sezione è accessibile da tastiera, leggibile in IT/EN, tema chiaro/scuro e a larghezza minima 1080 px.

**Test richiesti:** unit test CRUD, unicità, limiti, conteggio utilizzi e archiviazione; migrazione v1/v2/v3→v4; round-trip workbook; collegamenti tassa/Transazione/Spesa condivisa; rollover; errori `ENTITY_IN_USE`; e2e Impostazioni e inserimento immobile in IT/EN e chiaro/scuro.

**Documentazione:** schema workbook, manuali IT/EN, README, MAP, SECURITY_MODEL, messaggi di migrazione e note di rilascio.

## M14 — Template Excel per importazione da sistemi precedenti

**Obiettivo:** permettere all’utente di generare da Impostazioni file `.xlsx` autoesplicativi e conformi ai contratti di importazione di ContaMì, uno per ciascuna area gestita.

**Dipendenza:** M13 deve essere completata affinché i template immobiliari possano usare anche il catalogo tasse configurabile.

**Attività pianificate**

- Definire e versionare contratti di importazione distinti per: immobile di residenza, immobili in affitto, transazioni, investimenti, fondo pensione, spese condivise, spese ricorrenti e automobile.
- Generare per ogni tipologia un file `.xlsx` separato con un solo foglio visibile di compilazione, intestazioni stabili, campi obbligatori evidenziati, formati di data/importo documentati e istruzioni sintetiche bilingui.
- Aggiungere fogli tecnici nascosti e protetti per versione del template, tipo di importazione e liste di convalida; non usare macro, collegamenti esterni, formule ottenute da testo utente o contenuto attivo.
- Predisporre menu a discesa Excel per valori chiusi ed enum, inclusi entrata/uscita/trasferimento, stato, frequenza, valuta, tipo di movimento, destinazione immobile e categorie applicabili.
- Quando esiste un workbook aperto, popolare le scelte con i cataloghi correnti validati — conti, categorie, metodi di pagamento, tipi di investimento e tasse — usando identificatori non ambigui. Senza workbook configurato, generare comunque il template con i valori di sistema disponibili e indicare quali riferimenti dovranno essere risolti all’importazione.
- Rappresentare in modo esplicito relazioni e gerarchie tramite chiavi esterne definite dall’utente, ad esempio immobile/registrazioni, investimento/movimenti, pensione/comparti e automobile/costi, senza richiedere UUID ContaMì preesistenti.
- Aggiungere in Impostazioni una sezione **Importazione dati / Data import** con otto azioni di generazione, dialogo nativo di salvataggio e conferma del percorso tramite solo nome file, senza esporre percorsi arbitrari al renderer.
- Mantenere il generatore separato dal repository del workbook autorevole: produce soltanto modelli vuoti e non modifica il file finanziario attivo.

**Criteri di accettazione**

- Dalla Configurazione è possibile generare ciascuno degli otto template anche senza dati personali o connessione di rete.
- Ogni file si apre correttamente in Excel su macOS/Windows e, per quanto supportato, in LibreOffice e Numbers; intestazioni, formati e menu a discesa restano utilizzabili.
- I template contengono tutti i campi necessari al relativo import, distinguono obbligatori e opzionali e includono una versione verificabile dalla futura procedura di importazione.
- I valori selezionabili corrispondono ai cataloghi del workbook al momento della generazione e valori duplicati o ambigui vengono impediti o identificati in modo stabile.
- Template, fixture e documentazione usano esclusivamente dati vuoti o sintetici e non incorporano contenuti del workbook personale.

**Test richiesti:** snapshot strutturali e round-trip Excel per tutti gli otto tipi, convalide dati e menu a discesa, metadati/versione, cataloghi vuoti e popolati, caratteri IT/EN, date e numeri locali, apertura indipendente con Excel/LibreOffice/Numbers dove disponibile, controllo assenza macro/formule/link esterni e test IPC/dialoghi.

**Documentazione:** specifica versionata delle colonne per ciascun template, esempi esclusivamente sintetici, manuali IT/EN, README, MAP, SECURITY_MODEL e note di rilascio.

## M15 — Importazione guidata, validata e atomica

**Obiettivo:** importare automaticamente i template compilati con anteprima, diagnostica per riga e conferma esplicita, senza lasciare il workbook in uno stato parziale o incoerente.

**Dipendenze:** M13 per il catalogo tasse e M14 per i contratti/template versionati. Il preflight limitato introdotto per i file di importazione sarà riusato ed esteso da M9 quando verrà applicato anche ai workbook autorevoli.

**Attività pianificate**

- Aggiungere per ciascuno degli otto tipi un parser isolato dal dominio che accetta soltanto template supportati, legge valori passivi e valida versione, intestazioni, tipi, limiti, enum, riferimenti e relazioni prima di costruire comandi di dominio.
- Rifiutare macro, collegamenti esterni, formule, fogli inattesi e contenuto attivo; applicare gli stessi limiti preventivi e di schema previsti per l’apertura dei workbook, con errori redatti.
- Presentare un’anteprima senza scritture con numero di righe valide, scartate e in conflitto, più errori localizzati per foglio/riga/colonna e istruzioni correggibili.
- Risolvere cataloghi e chiavi esterne in modo deterministico; valori mancanti, duplicati o ambigui richiedono correzione o mappatura esplicita e non vengono indovinati.
- Definire strategie esplicite per duplicati e record esistenti — ignora, crea nuovo o aggiorna quando l’identità è certa — mostrando l’effetto prima della conferma.
- Convertire l’intero import valido in un’unica trasformazione atomica di `FinanceData`, riusando comandi e regole del dominio per creare collegamenti bidirezionali e impedire doppio conteggio.
- Prima della sostituzione creare backup e verificare la revisione del workbook; in caso di errore nessuna riga viene applicata e l’ultima copia valida resta attiva.
- Mostrare un riepilogo finale riconciliabile per entità create, aggiornate, ignorate e importi principali, senza scrivere dati finanziari nei log.

**Criteri di accettazione**

- Un template valido di ciascuna tipologia può essere importato da Impostazioni e produce gli stessi dati che si otterrebbero tramite inserimenti manuali equivalenti.
- Nessun dato viene scritto prima dell’anteprima e della conferma; annullamento, errore o conflitto lasciano invariato il workbook.
- Righe non valide, riferimenti mancanti e duplicati sono indicati con posizione e motivo, senza importazioni parziali silenziose.
- Le registrazioni collegate compaiono una sola volta nei consuntivi e rispettano liquidità, entrate/uscite, quote condivise, gerarchie pensione/comparti e storico dei beni.
- L’importazione funziona in IT/EN, chiaro/scuro, a 1080 px e con sola tastiera, mantenendo rete bloccata e renderer privo di accesso al filesystem.

**Test richiesti:** import end-to-end sintetico per tutti gli otto tipi; equivalenza con comandi manuali; template vecchio/nuovo o errato; righe duplicate e riferimenti ambigui; formule/macro/link esterni; limiti di dimensione e cardinalità; anteprima/annullamento/conferma; atomicità, backup, rollback e conflitto esterno; round-trip con rollover; Playwright IT/EN e chiaro/scuro.

**Documentazione:** guida di compilazione e importazione IT/EN, matrice errori e recupero, contratti dei template, README, MAP, SECURITY_MODEL, modello di minaccia e note di rilascio.

## Decisione futura — Cifratura portabile

La precedente M12 non fa più parte della sequenza di sviluppo né ha una versione assegnata. ContaMì non implementerà ora una cifratura applicativa: workbook, temporanei e backup restano interoperabili e protetti tramite permessi del filesystem, FileVault/BitLocker, blocco della sessione e backup adeguati.

La decisione potrà essere rivalutata in futuro soltanto se esisterà una soluzione standard, manutenibile e verificabile che conservi apertura diretta, modifica, salvataggio, importazione Numbers e recupero con Excel e Numbers su macOS e Windows. Non saranno accettati contenitori proprietari, dipendenze cloud, chiavi in preferenze o log, né soluzioni che rendano il recupero meno affidabile.

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

## Avvio e chiusura M7 — 2026-07-21

- Creato `milestone/07-release` dalla `main` pulita successiva a M6 e corrette le due descrizioni storiche che presentavano ancora come incompleti gate già superati da `v0.9.0`.
- Sincronizzati manifest e lockfile a `1.0.0`; aggiunti ispezione del contenuto effettivo di `app.asar` e delle risorse, installazione temporanea da DMG/NSIS, avvio smoke e rimozione automatica sui runner macOS/Windows.
- Aggiornati workflow, README, quick start, manuali IT/EN, mappa e modello di sicurezza per descrivere la release stabile e le procedure esplicite di installazione/disinstallazione; gli artifact restano privati e non firmati.
- Gate locali superati: preflight con 48 test, Playwright IT/EN e chiaro/scuro a 1080 px, controllo documentale, audit con 0 vulnerabilità, packaging Windows, ispezione `app.asar`, smoke unpacked e ciclo NSIS di installazione/avvio/rimozione.
- PR M7 `#15` unita nel commit `956c826`; CI macOS/Windows verde sulla PR nel run `29832816551` e su `main` nel run `29834535669`. La release candidate manuale `29834862508` ha verificato i pacchetti installati su entrambi i sistemi senza eseguire il job di pubblicazione.
- Il tag annotato `v1.0.0` ha completato CI nel run `29837197589` e Release nel run `29837197402`: packaging, ispezione, smoke unpacked e installato superati su macOS e Windows; sei artifact stabili pubblicati e tutti i digest riconciliati con `SHA256SUMS.txt`. La release privata resta deliberatamente non firmata, come documentato.

## Revisione roadmap — 2026-07-21

- Rimossa la precedente M9 dedicata a dati web, quotazioni immobiliari e mercati ISIN perché non più richiesta; ContaMì resta interamente local-first e continua a bloccare la rete.
- Pianificati hardening dell’apertura workbook (M9), integrità e concorrenza dei salvataggi (M10), CSP senza stili inline (M11) e un gate di fattibilità per la cifratura portabile (M12).
- Firma, notarizzazione e Authenticode restano fuori dalle milestone finché non saranno disponibili le relative credenziali.

## Estensione roadmap — 2026-07-23

- Priorità aggiornata su richiesta del proprietario: M13, M14 e M15 precedono M9, M10 e M11, così template e importazione possono essere collaudati prima sui dati storici locali.
- Avviata M13 per sostituire Canone TV, IMU e TARI hardcoded con un catalogo tasse configurabile, portabile nel workbook e migrato senza perdita dello storico.
- Pianificata M14 per generare da Impostazioni otto template Excel versionati, con colonne guidate e menu a discesa alimentati dai cataloghi disponibili.
- Pianificata M15 per importare i template con preflight, anteprima, diagnostica per riga, gestione esplicita dei duplicati e applicazione atomica con backup e rollback.
- La precedente M12 è stata rimossa dalla sequenza e riclassificata come decisione futura senza implementazione o versione assegnata.
- Le nuove funzioni restano interamente locali: non introducono rete, telemetria, servizi cloud, macro o uso di dati personali in test e documentazione.

## Avvio e chiusura M13 — 2026-07-23

- Creato il branch `milestone/13-configurable-taxes` e portato manifest e lockfile a `1.1.0`; la milestone è stata integrata in `main`, taggata e pubblicata dopo la verifica multipiattaforma.
- Introdotto nel dominio il catalogo `TaxType` con UUID stabile, nome univoco senza distinzione tra maiuscole e minuscole, ambito residenza/locazione/entrambi, da 1 a 24 rate e stato attivo/archiviato.
- Migrato il workbook allo schema v4 con il foglio `Tax Types`; le migrazioni v1, v2 e v3 creano Canone TV, IMU e TARI e trasformano deterministicamente le precedenti tasse hardcoded in riferimenti `taxTypeId` e numeri di rata.
- Aggiunto in Impostazioni il CRUD bilingue delle tasse con conteggio utilizzi: una tassa inutilizzata può essere eliminata previa conferma, mentre una tassa già referenziata può soltanto essere archiviata e resta disponibile nello storico.
- I moduli immobiliari propongono soltanto tasse attive e compatibili con il tipo di immobile, rispettano il numero di rate configurato e continuano a collegare atomicamente Transazioni e Spese condivise; rollover e round-trip preservano l’intero catalogo.
- Aggiornati README, manuali IT/EN, MAP e SECURITY_MODEL; tutti i test e la documentazione usano esclusivamente dati sintetici.
- Gate locale M13 superato: lint, typecheck, build renderer/Electron, 54 test Vitest, Playwright Chromium a 1080 px con creazione e uso della tassa in IT/scuro e verifica EN/chiaro, controllo documentale e `npm audit` con 0 vulnerabilità. Durante il gate `fast-uri` è stato aggiornato transitivamente dalla 3.1.3 alla 3.1.4 per correggere l’avviso high dell’audit.
- Commit M13 `9a0abab`; CI del branch verde nel run `29996313238`, CI dei push `main` e tag verdi nei run `29996589713` e `29996589833`. Il tag annotato `v1.1.0` ha completato la Release nel run `29996589794`: packaging, ispezione e smoke installato superati su macOS e Windows, sei artifact applicativi pubblicati e checksum raccolti in `SHA256SUMS.txt`. Il branch M13 è stato rimosso localmente e dal remoto dopo merge e CI.

## Avvio e chiusura locale M14 — 2026-07-23

- Creato il branch `milestone/14-import-templates` e portati manifest, lockfile e documentazione applicativa a `1.2.0`.
- Definiti otto contratti di importazione v1 con intestazioni `snake_case`, campi obbligatori/condizionali/opzionali, chiavi gerarchiche scelte dall’utente e liste chiuse bilingui per residenza, immobili in affitto, transazioni, investimenti, fondo pensione, spese condivise, ricorrenze e automobile.
- Aggiunto un generatore Excel isolato dal workbook autorevole: produce un foglio dati visibile e due fogli tecnici `veryHidden` protetti, fino a 5.000 righe, date e numeri tipizzati, convalide tramite intervalli denominati, metadati verificabili e nessuna formula di cella, macro o link esterno. I cataloghi attivi sono incorporati con UUID soltanto quando provengono da un workbook configurato.
- Integrati dialogo nativo, servizio main, IPC/preload minimo e sezione bilingue **Importazione dati / Data import** in Impostazioni; al renderer tornano solo annullamento e nome file, mai il percorso completo.
- Pubblicata la specifica [docs/import-template-spec.md](docs/import-template-spec.md) e aggiornati manuali IT/EN, README, MAP e SECURITY_MODEL usando esclusivamente dati vuoti o sintetici.
- Gate locale M14 superato: preflight completo con lint, typecheck, build renderer/Electron e 63 test Vitest; Playwright Chromium in IT/scuro e EN/chiaro a 1080 px; controllo documentale; `npm audit` con 0 vulnerabilità. Gli otto file hanno superato round-trip ExcelJS, metadati, protezioni, menu, cataloghi vuoti/popolati, assenza di formule/link e il test produttivo da 5.000 righe.
- Excel desktop, LibreOffice e Numbers non sono installati o disponibili in questa sessione Windows: l’apertura visiva indipendente dei template resta quindi un gate manuale/CI da eseguire sulle piattaforme in cui tali applicazioni sono disponibili. Commit, push, CI multipiattaforma, tag e release costituiscono i successivi passi di pubblicazione.
- Pubblicazione M14 completata: commit funzionale `8084861`, PR `#17` e merge commit `a517d10`; CI verde sul branch (`30000488158`), sulla PR dopo il rerun di un errore transitorio dell’endpoint npm audit (`30005793095`), su `main` (`30006137711`) e sul tag (`30006488191`). Il tag annotato `v1.2.0` ha completato la Release nel run `30006488140`: packaging, ispezione e smoke installato superati su macOS e Windows, sei artifact applicativi pubblicati e checksum raccolti in `SHA256SUMS.txt`.

## Rischi e mitigazioni iniziali

| Rischio | Mitigazione |
|---|---|
| Il formato `.numbers` non è documentato né scrivibile nativamente su Windows | Adapter macOS isolato + `.xlsx` interoperabile e sempre recuperabile |
| Corruzione o conflitto durante il salvataggio | Scrittura temporanea, validazione, sostituzione atomica, backup e lock/version check |
| Errori nei KPI finanziari | Logica pura testata, dataset golden, totali di controllo e drill-down alle righe origine |
| Esposizione di dati personali | Local-first, zero telemetria, log redatti, dati di esempio sintetici, esclusioni packaging/Git |
| File modificato contemporaneamente in Excel/Numbers | Rilevamento impronta/mtime e blocco del salvataggio con scelta guidata |
| Importazione parziale, duplicata o riferita a cataloghi ambigui | Template versionati, anteprima obbligatoria, mappatura esplicita, trasformazione atomica, backup e rollback |
| Build non firmate | Nessuna falsa promessa; avvisi documentati e workflow pronto per credenziali future |

## Criterio di completamento del progetto

Il criterio di completamento è soddisfatto dalla release privata `v1.0.0`: include applicazioni installabili e verificate per macOS e Windows, le funzioni richieste sono coperte da test proporzionati al rischio, il workbook resta leggibile fuori dall’app, la chiusura annuale è riconciliata, i documenti obbligatori sono aggiornati e la CI è verde.
