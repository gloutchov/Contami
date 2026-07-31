# ContaMì — Modello di sicurezza / Security model

Versione del documento / Document version: 2026-07-31 · Applicazione / Application: 1.5.1

## Italiano

### 1. Obiettivo e modello operativo

ContaMì è un’app desktop local-first per dati finanziari personali. Il confine di fiducia principale è il computer dell’utente: l’app legge e scrive soltanto il workbook scelto tramite dialoghi nativi e un piccolo file di preferenze. Non esistono backend, account, telemetria, pubblicità, analytics o sincronizzazione cloud integrata.

Il workbook è la fonte dati autorevole. I dati in memoria sono una copia validata usata per calcoli e UI; ogni comando valido genera un nuovo workbook verificato prima della sostituzione.

### 2. Asset da proteggere

- transazioni, patrimonio, investimenti, pensioni integrative/comparti, immobili, consumi domestici, automobili, spese condivise, catalogo tasse e copie dei cataloghi inserite nei template di importazione;
- percorsi locali del workbook e dei backup;
- integrità dello schema e dei consuntivi annuali;
- preferenze di lingua, tema e formato;
- codice di release e pipeline di distribuzione.

ContaMì non raccoglie credenziali, password, PIN, token o chiavi API.

### 3. Avversari e rischi considerati

- contenuto malformato o intenzionalmente ostile in un `.xlsx` aperto dall’utente;
- renderer compromesso che prova ad accedere a Node.js, filesystem, rete o IPC non autorizzato;
- sovrascrittura accidentale o modifica contemporanea da Excel/Numbers;
- interruzione durante il salvataggio;
- formula injection o contenuti che tentano di diventare codice nel foglio;
- path non valido, file enorme, popup, navigazione o download inattesi;
- dipendenze o artifact di build compromessi;
- accesso locale da parte di un altro utente/processo già autorizzato sul computer.

Non sono risolvibili dall’app, da soli, un sistema operativo compromesso, malware con i privilegi dell’utente o l’accesso fisico a una sessione sbloccata.

### 4. Architettura e separazione dei privilegi

- Electron usa `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true` e `allowRunningInsecureContent: false`.
- Il preload espone un oggetto congelato con soli metodi ContaMì; non espone `ipcRenderer`, Node.js o primitive filesystem generiche.
- I canali IPC sono una allowlist centralizzata. Ogni richiesta deve provenire dal frame principale e dall’URL già caricato nella finestra autorizzata; tuple, arità e payload sono validati con Zod e gli errori sono redatti.
- Il renderer non sceglie né invia percorsi file: creazione, apertura e destinazione dei template passano dai dialoghi nativi nel main process. Per i template il renderer invia soltanto tipo e lingua validati e riceve soltanto annullamento e nome del file, mai il percorso completo.
- Main, preload, dominio, persistenza, configurazione e renderer sono moduli separati.
- È ammessa una sola istanza dell’app, riducendo scritture concorrenti tra processi ContaMì.

### 5. Rete, navigazione e contenuti attivi

- In produzione la sessione Electron annulla richieste `http`, `https`, `ws` e `wss`.
- La Content Security Policy consente soltanto risorse locali; `object-src` e `base-uri` sono disabilitati. In sviluppo è ammesso solo il server locale Vite.
- Popup, nuove finestre e tentativi di collegare `webview` sono negati; navigazioni fuori dalla pagina corrente, drag-and-drop navigabile e download avviati dal renderer sono bloccati.
- Tutte le richieste e le verifiche di permesso Electron sono negate.
- Non vengono caricati font, immagini, script o analytics remoti.

La CSP permette stili inline necessari alla UI corrente. Il rischio è mitigato dall’assenza di HTML non fidato e dall’escaping predefinito di React; una futura rimozione di `style-src 'unsafe-inline'` è auspicabile.

### 6. Validazione dati e workbook

- Entità, UUID, date ISO, timestamp, enum, testo, importi, quote e cardinalità massime sono validati con schemi Zod.
- Testo descrittivo: massimo 240 caratteri; note: massimo 2.000; importi e quantità hanno limiti finiti; le quote condivise devono riconciliare al centesimo.
- Sono accettati soltanto percorsi assoluti `.xlsx`, senza byte nulli e lunghi al massimo 4.096 caratteri.
- Il file in ingresso non può superare 250 MB e deve contenere `_Meta`, versione schema supportata e tutti i fogli richiesti.
- Lo schema v6 mantiene UUID espliciti tra transazioni e registrazioni collegate, incluse le spese dell’automobile, e conserva `accountId` anche sui movimenti e sulle ricorrenze di investimenti/comparti. Le tasse immobiliari sono un catalogo validato nel workbook con UUID, nome, ambito, 1–24 rate e stato attivo/archiviato; i nuovi inserimenti accettano soltanto tasse attive e applicabili. I comandi dedicati a utenze, tasse e affitti ricorrenti salvano atomicamente la voce immobile, la Transazione, la Ricorrenza e l’eventuale Spesa condivisa. `Property History` include aggregati annuali separati per Telefono/Internet e Condominio. Le modifiche vengono propagate dal dominio; una cancellazione rimuove i record dipendenti, mentre cataloghi in uso, incluse le tasse, restituiscono `ENTITY_IN_USE` e non possono lasciare riferimenti orfani.
- I trasferimenti finanziari dichiarano esplicitamente l’effetto sulla liquidità (`inflow`, `outflow` o `neutral`). Il dominio applica tale direzione solo al saldo del conto e li esclude dai consuntivi di entrate/uscite, evitando che acquisti, vendite e versamenti vengano contabilizzati come spesa corrente.
- La liquidità include il saldo iniziale e accetta movimenti soltanto nell’intervallo di validità del conto (`openedAt`–`closedAt`). All’apertura, una transazione con effetto di cassa priva di conto viene assegnata solo quando esiste esattamente un conto compatibile con la sua data; i casi non univoci restano invariati e vengono segnalati. La stessa riparazione chiude i piani rateali attivi già arrivati a zero e rimuove esclusivamente le pianificazioni obsolete collegate. Ogni modifica viene salvata tramite il normale flusso verificato con backup ed è idempotente.
- Pensioni e comparti riusano le tabelle Investimenti dello schema v6: il tipo tecnico `pension` è riservato e protetto da modifica/cancellazione. Il controvalore e la liquidità applicano soltanto movimenti confermati, escludendo le transazioni pianificate; i selettori separano investimenti e pensioni e aggregano soltanto le posizioni finali attive, impedendo il doppio conteggio.
- Versamenti e Liquidazioni di investimenti e comparti condividono una coppia UUID bidirezionale con una sola Transazione di tipo trasferimento. All’apertura, la riconciliazione usa prima i riferimenti espliciti e poi soltanto impronte esatte e univoche; crea il solo lato mancante, non modifica i casi ambigui e convalida nuovamente l’intero `FinanceData` prima di ogni scrittura.
- I workbook v1–v5 sono trasformati in memoria tramite migrazioni deterministiche e vengono convalidati integralmente come v6 prima di poter essere salvati. La migrazione v3 associa Canone TV, IMU e TARI a UUID stabili e converte i marcatori di rata senza modificare importi o collegamenti; la migrazione v4 aggiunge gli aggregati Telefono/Internet e Condominio a zero dove assenti. La migrazione v5→v6 propaga un conto già presente tra le due metà collegate e completa i riferimenti mancanti soltanto quando esiste esattamente un conto attivo; con più conti non indovina l’associazione.
- Dopo la validazione, il caricamento verifica l’unicità degli UUID in ogni tabella identificata. Le occorrenze successive di un UUID duplicato ricevono un nuovo identificativo senza rimuovere record; i collegamenti bidirezionali vengono aggiornati soltanto quando la corrispondenza è univoca. Se anche il riferimento è stato copiato e risulta ambiguo, la copia successiva resta nel workbook ma viene scollegata per evitare cancellazioni o aggiornamenti incrociati.
- I consuntivi annuali dettagliati (`Property History`, `Investment History`, `Vehicle History`) contengono solo dati aggregati e identificativi interni; il rollover non copia le transazioni storiche nel nuovo workbook.
- Le stringhe utente vengono scritte come valori, non concatenate in formule. Il loader non esegue macro o formule; se incontra una cella formula legge il risultato memorizzato.
- Il file Numbers non viene modificato direttamente: su macOS è rigenerato importando il sidecar `.xlsx` tramite uno script AppleScript fisso.

Il generatore M14 è separato dal repository del workbook autorevole e non lo modifica. Accetta soltanto uno degli otto tipi in allowlist e una lingua supportata, usa esclusivamente un percorso assoluto `.xlsx` scelto dal dialogo nativo e prepara al massimo 5.000 righe. Ogni template contiene un foglio dati visibile e due fogli tecnici molto nascosti e protetti, metadati di tipo/versione e liste tramite intervalli denominati. Non inserisce formule di cella, macro, collegamenti esterni o contenuto attivo; rilegge il file temporaneo e ne verifica firma, fogli, intestazioni e assenza di formule/link prima della sostituzione con rollback. I cataloghi incorporati provengono dalla copia `FinanceData` già validata; senza workbook vengono omessi gli UUID instabili.

L’importatore M15 accetta soltanto `.xlsx` scelti con dialogo nativo e contratti template v1 in allowlist. Prima di ExcelJS esamina la directory centrale ZIP con limiti su file, voci, dimensione espansa, singola voce e rapporto di compressione; rifiuta cifratura, ZIP64, nomi duplicati o traversali, macro, fogli macro/dialogo, ActiveX, oggetti incorporati e link esterni. Dopo l’apertura richiede esattamente i tre fogli attesi, stati di visibilità, firma, versione, tipo, intestazioni e limiti, e rifiuta ogni formula o valore di cella attivo.

Il renderer riceve soltanto nome base, conteggi, importo aggregato, codici errore riga/colonna e un UUID di anteprima; non riceve percorso né comandi. Il piano validato resta in memoria nel main per 15 minuti. I riferimenti sono risolti tramite UUID attivo o nome esatto univoco, senza approssimazioni. La conferma passa il piano già preparato a una sola trasformazione di dominio, verifica la revisione del workbook e usa il salvataggio esistente con temporaneo, rilettura, backup, sostituzione e rollback. Nessuna scrittura avviene durante anteprima o annullamento e i contenuti finanziari non vengono loggati.

Limite residuo: un `.xlsx` compresso sotto 250 MB può espandersi molto durante il parsing e causare consumo elevato di memoria. Lo schema limita le righe accettate dopo l’apertura, ma non costituisce una difesa completa contro zip bomb. Aprire solo file ContaMì affidabili.

### 7. Salvataggio, backup e conflitti

- Il nuovo workbook viene scritto in un file temporaneo nella stessa cartella.
- ContaMì lo rilegge e verifica fogli critici prima di sostituire il file attivo.
- La sostituzione usa rename e un file di rollback quando la piattaforma non consente la sovrascrittura diretta.
- Prima della sostituzione viene creata una copia in `.contami-backups`; sono mantenuti gli ultimi 10 backup `.xlsx`.
- La riparazione automatica degli UUID modifica in posto soltanto le celle necessarie e il timestamp tecnico, scrive un temporaneo, rilegge le celle corrette, crea un backup e usa la stessa sostituzione con rollback. Un file già corretto non viene riscritto alla riapertura.
- La migrazione di schema e la riconciliazione dei movimenti patrimoniali possono aggiungere campi o righe mancanti e quindi riscrivono il workbook canonico tramite il normale salvataggio temporaneo, rilettura, backup e sostituzione con rollback. Sono idempotenti: un workbook già migrato e riconciliato non viene riscritto; corrispondenze multiple o conflittuali vengono soltanto segnalate.
- Dimensione e timestamp del file vengono catturati dopo apertura/salvataggio. Se cambiano esternamente, il successivo salvataggio viene bloccato e l’utente deve riaprire il workbook.
- Il passaggio d’anno crea un nuovo file e non elimina, sposta o rende inaccessibile il precedente.
- Se all’avvio il percorso ricordato non esiste più (`ENOENT`), ContaMì non crea né sovrascrive file: rimuove soltanto il collegamento obsoleto dalle preferenze, usa uno stato vuoto in memoria e richiede di aprire o creare esplicitamente un workbook. Errori di schema o corruzione non vengono confusi con un file mancante.

Il controllo di conflitto riduce ma non elimina una gara nel brevissimo intervallo tra verifica e rename. I backup rendono recuperabile la versione esterna eventualmente sostituita. I programmi esterni non rispettano un lock ContaMì, quindi evitare modifiche simultanee.

### 8. Adapter Numbers

- Disponibile solo su macOS quando è rilevato il bundle `com.apple.Numbers`, nei percorsi standard di **Numbers** o **Numbers Creator Studio** dentro `/Applications` o `~/Applications`.
- I percorsi sorgente/destinazione devono essere assoluti e avere estensione prevista.
- `/usr/bin/osascript` viene invocato con `execFile` e argomenti separati, senza shell interpolation.
- Timeout 60 secondi e buffer output 64 KiB.
- La copia è prodotta in un percorso temporaneo e sostituita con rollback; in caso di errore il sidecar `.xlsx` resta la copia sicura.

macOS può chiedere il permesso di controllare Numbers. L’utente deve concederlo consapevolmente. L’adapter non è disponibile né emulato su Windows.

### 9. Preferenze, segreti e logging

- `settings.json` contiene solo lingua, tema, formato e percorsi; non contiene dati finanziari completi o segreti.
- Il file viene scritto atomicamente e con modalità `0600` sui sistemi POSIX. Su Windows valgono le ACL della cartella dati utente.
- Configurazione assente/corrotta produce valori sicuri di default; il workbook non viene cancellato.
- L’app non crea log applicativi persistenti e non stampa contenuti finanziari.
- Nessun keychain è necessario perché la versione corrente non usa segreti.

### 10. Protezione locale e cifratura

I workbook e i backup sono file normali non cifrati dall’app. La riservatezza dipende da permessi del filesystem, FileVault/BitLocker, blocco sessione e politiche di backup/sincronizzazione dell’utente. Non memorizzare il file in servizi cloud non approvati e non condividerlo senza una protezione adeguata.

### 11. Dipendenze e supply chain

- `package-lock.json` rende riproducibili le versioni installate con `npm ci`.
- L’audit npm è eseguito localmente e in CI; al 2026-07-21 riporta 0 vulnerabilità note dopo gli override compatibili di `uuid >=11.1.1` per ExcelJS e `shell-quote >=1.10.0` per la toolchain di sviluppo.
- Gli script di installazione sono negati per default da npm 11; la allowlist versionata consente soltanto `esbuild@0.28.1` ed `electron-winstaller@5.4.0`, necessari alla build e al pacchetto Windows.
- Dependabot controlla settimanalmente npm e GitHub Actions; tutte le Actions usate da CI e release sono fissate a commit SHA verificati nei repository ufficiali.
- CI esegue document hygiene, lint, typecheck, test, build, Playwright a 1080 px e audit su macOS e Windows.
- Le release su tag sono costruite da GitHub Actions, ispezionano il contenuto effettivo di `app.asar`, avviano l’eseguibile unpacked, installano il DMG/NSIS in un’area temporanea della piattaforma di build, verificano avvio e rimozione e includono checksum SHA-256.

Rischi residui: alcune catene transitive di `exceljs` ed `electron-builder` includono pacchetti deprecati pur senza vulnerabilità note correnti; vanno rivalutate con gli aggiornamenti upstream. La Action fissata `softprops/action-gh-release@v2` dichiara ancora il runtime Node.js 20 e GitHub la forza su Node.js 24 con un’annotazione: va aggiornata quando l’upstream pubblica un runtime nativo supportato. Gli artifact sono deliberatamente generati senza certificati, firma ad-hoc del bundle o notarizzazione. Bundle, metadati tecnici ed eseguibile macOS usano il nome ASCII `Contami` per evitare un crash del runtime unsigned su Apple Silicon; logo, titolo e UI mantengono il marchio `ContaMì`. Lo smoke test locale del bundle ARM non firmato, con Hardened Runtime predefinito, è riuscito. Gatekeeper richiede comunque l’approvazione esplicita in Privacy e Sicurezza e Windows può mostrare SmartScreen o bloccare l’app con Smart App Control. Checksum e istruzioni riducono il rischio operativo, ma non sostituiscono l’identità crittografica del produttore.

### 12. Verifiche implementate

- unit test per comandi, catalogo tasse e relativi vincoli, aggregazioni di consumi/condominio/automobili, separazione investimenti/pensioni senza doppio conteggio, protezione del tipo pensione, rollover, migrazione v1–v5→v6, propagazione del conto, totalizzatori di cassa e sincronizzazione bidirezionale/cancellazione di Versamenti/Liquidazioni;
- integrazione round-trip workbook e controllo file modificato esternamente;
- integrazione del recupero all’avvio quando il workbook ricordato è stato spostato o cancellato;
- test impostazioni atomiche e validate;
- test delle tuple IPC, inclusi argomenti inattesi e payload non validi;
- test strutturali e round-trip degli otto template, cataloghi presenti/assenti, intervalli denominati, fogli protetti, limite di 5.000 righe, assenza di formule/link e dialogo che non espone il percorso;
- test del focus intrappolato/ripristinato nelle modali e riduzione del movimento;
- budget prestazionale su 25.000 transazioni, 1.200 immobili e 1.200 investimenti sintetici;
- lint, typecheck e build separata main/preload/renderer;
- audit dipendenze;
- verifica Playwright riproducibile IT/EN, chiaro/scuro, focus e assenza di overflow a 1080 px, oltre al collaudo visivo esteso delle viste;
- rendering indipendente di un workbook sintetico, senza dati dell’utente;
- controllo CI che impedisce di tracciare `sources/`, `.numbers`, `.xlsx`, chiavi e certificati.
- ispezione di `app.asar` e delle risorse effettive, più installazione, avvio e rimozione automatica del DMG/NSIS su runner macOS e Windows.

### 13. Risposta a incidenti e recupero

1. Chiudi ContaMì e le app che usano il workbook.
2. Copia il file sospetto senza modificarlo.
3. Recupera l’ultimo backup valido da `.contami-backups` o il workbook dell’anno precedente.
4. Verifica il checksum dell’installer e reinstalla da una release privata ufficiale se sospetti una manomissione.
5. Non allegare workbook reali a issue o log pubblici; usa una riproduzione sintetica.

### 14. Miglioramenti pianificati

- M15 completata: importazione con preflight, anteprima, conferma, backup e applicazione atomica;
- M18 completata localmente: Versamenti e Liquidazioni una tantum o periodici condividono una sola Transazione; i collegamenti mancanti vengono riconciliati con backup senza indovinare i casi ambigui;
- M9: limiti preventivi sull’espansione ZIP e test fuzz per tutti i workbook ostili;
- M10: lock cooperativo e hash del contenuto per una protezione più forte dalle modifiche concorrenti;
- M11: rimozione di `style-src 'unsafe-inline'` dalla CSP.

La cifratura applicativa non è pianificata: resta una decisione futura senza milestone o versione assegnata. Sarà rivalutata soltanto se una soluzione standard conserverà interoperabilità e recupero con Excel e Numbers; nel frattempo sono raccomandati FileVault/BitLocker, permessi del filesystem e backup protetti.

La firma Developer ID/notarizzazione macOS e Authenticode Windows non è una milestone pianificata in assenza delle relative credenziali. Le build restano non firmate e accompagnate da checksum e istruzioni Gatekeeper/SmartScreen. Non sono pianificate integrazioni web o dati di mercato: il blocco della rete resta invariato.

---

## English

### 1. Purpose and operating model

ContaMì is a local-first desktop app for personal financial data. Its primary trust boundary is the user’s computer: it reads and writes only a workbook selected through native dialogs and a small preferences file. There is no backend, account, telemetry, advertising, analytics, or built-in cloud sync.

The workbook is authoritative. In-memory data is a validated copy used for calculations and UI; each valid command produces a newly verified workbook before replacement.

### 2. Protected assets and threats

Protected assets include financial records—including investments, private pensions and compartments, household consumption, vehicles, the property-tax catalog, and catalog snapshots embedded in import templates—workbook/backup paths, schema and annual-summary integrity, preferences, and release artifacts. ContaMì does not collect credentials, passwords, PINs, tokens, or API keys.

Threats considered include malformed `.xlsx` input, a compromised renderer attempting privileged access, concurrent external edits, interrupted saves, formula injection, invalid paths/oversized files, unexpected navigation or network access, and supply-chain compromise. A compromised operating system, same-user malware, or unlocked physical access remains outside what the app alone can defend.

### 3. Privilege separation

- Electron enables context isolation, disabled Node integration, sandboxing, web security, and no insecure content.
- The preload exposes only a frozen, minimal ContaMì API—never raw IPC, Node.js, or generic filesystem methods.
- IPC uses a centralized allowlist. Every call must originate from the authorized window's main frame and currently loaded URL; Zod validates argument tuples, arity, and payloads, and errors are redacted.
- File paths come only from native main-process dialogs. For templates, the renderer sends only a validated type and language and receives only cancellation state and file name, never the complete path.
- Main, preload, domain, persistence, settings, and renderer remain separate modules.
- A single-instance lock reduces concurrent ContaMì writers.

### 4. Network and active content

Production Electron sessions cancel HTTP/HTTPS and WS/WSS requests. CSP allows local resources only, disables objects and base URLs, and permits only the local Vite server during development. Popups, webviews, external navigation, navigable drag-and-drop, renderer downloads, permission requests, and permission checks are denied. No remote font, image, script, or analytics endpoint is loaded.

Inline styles remain allowed for the current UI. React escaping and the absence of untrusted HTML mitigate this, but removing `style-src 'unsafe-inline'` is a future hardening target.

### 5. Data and workbook validation

Zod validates UUIDs, ISO dates, timestamps, enum values, text length, finite amounts, share reconciliation, and collection limits. Only absolute `.xlsx` paths up to 4,096 characters and files up to 250 MB are accepted. Required sheets, `_Meta`, and schema version must validate. Schema v6 uses explicit UUID links between transactions and mirrored records, including vehicle costs, and stores `accountId` on investment/compartment movements and recurring plans. Property taxes are a validated workbook catalog with UUID, name, scope, 1–24 instalments, and active/archived state; new entries accept only active, applicable taxes. Dedicated utility, property-tax, and recurring-rent commands atomically validate and save the property entry, Transaction, Recurring item, and optional Shared expense. `Property History` keeps separate yearly Phone/Internet and Condominium aggregates. Domain propagation keeps linked records synchronized, cascade deletion removes dependants, and in-use catalogs—including taxes—return `ENTITY_IN_USE`. Financial transfers declare a validated cash effect (`inflow`, `outflow`, or `neutral`): confirmed transfers change account liquidity and cash-flow totals while remaining outside income/expense actuals. Version 1–5 data is deterministically migrated in memory and fully validated as v6 before save; the v5→v6 migration propagates an existing account across linked pairs and fills missing references only when exactly one account is active, never guessing among multiple accounts.

Liquidity includes opening balances and accepts movements only within the account’s opening/closing interval. On load, a cash-affecting transaction without an account is assigned only when exactly one account is date-compatible; unresolved cases remain unchanged and are reported. The same idempotent, backed-up repair closes active installment plans already at zero and removes only their obsolete planned rows.

Pensions and compartments reuse the schema-v6 Investments tables. The technical `pension` type is reserved and protected against editing/deletion. Countervalue and current liquidity apply confirmed movements only, excluding planned Transactions; domain selectors separate investments from pensions and aggregate active leaf positions only, preventing double counting. Detailed property, investment, and vehicle history sheets store annual aggregates only; rollover does not copy old transactions into the new workbook.

Investment and pension-compartment Contributions and Liquidations share a bidirectional UUID pair with exactly one transfer Transaction. On load, reconciliation first uses explicit references and then exact unique fingerprints only; it creates only the missing side, leaves ambiguous cases unchanged, and validates the complete `FinanceData` again before any write.

After schema validation, loading checks UUID uniqueness within every identified table. Later occurrences of a duplicate UUID receive a new identifier without removing records, and bidirectional links are updated only when the match is unambiguous. If a copied reference is also ambiguous, the later copy remains in the workbook but is detached to prevent cross-record deletion or updates.

User strings are written as values, not interpolated into formulas. The loader never executes macros or formulas. A compressed workbook may still expand heavily before schema validation and exhaust memory; open trusted ContaMì files only.

The M14 generator is separate from the authoritative workbook repository and never modifies that workbook. It accepts only one of eight allowlisted types and a supported language, uses only an absolute `.xlsx` destination selected by the native dialog, and prepares at most 5,000 rows. Each template contains one visible data sheet and two very-hidden protected technical sheets, type/version metadata, and named-range validation lists. It adds no cell formulas, macros, external links, or active content; it reopens the temporary output and verifies its signature, sheets, headers, and absence of formulas/links before replacement with rollback. Embedded catalogs come from already validated `FinanceData`; without a workbook, unstable UUIDs are omitted.

The M15 importer accepts only native-dialog-selected `.xlsx` files and allowlisted v1 template contracts. Before ExcelJS opens the file, it inspects the ZIP central directory and enforces limits on file size, entry count, expanded size, individual entries, and compression ratio; encryption, ZIP64, duplicate or traversal names, macros, macro/dialog sheets, ActiveX, embedded objects, and external links are rejected. After opening, it requires exactly the three expected sheets and states, signature, version, type, headers, and limits, and rejects every formula or active cell value.

The renderer receives only the base file name, counts, an aggregate amount, row/column error codes, and an opaque preview UUID; it receives neither paths nor commands. The validated plan stays in main-process memory for 15 minutes. References resolve only through an active UUID or an exact unique name, with no fuzzy guessing. Confirmation sends the prepared plan through one domain transformation, checks workbook revision, and reuses temporary save, re-read verification, backup, replacement, and rollback. Preview and cancellation perform no writes, and financial content is never logged.

### 6. Saves, backups, and conflicts

ContaMì writes a same-directory temporary workbook, reopens it to verify critical sheets, creates an adjacent backup, and then replaces the active file with rollback behavior. It retains 10 backups. Schema migration uses the same verified, backed-up replacement. Size and modification time detect external changes and block the next save until the workbook is reopened. Year rollover creates a new file and never deletes or moves the previous one.

Automatic UUID repair changes only the required cells and technical timestamp in place, writes a temporary file, rereads the repaired cells, creates a backup, and uses the same rollback-capable replacement. Reopening an already repaired workbook does not rewrite it.

Schema migration and asset-movement reconciliation may add missing fields or rows, so they rewrite the canonical workbook through the normal temporary save, reread verification, backup, and rollback-capable replacement. They are idempotent: an already migrated and reconciled workbook is not rewritten, while multiple or conflicting matches are only reported.

If the remembered path no longer exists at startup (`ENOENT`), ContaMì creates or overwrites no file: it removes only the stale preference, uses an empty in-memory state, and requires the user to explicitly open or create a workbook. Schema and corruption errors are not treated as missing files.

A narrow race remains between conflict check and rename. External spreadsheet apps do not honor a ContaMì lock; avoid simultaneous edits. Backups provide recovery.

### 7. Numbers adapter

The adapter is macOS-only and detects Apple bundle id `com.apple.Numbers` at standard **Numbers** and **Numbers Creator Studio** locations under `/Applications` or `~/Applications`. It validates absolute `.xlsx`/`.numbers` paths and invokes a fixed AppleScript via `execFile` with separate arguments. It has a 60-second timeout and 64-KiB output cap. Temporary and rollback paths protect the previous copy; the interoperable `.xlsx` sidecar remains safe on failure. macOS automation consent may be required.

### 8. Preferences, secrets, logging, and encryption

`settings.json` stores language, theme, format, and paths only. It is atomically written with POSIX mode `0600`; Windows uses user-data-folder ACLs. Invalid settings fall back safely and never remove the workbook. The app creates no persistent application logs and does not print financial content.

Workbooks and backups are not encrypted by ContaMì. Use filesystem permissions, FileVault/BitLocker, session locking, and appropriate encrypted backups. No keychain is required because the app has no secrets.

### 9. Supply chain and verification

`package-lock.json` plus `npm ci` provide deterministic dependency resolution. As of 2026-07-21, npm audit reports zero known vulnerabilities after compatible `uuid >=11.1.1` and `shell-quote >=1.10.0` overrides for ExcelJS and the development toolchain. npm 11 denies unlisted install scripts; the versioned allowlist permits only `esbuild@0.28.1` and `electron-winstaller@5.4.0`, required for builds and Windows packaging. Dependabot monitors npm and Actions weekly; every Action used by CI and release is pinned to a commit SHA resolved from its official repository. CI runs hygiene checks, lint, typecheck, tests, build, 1080-px Playwright checks, and audit on macOS and Windows. Tagged releases inspect the actual `app.asar` content, launch the unpacked executable, install the DMG/NSIS in a temporary platform-specific location, verify launch and removal, and publish SHA-256 checksums.

Residual risks: transitive `exceljs` and `electron-builder` chains still contain deprecated packages despite having no current known vulnerabilities; upstream updates must be reassessed. The pinned `softprops/action-gh-release@v2` still declares the Node.js 20 runtime and GitHub forces it onto Node.js 24 with an annotation; update it when upstream publishes a natively supported runtime. Artifacts are deliberately built without certificates, bundle-level ad-hoc signing, or notarization. The macOS bundle, technical metadata, and executable use the ASCII name `Contami` to avoid an unsigned-runtime crash on Apple Silicon; the logo, title, and UI retain the `ContaMì` brand. The local unsigned ARM-bundle smoke test passed with the default Hardened Runtime. Gatekeeper still requires explicit approval under Privacy & Security, and Windows may show SmartScreen or block the app through Smart App Control. Checksums and instructions reduce operational risk but do not provide cryptographic publisher identity.

### 10. Tests and recovery

Implemented checks cover domain aggregation (including utilities, condominium, vehicles, directed cash totals, and confirmed-only liquidity), configurable-tax CRUD and constraints, investment/private-pension separation without double counting, reserved pension-type protection and rollover, v1–v5→v6 migration with unambiguous account propagation, bidirectional record synchronization and deletion, idempotent Contribution/Liquidation reconciliation with ambiguous cases, workbook round-trip, missing-workbook startup recovery, external-edit detection, validated atomic settings, strict IPC tuples, structural and round-trip verification of all eight templates (catalog modes, named ranges, protected sheets, 5,000-row limit, no formulas/links, and path-redacting dialog), dialog focus containment/restoration, reduced motion, a synthetic large-dataset performance budget, builds, dependency audit, reproducible Playwright UI flows in both languages/themes at 1080 px, actual `app.asar` inspection, unpacked and installed-package smoke tests with removal, independent workbook rendering, and CI rejection of private sources/workbooks/keys.

For recovery: close all workbook users, preserve a copy of the suspect file, restore from `.contami-backups` or the prior-year workbook, verify installer checksums, and never attach real financial files to public issues—use synthetic reproduction data.

### 11. Planned improvements

M15 imports the local versioned Excel templates with preflight, preview, confirmation, backup, and atomic application. M18 locally keeps every one-off or recurring Contribution/Liquidation paired with exactly one Transaction and reconciles missing links with backup without guessing ambiguous cases. M9 will generalize ZIP-expansion limits and hostile-workbook fuzzing; M10 covers stronger cooperative locking and content hashing; M11 removes `style-src 'unsafe-inline'` from the CSP.

Application-level encryption is not planned and has no assigned milestone or version. It may be reconsidered only if a standard solution preserves direct Excel/Numbers interoperability and recovery. FileVault/BitLocker, filesystem permissions, and protected backups remain the recommended controls.

macOS Developer ID signing/notarization and Windows Authenticode are not scheduled milestones while the required credentials are unavailable. Builds remain unsigned and accompanied by checksums and Gatekeeper/SmartScreen instructions. No web integrations or market-data features are planned, and the network block remains unchanged.
