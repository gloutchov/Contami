# ContaMì — Modello di sicurezza / Security model

Versione del documento / Document version: 2026-07-19 · Applicazione / Application: 0.2.0

## Italiano

### 1. Obiettivo e modello operativo

ContaMì è un’app desktop local-first per dati finanziari personali. Il confine di fiducia principale è il computer dell’utente: l’app legge e scrive soltanto il workbook scelto tramite dialoghi nativi e un piccolo file di preferenze. Non esistono backend, account, telemetria, pubblicità, analytics o sincronizzazione cloud integrata.

Il workbook è la fonte dati autorevole. I dati in memoria sono una copia validata usata per calcoli e UI; ogni comando valido genera un nuovo workbook verificato prima della sostituzione.

### 2. Asset da proteggere

- transazioni, patrimonio, investimenti, pensioni integrative/comparti, immobili, consumi domestici, automobili e spese condivise;
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
- I canali IPC sono una allowlist centralizzata. Ogni richiesta verifica l’identità del renderer, valida il payload con Zod e restituisce soltanto codici errore redatti.
- Il renderer non sceglie né invia percorsi file: creazione e apertura passano dai dialoghi nativi nel main process.
- Main, preload, dominio, persistenza, configurazione e renderer sono moduli separati.
- È ammessa una sola istanza dell’app, riducendo scritture concorrenti tra processi ContaMì.

### 5. Rete, navigazione e contenuti attivi

- In produzione la sessione Electron annulla richieste `http` e `https`.
- La Content Security Policy consente soltanto risorse locali; `object-src` e `base-uri` sono disabilitati. In sviluppo è ammesso solo il server locale Vite.
- Popup e nuove finestre sono negati; navigazioni fuori dalla pagina corrente e download avviati dal renderer sono bloccati.
- Tutte le richieste di permesso Electron sono negate.
- Non vengono caricati font, immagini, script o analytics remoti.

La CSP permette stili inline necessari alla UI corrente. Il rischio è mitigato dall’assenza di HTML non fidato e dall’escaping predefinito di React; una futura rimozione di `style-src 'unsafe-inline'` è auspicabile.

### 6. Validazione dati e workbook

- Entità, UUID, date ISO, timestamp, enum, testo, importi, quote e cardinalità massime sono validati con schemi Zod.
- Testo descrittivo: massimo 240 caratteri; note: massimo 2.000; importi e quantità hanno limiti finiti; le quote condivise devono riconciliare al centesimo.
- Sono accettati soltanto percorsi assoluti `.xlsx`, senza byte nulli e lunghi al massimo 4.096 caratteri.
- Il file in ingresso non può superare 250 MB e deve contenere `_Meta`, versione schema supportata e tutti i fogli richiesti.
- Lo schema v3 mantiene UUID espliciti tra transazioni e registrazioni collegate, incluse le spese dell’automobile. Le modifiche vengono propagate dal dominio; una cancellazione rimuove i record dipendenti, mentre categorie, metodi e tipi in uso restituiscono `ENTITY_IN_USE` e non possono lasciare riferimenti orfani. Il contatore mostrato nelle Impostazioni usa la stessa funzione di dominio della protezione dalla cancellazione e considera transazioni, immobili, investimenti, ricorrenze, spese condivise e automobile.
- I trasferimenti finanziari dichiarano esplicitamente l’effetto sulla liquidità (`inflow`, `outflow` o `neutral`). Il dominio applica tale direzione solo al saldo del conto e li esclude dai consuntivi di entrate/uscite, evitando che acquisti, vendite e versamenti vengano contabilizzati come spesa corrente.
- Pensioni e comparti riusano le tabelle Investimenti dello schema v3: il tipo tecnico `pension` è riservato e protetto da modifica/cancellazione, i moduli e i selettori escludono i raccoglitori dalle nuove destinazioni di movimento e la loro chiusura propaga stato e ricorrenze ai comparti. I selettori di dominio separano investimenti e pensioni e aggregano soltanto le posizioni finali attive, impedendo il doppio conteggio.
- I workbook v1 e v2 sono trasformati in memoria tramite migrazioni deterministiche e vengono convalidati integralmente come v3 prima di poter essere salvati.
- I consuntivi annuali dettagliati (`Property History`, `Investment History`, `Vehicle History`) contengono solo dati aggregati e identificativi interni; il rollover non copia le transazioni storiche nel nuovo workbook.
- Le stringhe utente vengono scritte come valori, non concatenate in formule. Il loader non esegue macro o formule; se incontra una cella formula legge il risultato memorizzato.
- Il file Numbers non viene modificato direttamente: su macOS è rigenerato importando il sidecar `.xlsx` tramite uno script AppleScript fisso.

Limite residuo: un `.xlsx` compresso sotto 250 MB può espandersi molto durante il parsing e causare consumo elevato di memoria. Lo schema limita le righe accettate dopo l’apertura, ma non costituisce una difesa completa contro zip bomb. Aprire solo file ContaMì affidabili.

### 7. Salvataggio, backup e conflitti

- Il nuovo workbook viene scritto in un file temporaneo nella stessa cartella.
- ContaMì lo rilegge e verifica fogli critici prima di sostituire il file attivo.
- La sostituzione usa rename e un file di rollback quando la piattaforma non consente la sovrascrittura diretta.
- Prima della sostituzione viene creata una copia in `.contami-backups`; sono mantenuti gli ultimi 10 backup `.xlsx`.
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
- L’audit npm è eseguito localmente e in CI; al 2026-07-18 riporta 0 vulnerabilità note dopo l’override compatibile di `uuid >=11.1.1` usato indirettamente da ExcelJS.
- Dependabot controlla settimanalmente npm e GitHub Actions.
- CI esegue document hygiene, lint, typecheck, test, build e audit su macOS e Windows.
- Le release su tag sono costruite da GitHub Actions e includono checksum SHA-256.

Rischi residui: le Actions sono referenziate con major tag, non SHA immutabili; una futura milestone dovrebbe fissare commit verificati. Gli artifact sono deliberatamente generati senza certificati, firma ad-hoc del bundle o notarizzazione. Bundle, metadati tecnici ed eseguibile macOS usano il nome ASCII `Contami` per evitare un crash del runtime unsigned su Apple Silicon; logo, titolo e UI mantengono il marchio `ContaMì`. Lo smoke test locale del bundle ARM non firmato, con Hardened Runtime predefinito, è riuscito. Gatekeeper richiede comunque l’approvazione esplicita in Privacy e Sicurezza e Windows può mostrare SmartScreen o bloccare l’app con Smart App Control. Checksum e istruzioni riducono il rischio operativo, ma non sostituiscono l’identità crittografica del produttore.

### 12. Verifiche implementate

- unit test per comandi, aggregazioni di consumi/automobili, separazione investimenti/pensioni senza doppio conteggio, protezione del tipo pensione, rollover, migrazione v1/v2→v3 e sincronizzazione bidirezionale/cancellazione;
- integrazione round-trip workbook e controllo file modificato esternamente;
- integrazione del recupero all’avvio quando il workbook ricordato è stato spostato o cancellato;
- test impostazioni atomiche e validate;
- lint, typecheck e build separata main/preload/renderer;
- audit dipendenze;
- verifica visiva e funzionale Playwright di tutte le viste, IT/EN e chiaro/scuro;
- rendering indipendente di un workbook sintetico, senza dati dell’utente;
- controllo CI che impedisce di tracciare `sources/`, `.numbers`, `.xlsx`, chiavi e certificati.

### 13. Risposta a incidenti e recupero

1. Chiudi ContaMì e le app che usano il workbook.
2. Copia il file sospetto senza modificarlo.
3. Recupera l’ultimo backup valido da `.contami-backups` o il workbook dell’anno precedente.
4. Verifica il checksum dell’installer e reinstalla da una release privata ufficiale se sospetti una manomissione.
5. Non allegare workbook reali a issue o log pubblici; usa una riproduzione sintetica.

### 14. Miglioramenti pianificati

- firma Developer ID/notarizzazione macOS e firma Authenticode Windows;
- pin SHA delle GitHub Actions;
- limiti preventivi sull’espansione ZIP e test fuzz per workbook ostili;
- test automatici del pacchetto installato su entrambi i sistemi;
- lock cooperativo e hash contenuto per una protezione concorrenza ancora più forte;
- opzione di cifratura documentata, se compatibile con Excel e Numbers senza compromettere il principio di portabilità.
- eventuali quotazioni immobiliari web e dati di mercato ISIN soltanto dopo scelta esplicita del provider, consenso, minimizzazione dei dati, cache, timeout, opt-out e gestione sicura delle chiavi; la versione corrente continua a bloccare la rete.

---

## English

### 1. Purpose and operating model

ContaMì is a local-first desktop app for personal financial data. Its primary trust boundary is the user’s computer: it reads and writes only a workbook selected through native dialogs and a small preferences file. There is no backend, account, telemetry, advertising, analytics, or built-in cloud sync.

The workbook is authoritative. In-memory data is a validated copy used for calculations and UI; each valid command produces a newly verified workbook before replacement.

### 2. Protected assets and threats

Protected assets include financial records—including investments, private pensions and compartments, household consumption, and vehicles—workbook/backup paths, schema and annual-summary integrity, preferences, and release artifacts. ContaMì does not collect credentials, passwords, PINs, tokens, or API keys.

Threats considered include malformed `.xlsx` input, a compromised renderer attempting privileged access, concurrent external edits, interrupted saves, formula injection, invalid paths/oversized files, unexpected navigation or network access, and supply-chain compromise. A compromised operating system, same-user malware, or unlocked physical access remains outside what the app alone can defend.

### 3. Privilege separation

- Electron enables context isolation, disabled Node integration, sandboxing, web security, and no insecure content.
- The preload exposes only a frozen, minimal ContaMì API—never raw IPC, Node.js, or generic filesystem methods.
- IPC uses a centralized allowlist, verifies the sender, validates all payloads with Zod, and returns redacted error codes.
- File paths come only from native main-process dialogs.
- Main, preload, domain, persistence, settings, and renderer remain separate modules.
- A single-instance lock reduces concurrent ContaMì writers.

### 4. Network and active content

Production Electron sessions cancel HTTP/HTTPS requests. CSP allows local resources only, disables objects and base URLs, and permits only the local Vite server during development. Popups, external navigation, renderer downloads, and all permission requests are denied. No remote font, image, script, or analytics endpoint is loaded.

Inline styles remain allowed for the current UI. React escaping and the absence of untrusted HTML mitigate this, but removing `style-src 'unsafe-inline'` is a future hardening target.

### 5. Data and workbook validation

Zod validates UUIDs, ISO dates, timestamps, enum values, text length, finite amounts, share reconciliation, and collection limits. Only absolute `.xlsx` paths up to 4,096 characters and files up to 250 MB are accepted. Required sheets, `_Meta`, and schema version must validate. Schema v3 uses explicit UUID links between transactions and mirrored records, including vehicle costs; domain propagation keeps them synchronized, cascade deletion removes dependants, and in-use catalogs return `ENTITY_IN_USE`. Financial transfers declare a validated cash effect (`inflow`, `outflow`, or `neutral`): it changes account liquidity while remaining outside income/expense actuals, so purchases, sales, and contributions are not misclassified as current spending. Version 1 and 2 data is deterministically migrated in memory and fully validated as v3 before save.

Pensions and compartments reuse the schema-v3 Investments tables. The technical `pension` type is reserved and protected against editing/deletion, forms and selectors exclude collectors from new movement targets, and closing one propagates state and recurring plans to its compartments. Domain selectors separate investments from pensions and aggregate active leaf positions only, preventing double counting. Detailed property, investment, and vehicle history sheets store annual aggregates only; rollover does not copy old transactions into the new workbook.

User strings are written as values, not interpolated into formulas. The loader never executes macros or formulas. A compressed workbook may still expand heavily before schema validation and exhaust memory; open trusted ContaMì files only.

### 6. Saves, backups, and conflicts

ContaMì writes a same-directory temporary workbook, reopens it to verify critical sheets, creates an adjacent backup, and then replaces the active file with rollback behavior. It retains 10 backups. Size and modification time detect external changes and block the next save until the workbook is reopened. Year rollover creates a new file and never deletes or moves the previous one.

If the remembered path no longer exists at startup (`ENOENT`), ContaMì creates or overwrites no file: it removes only the stale preference, uses an empty in-memory state, and requires the user to explicitly open or create a workbook. Schema and corruption errors are not treated as missing files.

A narrow race remains between conflict check and rename. External spreadsheet apps do not honor a ContaMì lock; avoid simultaneous edits. Backups provide recovery.

### 7. Numbers adapter

The adapter is macOS-only and detects Apple bundle id `com.apple.Numbers` at standard **Numbers** and **Numbers Creator Studio** locations under `/Applications` or `~/Applications`. It validates absolute `.xlsx`/`.numbers` paths and invokes a fixed AppleScript via `execFile` with separate arguments. It has a 60-second timeout and 64-KiB output cap. Temporary and rollback paths protect the previous copy; the interoperable `.xlsx` sidecar remains safe on failure. macOS automation consent may be required.

### 8. Preferences, secrets, logging, and encryption

`settings.json` stores language, theme, format, and paths only. It is atomically written with POSIX mode `0600`; Windows uses user-data-folder ACLs. Invalid settings fall back safely and never remove the workbook. The app creates no persistent application logs and does not print financial content.

Workbooks and backups are not encrypted by ContaMì. Use filesystem permissions, FileVault/BitLocker, session locking, and appropriate encrypted backups. No keychain is required because the app has no secrets.

### 9. Supply chain and verification

`package-lock.json` plus `npm ci` provide deterministic dependency resolution. As of 2026-07-18, npm audit reports zero known vulnerabilities after a compatible `uuid >=11.1.1` override for ExcelJS. Dependabot monitors npm and Actions weekly. CI runs hygiene checks, lint, typecheck, tests, build, and audit on macOS and Windows. Tagged releases are CI-built with SHA-256 checksums.

Residual risks: Actions use major tags rather than immutable SHAs; pinning verified commits is planned. Artifacts are deliberately built without certificates, bundle-level ad-hoc signing, or notarization. The macOS bundle, technical metadata, and executable use the ASCII name `Contami` to avoid an unsigned-runtime crash on Apple Silicon; the logo, title, and UI retain the `ContaMì` brand. The local unsigned ARM-bundle smoke test passed with the default Hardened Runtime. Gatekeeper still requires explicit approval under Privacy & Security, and Windows may show SmartScreen or block the app through Smart App Control. Checksums and instructions reduce operational risk but do not provide cryptographic publisher identity.

### 10. Tests and recovery

Implemented checks cover domain aggregation (including utilities and vehicles), investment/private-pension separation without double counting, reserved pension-type protection and rollover, v1/v2→v3 migration, bidirectional record synchronization and deletion, workbook round-trip, missing-workbook startup recovery, external-edit detection, validated atomic settings, builds, dependency audit, Playwright UI flows in both languages/themes, independent workbook rendering, and CI rejection of private sources/workbooks/keys.

For recovery: close all workbook users, preserve a copy of the suspect file, restore from `.contami-backups` or the prior-year workbook, verify installer checksums, and never attach real financial files to public issues—use synthetic reproduction data.

### 11. Planned improvements

Planned work includes macOS Developer ID signing/notarization and Windows Authenticode, Action SHA pinning, ZIP-expansion limits and hostile-workbook fuzzing, packaged-app smoke tests on both systems, stronger cooperative locking/content hashing, and an optional portable encryption design if it remains compatible with Excel and Numbers. Web property estimates and ISIN market data remain gated on explicit provider selection, consent, data minimization, caching, timeouts, opt-out, and safe secret handling; current builds continue to block network access.
