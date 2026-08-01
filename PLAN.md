# ContaMì — Piano di sviluppo / Development plan

Questo documento governa lo sviluppo di ContaMì. Va aggiornato alla chiusura di ogni milestone. Il progetto procede in autonomia tra le milestone; sono richieste conferme soltanto per operazioni che richiedono credenziali, autorizzazioni del sistema operativo o altre azioni sensibili non già autorizzate.

## Visione del prodotto

ContaMì è un’app desktop bilingue (italiano/inglese) per macOS e Windows che rende semplice registrare e comprendere finanze personali complesse mantenendo un foglio di calcolo leggibile e archiviabile come fonte dati durevole. L’interfaccia è organizzata per viste — quadro generale, transazioni, immobili, trasporti, investimenti, pensione integrativa, ricorrenze e spese condivise — con dashboard e inserimenti guidati.

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
| M14 — Template Excel per importazione | `milestone/14-import-templates` | `1.2.0` | Rilasciata |
| M15 — Importazione guidata e atomica | `milestone/15-guided-import` | `1.3.0` | Rilasciata; CI/release macOS e Windows verdi |
| Patch residenza e storico immobili | `patch/1.3.1-residence-property-history` | `1.3.1` | Rilasciata; CI/release macOS e Windows verdi |
| Patch grafici, menu e integrità UUID | `patch/1.3.2-property-charts-app-menu` | `1.3.2` | Rilasciata; CI/release macOS e Windows verdi |
| Patch limiti e chiusura rate | `patch/1.3.3-installment-limits` | `1.3.3` | Rilasciata; CI/release macOS e Windows verdi |
| M17 — Filtri e azioni nelle viste di dettaglio | `milestone/17-detail-filters` | `1.4.0` | Rilasciata; CI/release macOS e Windows verdi |
| M18 — Movimenti di investimenti e pensioni nelle Transazioni | `milestone/18-investment-transaction-sync` | `1.5.0` | Completata e rilasciata |
| Patch conti e flussi di cassa investimenti | `patch/1.5.1-investment-cash-accounts` | `1.5.1` | Completata localmente; gate verde e workbook privato migrato |
| M20 — Casse, trasferimenti interni e indicatori di perdita | `milestone/20-cash-registers` | `1.6.0` | Rilasciata; CI/release macOS e Windows verdi |
| M21 — Competenza e incasso delle rate di affitto | `milestone/21-rent-payment-allocation` | `1.7.0` | Completata localmente; gate verde e workbook privato corretto |
| M19 — Cambio tariffa delle ricorrenze | `milestone/19-recurring-rate-changes` | `1.8.0` | Ripianificata dopo M21 |
| M16 — Trasporti e collegamento dei pagamenti rateali | `milestone/16-transport-improvements` | `1.9.0` | Ripianificata dopo M19 |
| M9 — Hardening apertura workbook | `milestone/09-workbook-hardening` | `1.10.0` | Pianificata dopo M16 |
| M10 — Integrità e concorrenza dei salvataggi | `milestone/10-save-integrity` | `1.11.0` | Pianificata dopo M9 |
| M11 — CSP senza stili inline | `milestone/11-strict-csp` | `1.12.0` | Pianificata dopo M10 |

**Sequenza di promozione corrente:** `v0.2.0` preview storica → `v0.8.0` checkpoint funzionale → hardening `v0.9.0` → stabile `v1.0.0` → catalogo tasse `v1.1.0` → template Excel `v1.2.0` → importazione guidata `v1.3.0` → patch residenza/storico immobili `v1.3.1` → patch grafici immobili/menu release `v1.3.2` → patch limiti rate `v1.3.3` → filtri e azioni di dettaglio `v1.4.0` → sincronizzazione patrimoniale `v1.5.0` → correzione conti/flussi di cassa `v1.5.1` → casse e trasferimenti interni `v1.6.0` → competenza/incasso affitti `v1.7.0` → cambio tariffa `v1.8.0` → trasporti `v1.9.0` → apertura workbook `v1.10.0` → integrità salvataggi `v1.11.0` → CSP rigorosa `v1.12.0`.

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

**Esito implementazione:** completati preflight ZIP limitato, parser per gli otto contratti v1, riferimenti deterministici, tre strategie esplicite per le corrispondenze esatte, anteprima senza scritture con errori riga/colonna e piano opaco mantenuto nel main. La conferma applica una sola trasformazione `FinanceData` tramite comandi di dominio e un solo salvataggio verificato con revisione, backup e rollback; annullamento ed errore non modificano il workbook. Formule, macro, link esterni, oggetti incorporati, fogli o intestazioni inattesi, archivi cifrati/anomali e limiti superati vengono rifiutati prima della scrittura.

## M17 — Filtri e azioni nelle viste di dettaglio

**Obiettivo:** rendere omogenea e più rapida la consultazione delle registrazioni nelle modali di dettaglio e portare l’aggiornamento del valore degli investimenti nel punto in cui l’utente consulta la singola posizione.

**Attività pianificate**

- Aggiungere nella sezione Spese comuni della vista Immobili un filtro testuale per descrizione e un filtro per mese con tutti i dodici mesi e l’opzione per mostrare l’intero anno.
- Aggiungere in Transazioni un pulsante **Azzera filtri / Reset filters** che ripristini insieme descrizione, tipo, categoria, metodo di pagamento e mese.
- Aggiungere nelle modali delle singole automobili i filtri combinabili per descrizione e mese.
- Aggiungere nelle modali dei singoli investimenti i filtri combinabili per descrizione e mese.
- Aggiungere nelle modali dei comparti di Pensione Integrativa i filtri combinabili per descrizione e mese; i raccoglitori pensione continuano ad aggregare i comparti senza duplicarne i movimenti.
- Aggiungere in Spese condivise il filtro per descrizione accanto al filtro per mese già esistente.
- Applicare in tutte le viste la stessa semantica: ricerca testuale senza distinzione tra maiuscole e minuscole, selezione esplicita di tutti i mesi, combinazione dei criteri, reset prevedibile e stato vuoto dedicato quando nessuna registrazione corrisponde.
- Ricalcolare elenchi, conteggi, parziali e totali visibili sul solo insieme filtrato, senza alterare i dati autorevoli o i totali finanziari non filtrati.
- Aggiungere nella modale del singolo investimento il pulsante bilingue **Aggiorna valore / Update value** accanto a **Modifica investimento / Edit investment**, riusando lo stesso comando, la stessa validazione e lo stesso flusso di salvataggio verificato dell’azione già disponibile nella vista principale.
- Conservare leggibilità, ordine del focus e layout in IT/EN, tema chiaro/scuro e alla larghezza minima di 1080 px, inclusi reset, stato disabilitato e assenza di risultati.

**Criteri di accettazione**

- Ogni area prevista filtra correttamente per descrizione, per uno dei dodici mesi o per entrambi i criteri e ripristina l’elenco completo tramite reset; Transazioni azzera in una sola azione tutti e cinque i propri criteri.
- Spese comuni, automobili, investimenti, comparti pensione e Spese condivise mostrano risultati, parziali e stati vuoti coerenti con i filtri attivi.
- **Aggiorna valore** è raggiungibile dalla modale dell’investimento, registra una valutazione tramite il flusso esistente e aggiorna immediatamente controvalore, grafico e riepiloghi senza creare movimenti economici impropri.
- I controlli sono accessibili da tastiera, tradotti e privi di overflow nelle combinazioni IT/EN e chiaro/scuro a 1080 px.

**Test richiesti:** unit test delle funzioni di filtro e dei parziali; test renderer delle cinque aree; regressione dell’aggiornamento valore; Playwright con filtri singoli/combinati/reset, assenza di risultati, focus tastiera e azione **Aggiorna valore** in IT/EN e chiaro/scuro.

**Documentazione:** manuali IT/EN, README se cambia la descrizione delle funzioni e MAP soltanto se vengono introdotti nuovi moduli.

**Esito 2026-07-30:** implementati filtri condivisi e combinabili per descrizione/mese con reset, stato vuoto e parziali coerenti nelle Spese comuni degli immobili, nelle modali di automobili, investimenti e comparti pensione e nelle Spese condivise; in Transazioni **Azzera filtri** ripristina insieme descrizione, tipo, categoria, metodo di pagamento e mese. **Aggiorna valore** è disponibile accanto a **Modifica investimento** nelle modali delle posizioni finali e riusa il flusso di valutazione esistente. Versione applicativa portata a `1.4.0`; aggiornati dizionari IT/EN, demo e test esclusivamente sintetici, README, manuali, MAP e intestazione del modello di sicurezza. La milestone è stata implementata nel commit `9a5b22a` e integrata in `main` dal merge commit `17daf7b`. Gate locale verde: lint, typecheck, 96 test Vitest, build renderer/Electron, controllo documentale, `npm audit` con 0 vulnerabilità e Playwright IT/EN chiaro/scuro a 1080 px con filtri singoli/combinati/reset, stato senza risultati, focus e assenza di overflow. CI verdi sul branch (`30545824846`), su `main` (`30546815701`) e sul tag `v1.4.0` (`30547431560`). Il workflow Release `30547431211` ha completato packaging, ispezione, smoke installato e pubblicazione per macOS ARM64/x64 e Windows x64; gli asset includono DMG, ZIP, installer Windows e `SHA256SUMS.txt`. Il browser integrato non era disponibile nella sessione; il collaudo visuale automatizzato e geometrico Playwright è stato completato.

## M18 — Movimenti di investimenti e pensioni nelle Transazioni

**Obiettivo:** garantire che ogni Versamento o Liquidazione confermato, una tantum o derivato da una ricorrenza, sia rappresentato anche nelle Transazioni tramite un solo collegamento autorevole e senza alterare impropriamente i consuntivi di entrate e uscite.

**Attività pianificate**

- Verificare separatamente i flussi di Versamento e Liquidazione per investimenti ordinari, comparti di Pensione Integrativa, movimenti una tantum e movimenti generati o confermati da piani periodici.
- Correggere il dominio affinché un Versamento crei o aggiorni una Transazione collegata con effetto di cassa `outflow` e una Liquidazione con effetto `inflow`; entrambi restano trasferimenti patrimoniali esclusi dai consuntivi di entrate/uscite correnti.
- Mantenere bidirezionali creazione, modifica, conferma, chiusura e cancellazione: importo, data, descrizione, conto e collegamenti devono restare coerenti senza duplicare il movimento.
- Assicurare che la conferma di una Transazione pianificata da una ricorrenza produca o aggiorni il movimento dell’investimento o del comparto corretto e non una seconda Transazione.
- Verificare il versamento iniziale, i movimenti successivi e le liquidazioni parziali o totali, preservando il calcolo cronologico di cifra investita e controvalore.
- Introdurre una riconciliazione idempotente e coperta da backup per i workbook esistenti che contengono movimenti confermati privi della Transazione collegata; i casi ambigui devono essere segnalati e lasciati invariati, mai indovinati.
- Conservare lo schema v5 se i collegamenti esistenti sono sufficienti; qualunque migrazione o nuovo campo necessario deve essere versionato, validato e documentato prima del salvataggio.

**Criteri di accettazione**

- Ogni nuovo Versamento o Liquidazione di un investimento o comparto compare una sola volta nelle Transazioni e nella relativa vista patrimoniale.
- Movimenti una tantum e periodici seguono la stessa regola; conferma, modifica o cancellazione da una vista mantengono coerente l’altra.
- Liquidità e saldo del conto riflettono correttamente `outflow` e `inflow`, mentre entrate e uscite correnti non vengono gonfiate.
- La riconciliazione dei dati esistenti non modifica importi, date o descrizioni, non crea duplicati ed è ripetibile senza ulteriori scritture.
- Rollover, importazione e round-trip workbook preservano collegamenti e storico.

**Test richiesti:** unit test di dominio per tutte le combinazioni investimento/comparto, Versamento/Liquidazione e una tantum/periodico; test di sincronizzazione bidirezionale, idempotenza e casi ambigui; integration test workbook, backup e round-trip; regressione KPI/liquidità/rollover/importazione; e2e dalle viste Investimenti, Pensione Integrativa, Ricorrenze e Transazioni.

**Documentazione:** manuali IT/EN, README, schema workbook se modificato, MAP e SECURITY_MODEL per ogni cambiamento a persistenza, migrazione o confini di salvataggio.

**Esito 2026-07-30:** implementata una trasformazione di dominio unica per le coppie movimento patrimoniale/Transazione, usata in entrambe le direzioni da investimenti ordinari e comparti pensione. Versamenti e Liquidazioni una tantum, iniziali, importati o derivati da ricorrenze sono trasferimenti con effetto di cassa `outflow`/`inflow`, restano esclusi dai consuntivi correnti e conservano UUID e collegamenti durante modifica, conferma e cancellazione. All’apertura dei workbook v5, una riconciliazione idempotente collega le corrispondenze esatte univoche, crea il solo record mancante, salva con verifica e backup e segnala senza modificare i casi ambigui; non è stata necessaria alcuna migrazione di schema. Versione applicativa portata a `1.5.0`; aggiornati demo sintetica, dizionari IT/EN, manuali, README, MAP, modello di sicurezza e test di dominio, importazione, workbook, rollover e Playwright. La milestone è stata implementata nel commit `a180618` e integrata in `main` dal merge commit `ad57bb0` tramite la PR `#29`. Gate locale verde: lint, typecheck, 109 test Vitest, build renderer/Electron, controllo documentale, `npm audit` con 0 vulnerabilità e Playwright IT/EN chiaro/scuro a 1080 px con verifica dei movimenti una tantum e periodici di investimenti e comparti nelle Transazioni. CI verdi sul branch (`30554793632`), sulla PR (`30554813762`), su `main` (`30555433619`) e sul tag `v1.5.0` (`30556082613`). Il workflow Release `30556082598` ha completato packaging, ispezione, smoke installato e pubblicazione per macOS ARM64/x64 e Windows x64; gli asset includono DMG, ZIP, installer Windows e `SHA256SUMS.txt`, i cui sei checksum corrispondono ai digest pubblicati.

## Patch `1.5.1` — Conti e flussi di cassa degli investimenti

**Obiettivo:** garantire che Versamenti e Liquidazioni incidano sempre sul conto interessato e sui totalizzatori di cassa, restando separati dai consuntivi di redditi e spese correnti.

**Attività**

- Portare il workbook allo schema v6 aggiungendo il conto ai movimenti e ai piani periodici di investimenti/comparti.
- Richiedere il conto nei moduli di Versamento, Liquidazione, versamento iniziale e contribuzione periodica, propagandolo alla Transazione e alla Ricorrenza collegate.
- Migrare i workbook v5 completando i riferimenti mancanti soltanto quando esiste un unico conto attivo; con più conti conservare il dato non assegnato senza indovinare.
- Mostrare in Transazioni Entrate di cassa, Uscite di cassa e saldo includendo i trasferimenti direzionati, mantenendo separati redditi e spese correnti nelle dashboard annuali.
- Includere i saldi iniziali nel saldo filtrato e nel saldo alla data odierna di Transazioni; ignorare nella liquidità e nel rollover i movimenti fuori dall’intervallo di apertura/chiusura del conto.
- Richiedere il conto per i nuovi movimenti di cassa; all’apertura completare i riferimenti storici soltanto quando il conto compatibile con la data è univoco e segnalare gli altri casi.
- Escludere ogni Transazione pianificata dalla liquidità corrente e dal saldo di apertura del rollover.
- Chiudere in modo idempotente i piani rateali attivi già arrivati a zero e mostrare, al passaggio del mouse o al focus sul KPI Rate residue, i piani ancora aperti con conteggio e prossima scadenza.
- Aggiornare con backup e rilettura la copia workbook privata usata per la verifica, senza inserirla in Git o nei test.

**Test richiesti:** migrazione v5→v6 con conto unico e casi non ambigui, propagazione bidirezionale una tantum/periodica, totalizzatori di cassa, saldo iniziale e confini temporali dei conti, riparazione conservativa dei conti mancanti e delle rate a zero, esclusione delle pianificazioni da liquidità e rollover, round-trip workbook, popup accessibile UI IT/EN chiaro/scuro e gate completo.

**Esito 2026-07-31:** implementato lo schema workbook v6 con conto sui movimenti e sui piani periodici di investimenti e comparti pensione. La migrazione v5 e la riparazione all’apertura completano i riferimenti soltanto quando il conto compatibile è univoco, mentre gli altri casi restano esplicitamente non assegnati e vengono segnalati. I trasferimenti direzionati partecipano ai totalizzatori Entrate/Uscite di cassa e alla liquidità del conto senza essere riclassificati come redditi o spese correnti; la liquidità e il rollover ignorano i movimenti fuori dall’intervallo di validità del conto e le pianificazioni. I saldi di Transazioni comprendono il saldo iniziale. I piani rateali attivi già a zero vengono chiusi all’apertura e il KPI Rate residue espone un dettaglio accessibile dei piani aperti. Aggiornati moduli, importazione, demo sintetica, manuali IT/EN, README, MAP e modello di sicurezza. La copia workbook privata è stata migrata con backup, rilettura strutturale e seconda apertura idempotente, senza inserirla in Git o nei test permanenti. Gate locale verde: lint, typecheck, 124 test Vitest, build renderer/Electron, controllo documentale, `npm audit` con 0 vulnerabilità e Playwright IT/EN chiaro/scuro a 1080 px.

## M20 — Casse, trasferimenti interni e indicatori di perdita

**Obiettivo:** distinguere il denaro contante dai saldi bancari mediante una o più Casse, rappresentare i prelievi come trasferimenti interni e rendere immediatamente visibili le posizioni di investimento o pensione in perdita.

**Attività pianificate**

- Riutilizzare il tipo conto `cash` come Cassa applicativa, separandone creazione, elenco e stato nella vista Impostazioni e consentendo più Casse personali, familiari o aziendali.
- Associare facoltativamente a ogni Cassa un conto di alimentazione predefinito, inteso come preferenza operativa e non come vincolo esclusivo; validare riferimenti, stato e valuta senza introdurre automatismi irreversibili.
- Portare il workbook allo schema v7 aggiungendo il conto destinazione ai trasferimenti interni e il conto di alimentazione alle Casse, con migrazione deterministica dei workbook v6 che non riclassifica né sposta movimenti storici in modo euristico.
- Rappresentare un prelievo o versamento di contante con una sola Transazione di trasferimento: uscita dal conto sorgente ed entrata nella Cassa destinazione, o percorso inverso, senza alterare la liquidità complessiva né i consuntivi di redditi e spese.
- Richiedere una Cassa per i nuovi movimenti con metodo di pagamento Contanti; quando ne esiste una sola può essere proposta automaticamente, mentre con più Casse la scelta resta esplicita.
- Rendere esplicito il conto o la Cassa interessati anche nei flussi collegati di Immobili, Trasporti e Spese condivise, preservando la sincronizzazione bidirezionale con le Transazioni.
- Mostrare in Impostazioni il saldo corrente di ciascun conto e Cassa, includendo saldi iniziali, movimenti ordinari, trasferimenti direzionati e trasferimenti interni; applicare la stessa semantica al rollover annuale.
- Mostrare in Panoramica il saldo complessivo delle Casse e dividere i KPI filtrati di Transazioni in due file da tre: Entrate, Uscite e Saldo per i conti, poi gli stessi valori per le Casse.
- Colorare in rosso il controvalore mostrato nei box delle viste Investimenti e Pensione Integrativa quando è inferiore al capitale netto investito, calcolato nel dominio e aggregato correttamente per collettori e comparti.
- Correggere fuori da Git la copia workbook privata indicata dal proprietario, associando alla Cassa unica i soli movimenti in contanti e trasformando gli eventuali prelievi riconoscibili in trasferimenti interni; creare prima una copia recuperabile, verificare rilettura e seconda apertura idempotente e non introdurre nell’app una migrazione automatica di questi dati storici.

**Criteri di accettazione**

- Un movimento in contanti modifica esclusivamente il saldo della Cassa selezionata e non quello del conto bancario associato.
- Un trasferimento conto→Cassa riduce e aumenta dello stesso importo i rispettivi saldi, lasciando invariata la liquidità totale; sorgente e destinazione sono distinte, attive nella data e nella stessa valuta.
- Più Casse possono essere create, chiuse, riaperte e collegate a conti di alimentazione differenti senza perdere lo storico o impedire trasferimenti legittimi da altri conti.
- Il saldo Cassa della Panoramica coincide con la quota di liquidità attribuita alle Casse; i sei KPI di Transazioni applicano gli stessi filtri ma non mescolano saldi iniziali o movimenti tra conti e Casse.
- Workbook v6 e v7 si aprono, migrano e completano il round-trip senza perdita di dati; i movimenti storici ambigui restano invariati e vengono segnalati.
- I valori in perdita sono rossi soltanto quando il controvalore è strettamente minore del capitale netto investito e restano leggibili in italiano/inglese, tema chiaro/scuro e larghezza minima 1080 px.
- La copia workbook privata corretta resta esclusa da Git, fixture, log e servizi remoti ed è accompagnata da backup locale e verifica strutturale.

**Test richiesti:** unit test per effetti sui saldi, KPI filtrati separati, trasferimenti interni, validazione Cassa/metodo, capitale netto e aggregazioni; integration test per migrazione v6→v7, collegamenti, filesystem, backup, rollover e round-trip workbook con soli dati sintetici; regressione importazione e movimenti investimenti/pensione; Playwright IT/EN, chiaro/scuro e 1080 px per creazione Cassa, movimento contante, prelievo, due file di KPI e indicatori di perdita.

**Documentazione:** manuali IT/EN, README, schema workbook, MAP, SECURITY_MODEL, messaggi di migrazione e note di rilascio.

**Esito applicativo 2026-08-01:** implementate Casse multiple separate dai conti, conto di alimentazione predefinito facoltativo, saldi individuali, compatibilità tra metodo di pagamento e conto/Cassa e trasferimenti interni sorgente→destinazione neutrali per la liquidità complessiva. Lo schema workbook è v7 con migrazione conservativa v1–v6; i template di importazione sono v2 e rendono espliciti conto/Cassa e destinazione. Immobili, automobile, ricorrenze, spese condivise, investimenti e comparti propagano il riferimento coerente alle Transazioni. La Panoramica espone il Saldo Cassa; Transazioni separa in due righe i flussi e i saldi filtrati di Conto e Cassa, escludendo dai saldi le righe non assegnate. I box di investimenti, comparti e raccoglitori pensione mostrano in rosso il controvalore inferiore al capitale netto investito. Verifica locale completata con lint, typecheck, 132 test Vitest, build renderer/Electron, controllo documentale, `npm audit` senza vulnerabilità e 3 test Playwright a 1080 px; il collaudo interattivo ha coperto IT/EN e chiaro/scuro, creazione Cassa, prelievo, spesa contanti, riepiloghi separati e indicatori di perdita senza overflow o errori console.

**Esito conversione privata 2026-08-01:** dopo autorizzazione esplicita del proprietario a usare l'adapter Excel locale di ContaMì come fallback, il workbook originale è rimasto intatto ed è stata prodotta una copia separata in schema v7, esclusa da Git. La conversione ha creato la Cassa unica associata all'unico conto bancario, assegnato alla Cassa i movimenti contanti e i relativi record collegati e trasformato soltanto i prelievi riconoscibili in trasferimenti interni. Nessun movimento mancante è stato inventato. Superati rilettura strutturale e seconda apertura idempotente, conservazione dei conteggi, controllo riferimenti e saldi, scansione degli errori formula e verifica visiva locale dei 20 fogli tramite Quick Look e Playwright; dati e anteprime private non sono entrati in fixture, Git o servizi remoti.

**Esito pubblicazione 2026-08-01:** commit `bc9359b` integrato con fast-forward in `main`; CI su `main` (`30704258252`) e sul tag `v1.6.0` (`30704420829`) verdi su macOS e Windows. Il workflow Release `30704420835` ha completato packaging, ispezione, smoke del pacchetto e dell'installazione su entrambe le piattaforme e ha pubblicato sei artifact con `SHA256SUMS.txt`; i digest pubblicati coincidono con il manifesto. Il branch M20 è stato rimosso dopo le verifiche.

## M21 — Competenza e incasso delle rate di affitto

**Obiettivo:** rappresentare separatamente il mese di competenza di una rata di affitto e la data del suo incasso, affinché un pagamento tardivo saldi la rata corretta senza nascondere o anticipare le altre scadenze.

**Attività pianificate**

- Tracciare il flusso completo tra Ricorrenza, Transazione pianificata, registrazione immobile e riepilogo affitti, verificando localmente il caso Pasteur senza inserire dati privati in Git, log o test.
- Definire nel dominio un'identità stabile della rata e distinguere, dove necessario, data di competenza/scadenza e data effettiva di incasso; la liquidità segue l'incasso, mentre lo stato dell'affitto segue la rata di competenza.
- Correggere conferma, modifica, rigenerazione e riconciliazione delle rate affitto affinché un incasso tardivo aggiorni la scadenza originaria invece di consumare o marcare come pagata la rata del mese corrente.
- Conservare UUID e collegamenti bidirezionali tra immobile, ricorrenza e Transazione; impedire duplicati, salti mensili e riassociazione implicita in presenza di casi ambigui.
- Versionare schema e migrazione soltanto se servono nuovi campi persistenti; ogni riparazione automatica deve essere deterministica, idempotente, preceduta da backup e lasciare invariati i casi non univoci.
- Correggere su una copia separata il workbook privato indicato dal proprietario, mantenendo intatto l'originale e verificando rilettura, conteggi, collegamenti, seconda apertura idempotente e resa dei fogli interessati.
- Aggiornare la vista Immobili e gli eventuali dettagli affitto per rendere distinguibili rata dovuta, pagata puntualmente, pagata in ritardo e insoluta, con stringhe IT/EN e accessibilità invariata.

**Criteri di accettazione**

- Nel caso maggio pagato, giugno incassato ai primi di luglio e luglio non pagato, giugno resta visibile come rata saldata in ritardo e luglio resta visibile come insoluta.
- La data dell'incasso tardivo incide sulla liquidità del giorno effettivo senza spostare il mese di competenza della rata né alterare entrate storiche già confermate.
- Conferma, modifica, riapertura, rigenerazione delle pianificazioni e rollover non producono rate mancanti, doppie o associate al mese sbagliato.
- Workbook precedenti continuano ad aprirsi senza perdita dati; riparazioni e migrazioni non indovinano corrispondenze ambigue e una seconda apertura non riscrive il file.
- La copia privata corretta resta esclusa da Git, fixture, log, CI, artifact e servizi remoti ed è accompagnata da una copia recuperabile.

**Test richiesti:** unit test sintetici per pagamenti puntuali, tardivi, anticipati e mancati, confini di mese/anno e più insoluti; test di collegamento Ricorrenza/Transazione/Immobile, idempotenza, migrazione o riparazione, backup, round-trip e rollover; regressione liquidità e dashboard; Playwright IT/EN, chiaro/scuro e 1080 px sul caso giugno/luglio.

**Documentazione:** manuali IT/EN, README, schema workbook se modificato, MAP, SECURITY_MODEL per persistenza/riparazione e note di rilascio.

**Esito applicativo 2026-08-01:** individuata la causa nella precedente sovrapposizione tra data di scadenza/competenza e data effettiva del movimento: un incasso registrato a luglio veniva quindi interpretato come rata di luglio e non lasciava una rata distinta per giugno. Lo schema workbook è stato portato a v8 aggiungendo `dueDate` a Transazioni e Registrazioni immobiliari; la migrazione v1–v7 assegna il campo soltanto alle pianificazioni ancora aperte, per le quali la data precedente è univoca, e non indovina la competenza degli incassi storici confermati. La conferma di un movimento pianificato richiede ora la data effettiva, conserva scadenza, UUID e collegamenti e fa avanzare la ricorrenza alla prima rata ancora aperta. Modificare la competenza riapre la vecchia rata e riconcilia la nuova senza duplicati; le cadenze di fine mese restano ancorate anche attraverso febbraio e il rollover conserva le rate d'affitto insolute con la competenza originaria. La scheda dell'immobile mostra rate pagate, pagate in ritardo, insolute, future o con competenza storica non assegnata; pianificazioni e insoluti restano esclusi da liquidità, consuntivi e grafici degli incassi. Aggiornati demo sintetica, stringhe IT/EN, manuali, README, MAP e modello di sicurezza. Gate locale verde: lint, typecheck, 138 test Vitest, build renderer/Electron, controllo documentale e `npm audit` con 0 vulnerabilità; collaudo Playwright completato a 1080 px in IT/chiaro ed EN/scuro, inclusa la conferma con data effettiva e senza errori console.

**Esito correzione privata 2026-08-01:** il workbook originale è rimasto intatto ed è stata prodotta una copia separata in schema v8, con backup pre-correzione. Applicando esclusivamente la situazione confermata dal proprietario, l'incasso dei primi di luglio è stato associato alla competenza di giugno e la rata di luglio è stata ricostruita come pianificata e insoluta, senza alterare importi o inventare incassi. Dopo un'ulteriore conferma esplicita, i restanti bonifici storici d'affitto privi di competenza sono stati assegnati alla rata dello stesso mese dell'incasso; il caso giugno/luglio è rimasto separato. Superati rilettura strutturale, controllo dei collegamenti, assenza di competenze duplicate o non assegnate, seconda apertura idempotente, scansione degli errori formula e verifica visiva locale; workbook, backup e anteprime private restano esclusi da Git, fixture, CI, artifact e servizi remoti.

## M19 — Cambio tariffa delle ricorrenze

**Obiettivo:** consentire una variazione di importo con decorrenza esplicita, mantenendo immutati lo storico e le scadenze precedenti e aggiornando in modo deterministico tutte le Transazioni ancora programmate dal mese scelto in avanti.

**Attività pianificate**

- Aggiungere alla modifica di una ricorrenza l’azione **Cambia tariffa / Change rate**, con nuovo importo e mese di decorrenza obbligatori; la decorrenza è normalizzata al primo giorno del mese selezionato.
- Persistire una cronologia tariffaria versionata con importo e decorrenza, mantenendo l’importo originario come base, affinché riapertura, rigenerazione delle scadenze e rollover applichino sempre la tariffa corretta.
- Applicare la nuova tariffa soltanto alle Transazioni pianificate e non confermate con data uguale o successiva alla decorrenza; le Transazioni confermate e tutte le occorrenze precedenti restano immutate.
- Aggiornare in posto le Transazioni pianificate già esistenti e rigenerare soltanto quelle mancanti, preservando UUID e collegamenti quando possibile ed evitando duplicati.
- Applicare la stessa regola a servizi, entrate ricorrenti, investimenti periodici, comparti pensione, rate e ogni altro tipo di ricorrenza supportato.
- Per i piani rateali modificare l’importo delle sole rate future senza cambiare il numero di rate residue, la prossima scadenza, la data di fine o lo stato delle rate già confermate.
- Propagare l’importo aggiornato ai record collegati che nasceranno dalla futura conferma, inclusi movimenti di investimento/comparto e spese condivise, senza riscrivere record storici.
- Consentire più cambi tariffa successivi, validandone ordine, importi, date e sovrapposizioni; modifica o annullamento di un cambio futuro deve ricalcolare soltanto le occorrenze non confermate interessate.
- Eseguire ogni cambio in una sola trasformazione atomica con controllo della revisione, backup, rilettura e rollback, mostrando prima della conferma il numero di scadenze future che verranno aggiornate.
- Aggiornare lo schema workbook con una migrazione deterministica dalla v5 alla nuova versione necessaria; i workbook precedenti ricevono una sola tariffa base e mantengono invariati tutti i record esistenti.

**Criteri di accettazione**

- Impostando un nuovo importo da un mese scelto, tutte e sole le scadenze non confermate da quel mese in avanti assumono la nuova tariffa.
- Le scadenze precedenti e ogni Transazione già confermata mantengono l’importo storico, anche dopo riapertura, modifica successiva, rollover o rigenerazione delle pianificazioni.
- Più cambi tariffa vengono applicati in ordine cronologico senza sovrapposizioni, duplicati o salti; la tariffa visibile per ciascuna scadenza è riconciliabile con la cronologia.
- Servizi, investimenti/comparti periodici, entrate, spese condivise e piani rateali conservano collegamenti e semantica finanziaria.
- Annullamento, errore o conflitto esterno lasciano invariato il workbook e l’ultima copia valida resta recuperabile.

**Test richiesti:** unit test su decorrenza mensile, confini anno, più variazioni, modifica/annullamento, importi invalidi e rate residue; integrazione su pianificazione, UUID, collegamenti, migrazione, backup, rollback, riapertura e rollover; regressione M18 per investimenti/pensioni; Playwright IT/EN e chiaro/scuro con anteprima e conferma da tastiera.

**Documentazione:** manuali IT/EN con esempi sintetici prima/dopo la decorrenza, README, schema workbook, MAP, SECURITY_MODEL, messaggi di migrazione e note di rilascio.

## M16 — Trasporti e collegamento dei pagamenti rateali

**Obiettivo:** rendere più generale e coerente la gestione dei mezzi e collegare correttamente i pagamenti rateali alle Ricorrenze.

**Attività pianificate**

- Rinominare la sezione visibile **Automobile** in **Trasporti** in navigazione, titoli, dashboard, modali, stati vuoti e manuali, aggiornando coerentemente le stringhe italiane e inglesi senza imporre una migrazione dei nomi tecnici già salvati nel workbook.
- Quando, durante la creazione o la modifica di un mezzo, viene indicato un pagamento rateale, creare o aggiornare la relativa registrazione in **Ricorrenze** tramite un collegamento stabile, evitando duplicati e mantenendo sincronizzati importo, frequenza, scadenze e stato.
- Definire il comportamento del collegamento rateale anche per modifica, chiusura, riapertura e cancellazione del mezzo, preservando storico, conferme e atomicità del salvataggio.

**Criteri di accettazione**

- Tutte le superfici utente mostrano **Trasporti** al posto di **Automobile** in IT/EN, mentre workbook esistenti, importazione e rollover continuano a funzionare senza perdita dati.
- Un mezzo con pagamento rateale produce una sola ricorrenza collegata e immediatamente visibile; modifiche e cambi di stato non creano duplicati né lasciano riferimenti orfani.
- I flussi restano accessibili da tastiera e leggibili in tema chiaro/scuro, IT/EN e alla larghezza minima di 1080 px.

**Test richiesti:** unit test del collegamento mezzo/ricorrenza e delle transizioni di stato; integrazione e round-trip workbook; regressione importazione, cambio tariffa e rollover; Playwright della creazione rateale e della modale in IT/EN e chiaro/scuro.

**Documentazione:** aggiornamento di manuali IT/EN, README, MAP, schema workbook se necessario e note di rilascio.

## Patch grafici, menu release e integrità UUID

**Obiettivo:** correggere prima di M16 la leggibilità dei grafici piccoli nella modale immobili, il menu dell’app compilata e le collisioni UUID introdotte da ritocchi manuali al workbook.

**Attività pianificate**

- Sistemare i grafici compatti dei consumi e delle spese immobiliari — elettricità, gas, acqua, Telefono/Internet, Condominio e altri grafici analoghi — in modo che l’asse X e le etichette temporali siano visibili senza scrollbar verticale interna.
- Rivedere altezza, padding interno, area asse/etichette e overflow dei box grafico: la card può mantenere la sola scrollbar orizzontale quando la serie è larga, ma non deve tagliare verticalmente barre, assi o label né perdere la scala proporzionale delle barre.
- Verificare il caso reale mostrato nello screenshot del 2026-07-25, oltre a dataset sintetici con molti anni, valori zero, valori alti e categorie prive di dati.
- Ridurre i menu Electron nella versione compilata macOS e Windows, rimuovendo voci di debug/sviluppo e lasciando soltanto:
  - **File → Quit**, che deve chiudere completamente l’applicazione e non solo la finestra;
  - **Window**, con le azioni standard di ridimensionamento/gestione finestra supportate dalla piattaforma;
  - **Info**, con apertura della finestra informazioni dell’app.
- Aggiornare la finestra **Info** perché mostri il copyright `Copyright © 2026 Gloutchov`.
- All’apertura di un workbook, rilevare UUID duplicati nelle tabelle con identificativo, conservare la prima occorrenza e assegnare nuovi UUID alle successive senza eliminare righe o modificare importi, date e descrizioni.
- Riallineare soltanto i collegamenti transazione/registrazione non ambigui; in presenza di uno stesso riferimento copiato più volte, conservare entrambi i record ma rimuovere dalla copia successiva il collegamento ambiguo.
- Applicare la correzione direttamente alle sole celle interessate, tramite temporaneo verificato, backup recuperabile e sostituzione con rollback; mostrare un avviso bilingue dopo la riparazione.

**Criteri di accettazione**

- Nelle modali immobili l’asse X dei grafici compatti è visibile in tema chiaro/scuro, IT/EN e a larghezza minima 1080 px; non compare scrollbar verticale interna nei box dei grafici.
- Le barre dei grafici immobiliari e del confronto auto occupano l’altezza disponibile in proporzione ai rispettivi valori, incluso il valore massimo.
- Serie storiche larghe restano consultabili orizzontalmente senza tagliare l’asse X o la base delle barre.
- Le build compilate macOS e Windows non mostrano menu Electron di default o voci di sviluppo; `Quit` termina l’applicazione completa e il processo non resta attivo.
- La finestra **Info** è accessibile da menu e riporta correttamente nome/versione applicazione e `Copyright © 2026 Gloutchov`.
- Un workbook modificato manualmente con UUID duplicati viene riaperto con lo stesso numero di righe e gli stessi valori economici; gli UUID risultano univoci e gli eventuali riferimenti univoci restano bidirezionali.
- Prima della correzione automatica viene conservato un backup in `.contami-backups`; una seconda apertura del file già corretto non lo riscrive né crea nuovi backup.

**Test richiesti:** unit/integration test per configurazione menu e handler di quit; test renderer dei grafici compatti con dataset sintetici; test di dominio e round-trip per UUID duplicati e collegamenti; Playwright IT/EN e chiaro/scuro a 1080 px sulla modale immobile; smoke dei pacchetti compilati macOS/Windows verificando menu, quit completo e finestra Info.

**Documentazione:** aggiornare README/manuali se cambia il comportamento dei menu o della finestra Info; aggiornare MAP/SECURITY_MODEL solo se cambiano file, IPC, confini Electron o modello di packaging.

**Stato locale 2026-07-25:** implementati layout e scala proporzionale dei grafici compatti condivisi da immobili e confronto auto, menu compilato ridotto, finestra Info, riparazione conservativa degli UUID duplicati e bump versione `1.3.2`. La correzione UUID modifica solo le celle necessarie, conserva tutte le righe, riallinea i collegamenti non ambigui e passa da temporaneo verificato, backup e rollback. Una copia privata aggiornata è stata corretta e verificata localmente, restando esclusa da Git e release. La verifica Playwright su dati sintetici conferma asse X visibile, assenza di overflow verticale e barre proporzionate all’altezza della pista. Gate locale verde: lint, typecheck, 90 test unit/integration, build renderer/Electron, controllo documentazione, `npm audit` con 0 vulnerabilità e Playwright IT/EN chiaro/scuro a 1080 px; l’ispezione ASAR della parte grafici/menu resta valida. Lo smoke locale del pacchetto macOS non arriva al codice applicativo e termina con `SIGABRT` durante la registrazione AppKit dell’app non firmata; resta da riverificare nel workflow release macOS/Windows prima della pubblicazione.

## Patch limiti e chiusura rate

**Obiettivo:** impedire che un pagamento rateale continui a generare scadenze fino a fine anno dopo l’esaurimento del numero di rate indicato.

**Comportamento previsto**

- La sincronizzazione genera al massimo il numero di rate residue e non supera l’eventuale data di fine.
- La conferma di una rata riduce di una unità il residuo e aggiorna la prossima scadenza.
- Dopo l’ultima conferma la ricorrenza viene chiusa logicamente, le righe pianificate residue scompaiono e tutte le rate confermate restano nello storico.
- Il rollover conserva il residuo aggiornato e genera nel nuovo workbook soltanto le rate ancora dovute nell’anno nuovo.
- Per piani storici caricati da un altro foglio, `nextDueDate` rappresenta la prima rata non pagata e `remainingInstallments` il solo residuo, non la data iniziale e il numero originario del piano.
- Le ricorrenze non rateali continuano a essere pianificate fino alla data di fine o alla fine dell’anno.
- In Impostazioni, il pulsante per importare un file compilato è allineato verticalmente al menu della strategia duplicati; il testo di aiuto occupa una riga separata e il layout resta impilato sotto i 900 px.

**Test richiesti:** unit test sintetici per limite numerico, data di fine, decremento progressivo, chiusura automatica, conservazione delle rate confermate e piano a cavallo d’anno; regressione completa dei test di dominio e integrazione; Playwright dell’allineamento importazione in IT/EN, chiaro/scuro e a 1080 px.

**Documentazione:** aggiornare manuali IT/EN, README, MAP e versione applicativa. Non sono previste modifiche a UI, traduzioni, schema workbook, IPC o modello di sicurezza.

**Esito 2026-07-27:** implementata nel commit `9e4290a` sul branch `patch/1.3.3-installment-limits` e integrata in `main` dal merge commit `5e0a2f3`. Gate locale verde: lint, typecheck, 93 test unit/integration, build renderer/Electron, controllo documentazione, `npm audit` con 0 vulnerabilità e Playwright IT/EN chiaro/scuro a 1080 px, incluso il controllo geometrico dell’allineamento tra strategia duplicati e pulsante di importazione. CI verdi sul branch (`30273773479`), su `main` (`30273847224`) e sul tag `v1.3.3` (`30273854813`). Il workflow Release `30273854755` ha completato packaging, ispezione, smoke installato e pubblicazione privata per macOS ARM64/x64 e Windows x64; gli asset includono DMG, ZIP, installer Windows e `SHA256SUMS.txt`.

## Revisione roadmap — 2026-07-30

- Il 2026-08-01 è stata inserita M21 davanti alle attività ancora pianificate per distinguere competenza e incasso delle rate di affitto e correggere il caso di pagamento tardivo; M19, M16, M9, M10 e M11 slittano rispettivamente ai checkpoint da `v1.8.0` a `v1.12.0`.
- Il 2026-08-01 è stata inserita M20 davanti a tutte le attività ancora pianificate: introduce Casse, trasferimenti interni e indicatori di perdita; M19, M16, M9, M10 e M11 slittano rispettivamente ai checkpoint da `v1.7.0` a `v1.11.0`.
- Inserite M17, M18 e M19 prima di M16 e delle successive attività di hardening, integrità dei salvataggi e CSP.
- M17 raccoglie i filtri mancanti nelle modali di Immobili, automobili, investimenti e comparti pensione, completa il filtro descrizione delle Spese condivise e porta **Aggiorna valore** nel dettaglio dell’investimento.
- M18 verifica e rende obbligatoria la rappresentazione nelle Transazioni dei Versamenti e delle Liquidazioni di investimenti e comparti, sia una tantum sia periodici, mantenendoli trasferimenti patrimoniali senza doppio conteggio.
- M19 introduce cambi tariffa con decorrenza mensile e cronologia persistente: lo storico confermato resta immutato e vengono aggiornate soltanto le pianificazioni future interessate.
- Il filtro delle automobili già previsto in M16 è stato anticipato in M17; M16 resta dedicata alla rinomina Automobile→Trasporti e al collegamento stabile dei pagamenti rateali con le Ricorrenze.
- La sequenza di versione è stata ripianificata fino a `v1.12.0`; le funzioni restano locali e non introducono rete, telemetria, cloud o dati reali nei test.

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

## Avvio e chiusura M15 — 2026-07-23/24

- Creato il branch `milestone/15-guided-import` da `main` sincronizzato e portati manifest, lockfile e documentazione applicativa a `1.3.0`.
- Implementati preflight `.xlsx`, parser e pianificazione per tutti gli otto template, strategie ignora/crea/aggiorna per identità esatte, riferimenti catalogo UUID o nome univoco, anteprima opaca nel main e diagnostica localizzata senza valori finanziari nei log.
- La conferma riusa i comandi di dominio in una trasformazione in memoria e salva una sola volta tramite il repository esistente: controllo revisione, backup, verifica di rilettura, sostituzione atomica e rollback restano invariati.
- Aggiunti flusso Impostazioni IT/EN, anteprima accessibile, riepilogo create/aggiorna/ignora/importi e copertura sintetica per otto tipologie, formule/macro, versioni, riferimenti, duplicati, annullamento, conferma, backup e atomicità.
- Gate locale M15 superato: lint, typecheck, build renderer/Electron, 76 test Vitest, controllo documentale e `npm audit` con 0 vulnerabilità; Playwright Chromium superato in IT/scuro e EN/chiaro a 1080 px con anteprima, focus da tastiera, conferma, assenza di overflow ed errori console.
- Collaudo manuale del proprietario completato con dati locali: l'anteprima ha identificato riferimenti e valori non validi, la correzione guidata ha risolto gli errori e l'importazione finale di categorie e registrazioni immobiliari è riuscita. I file usati restano esclusi da Git e non sono stati copiati in fixture o servizi remoti.
- Pubblicazione M15 completata: commit funzionale `3b6c950`, PR `#18` e merge commit `b0bded4`; CI verde sulla PR (`30101556907`), su `main` (`30101882085`) e sul tag (`30102161837`). Il tag annotato `v1.3.0` ha completato la Release nel run `30102161664`: packaging, ispezione e smoke installato superati su macOS e Windows, sei artifact applicativi pubblicati e checksum raccolti in `SHA256SUMS.txt`.

## Patch residenza e storico immobili — 2026-07-25

- Avviato il branch `patch/1.3.1-residence-property-history` da `milestone/16-transport-improvements`; dopo approvazione del proprietario la patch è stata committata, mergiata in `main`, taggata come `v1.3.1`, pubblicata e il branch locale è stato eliminato.
- Portato il workbook allo schema v5 aggiungendo a `Property History` i campi aggregati `phoneInternetCost` e `condominiumCost`; i workbook v1, v2, v3 e v4 vengono migrati in memoria e validati come v5.
- Corretti gli indicatori della residenza per riconoscere utenze importate tramite `detailKind` e kWh elettrici da fasce F1/F2/F3/F23; Telefono/Internet e Condominio confluiscono anche nello storico annuale.
- Spostati i filtri descrizione/mese prima dello storico nella modale immobile e aumentato lo spazio verticale dei grafici delle utenze per evitare scrollbar verticali interne.
- Aggiunto il comando atomico per registrare una rata di affitto come entrata ricorrente direttamente dalla nuova registrazione immobile; la rata corrente viene collegata alla ricorrenza e le rate future pianificate restano coerenti con il modello delle Ricorrenze.
- Commit funzionale `772f187` e merge commit `ea53d29`; CI su `main` e sul tag `v1.3.1` verdi. Il workflow Release `30159557120` ha completato packaging, ispezione, smoke installato e pubblicazione privata per macOS e Windows, con checksum in `SHA256SUMS.txt`.

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
