# ContaMì — Mappa del repository / Repository map

## Mappa ASCII / ASCII map

```text
ContaMì/
├── .github/
│   ├── dependabot.yml                 # aggiornamenti dipendenze / dependency updates
│   └── workflows/
│       ├── ci.yml                     # qualità macOS + Windows / cross-platform quality
│       └── release.yml                # pacchetti, checksum e release / packages and release
├── assets/
│   ├── icon.ico                       # icona Windows / Windows icon
│   ├── icon.png                       # icona macOS e UI / macOS and UI icon
│   └── logo.png                       # logo GitHub e riferimento visivo / brand logo
├── docs/
│   ├── import-template-spec.md        # contratti versionati degli otto template Excel
│   ├── import-guide.md                # compilazione, anteprima, errori e recupero IT/EN
│   └── reference-analysis.md          # analisi priva di PII del Numbers sorgente
├── scripts/
│   ├── build-electron.mjs             # build separata main + preload
│   ├── after-pack.mjs                  # chiude eccezioni di rete nel bundle macOS
│   ├── check-required-docs.mjs         # controllo documenti e file privati
│   ├── generate-demo-workbook.ts       # workbook sintetico per QA, mai dati reali
│   ├── inspect-packaged.mjs             # ispezione app.asar e assenza contenuti privati
│   ├── numbers-mirror.applescript      # import xlsx in Numbers su macOS
│   ├── smoke-packaged.mjs              # avvio controllato del pacchetto unpacked macOS/Windows
│   └── smoke-installed.mjs             # installazione, avvio e rimozione DMG/NSIS in area temporanea
├── sources/                            # input privati locali, esclusi da Git/build
├── src/
│   ├── config/
│   │   └── appConfig.ts                # limiti e parametri applicativi centrali
│   ├── domain/
│   │   ├── accounts.ts                # saldi di conti/Casse, compatibilità metodi e trasferimenti interni
│   │   ├── catalogDefaults.ts          # tipi investimento e tasse iniziali / default investment and tax types
│   │   ├── catalogUsage.ts             # conteggio riferimenti per cataloghi / catalog usage counts
│   │   ├── annualHistory.ts            # consuntivi annuali dettagliati per immobili, investimenti e veicoli
│   │   ├── commands.ts                 # comandi validati e tipi azione
│   │   ├── finance.ts                  # aggregazioni, KPI, saldi filtrati separati Conto/Cassa e applicazione comandi
│   │   ├── investments.ts              # classificazione e totali distinti investimenti/pensioni
│   │   ├── investmentTransactionSync.ts # coppie movimento/Transazione e riconciliazione idempotente
│   │   ├── importTemplates.ts           # contratti versionati e liste chiuse dei template di importazione
│   │   ├── imports.ts                   # strategie, anteprima e piano import tipizzati
│   │   ├── linkedRecords.ts            # sincronizzazione bidirezionale e ciclo di vita delle rate
│   │   ├── operationalDataRepair.ts     # riparazione conservativa conti mancanti e piani rateali conclusi
│   │   ├── propertyMetrics.ts          # classificazione utenze/condominio per immobili
│   │   ├── rent.ts                     # stato rate affitto da competenza e incasso effettivo
│   │   ├── recurringRates.ts           # tariffa per decorrenza, anteprima e protezione dello storico
│   │   ├── migrations.ts               # migrazione workbook v1–v8 → v9 senza riscrivere importi
│   │   ├── models.ts                   # schema Zod v9 e modello finanziario
│   │   ├── uuidRepair.ts               # unicità UUID e riallineamento conservativo dei collegamenti
│   │   └── rollover.ts                 # passaggio d’anno, rate residue e affitti insoluti
│   ├── infrastructure/
│   │   ├── settings/
│   │   │   └── SettingsService.ts      # preferenze locali atomiche
│   │   └── spreadsheet/
│   │       ├── ExcelImportTemplateGenerator.ts # template xlsx passivi, validati e riletti
│   │       ├── ExcelImportTemplateParser.ts # parser, riferimenti e piani per gli otto template
│   │       ├── ExcelWorkbookRepository.ts # lettura/scrittura, backup e verifica xlsx
│   │       ├── NumbersMirrorService.ts # adattatore nativo macOS isolato
│   │       ├── WorkbookRevisionGuard.ts # conflitti con modifiche esterne
│   │       ├── XlsxImportPreflight.ts   # limiti ZIP e blocco contenuto attivo
│   │       └── workbookSchema.ts       # fogli, colonne e versione schema
│   ├── main/
│   │   ├── index.ts                    # processo privilegiato Electron e hardening
│   │   ├── ipc/registerIpc.ts          # allowlist IPC e validazione confini
│   │   └── services/
│   │       ├── FinanceFileService.ts    # casi d’uso file, save e rollover
│   │       ├── ImportDataService.ts      # dialogo, anteprima opaca, conferma e scadenza
│   │       └── ImportTemplateService.ts # dialogo nativo e generazione template isolata
│   ├── preload/
│   │   └── index.ts                    # bridge minimo e congelato verso la UI
│   ├── renderer/
│   │   ├── components/                 # shell, KPI, modali, dettagli, grafici storici e stati vuoti
│   │   │   ├── EntryFilters.tsx        # filtri condivisi descrizione/mese con reset accessibile
│   │   │   ├── ImportPreviewDialog.tsx # riepilogo, diagnostica e conferma accessibile
│   │   │   ├── PaymentAccountField.tsx # selezione coerente di conto o Cassa per metodo
│   │   │   └── RecurringRateChangesEditor.tsx # cronologia, anteprima e conferma tariffa
│   │   ├── forms/                      # moduli di inserimento per ogni dominio
│   │   │   ├── AccountForm.tsx     # conti ordinari e Casse con alimentazione predefinita
│   │   │   ├── InvestmentForms.tsx  # investimenti non pensionistici e movimenti
│   │   │   ├── PensionForms.tsx     # pensioni-raccoglitore e comparti associati
│   │   │   ├── PropertyExpenseForms.tsx # utenze/tasse, consumi e quote condivise
│   │   │   ├── CatalogForms.tsx     # categorie, metodi, tipi investimento e tasse configurabili
│   │   │   └── VehicleForms.tsx     # anagrafica automobile e costi/consumi
│   │   ├── i18n/                       # dizionari IT/EN e provider lingua
│   │   ├── services/api.ts             # bridge reale + demo locale di sviluppo
│   │   ├── theme/ThemeProvider.tsx     # tema sistema/chiaro/scuro reattivo
│   │   ├── utils/                      # formati, liste as-of-today, indicatori e serie storiche
│   │   │   ├── detailFilters.ts        # logica pura condivisa per descrizione, mese e opzioni annuali
│   │   │   ├── investmentHistory.ts    # tutte le osservazioni di investito/controvalore, inclusi i raccoglitori pensione
│   │   │   ├── overviewTransactions.ts # recenti confermati / confirmed recent records
│   │   │   ├── propertyHistory.ts      # serie, mesi e filtri delle registrazioni immobiliari
│   │   │   ├── propertyIndicators.ts   # indicatori residenza / residence indicators
│   │   │   └── vehicleHistory.ts       # serie annuali, vita intera e confronto costo/km per vettura
│   │   ├── views/                      # dashboard e liste tematiche lazy-loaded
│   │   │   ├── OverviewView.tsx     # patrimonio, liquidità e saldo complessivo delle Casse
│   │   │   ├── TransactionsView.tsx # filtri e due file di KPI separati tra conti e Casse
│   │   │   ├── InvestmentsView.tsx  # portafoglio privo delle pensioni integrative
│   │   │   ├── PensionsView.tsx     # dashboard pensioni, comparti, dettagli e CRUD
│   │   │   └── VehiclesView.tsx     # dashboard automobili, confronto e registrazioni
│   │   ├── App.tsx                     # orchestrazione UI e stato applicativo
│   │   ├── main.tsx                    # entry point React
│   │   ├── linked-workflows.css        # filtri, badge, dettagli e stampa
│   │   └── styles.css                  # design system ContaMì responsive
│   ├── shared/
│   │   ├── contracts.ts                # contratti tipizzati main/preload/renderer
│   │   ├── ipc.ts                      # nomi canali IPC consentiti
│   │   └── ipcValidation.ts            # tuple e limiti degli argomenti IPC
│   └── test/setup.ts                   # ambiente comune Vitest
├── tests/
│   ├── e2e/
│   │   ├── accessibility.spec.ts       # IT/EN, chiaro/scuro, focus e layout a 1080 px
│   │   └── cash-registers.spec.ts      # Casse, trasferimenti, KPI separati e indicatori di perdita
│   ├── integration/
│   │   ├── finance-file-service.test.ts # recupero avvio senza workbook configurato
│   │   ├── import-template-generator.test.ts # struttura, liste e limite dei template
│   │   ├── import-template-parser.test.ts # otto import, sicurezza, riferimenti e duplicati
│   │   ├── import-data-service.test.ts # anteprima/annullamento/conferma senza percorsi
│   │   ├── import-template-service.test.ts # dialogo e mancata esposizione del percorso
│   │   ├── revision-guard.test.ts      # blocco modifiche concorrenti
│   │   ├── settings.test.ts            # preferenze validate e atomiche
│   │   └── workbook.test.ts            # round-trip e schema leggibile
│   └── unit/
│       ├── accounts.test.ts             # saldi Casse, trasferimenti interni e vincoli metodo
│       ├── finance.test.ts              # comandi e KPI finanziari
│       ├── detailFilters.test.tsx       # combinazione/reset dei filtri condivisi IT/EN
│       ├── dialogAccessibility.test.tsx # focus trap, ripristino focus e nomi accessibili
│       ├── ipcValidation.test.ts         # payload e arità dei canali privilegiati
│       ├── performance.test.ts           # budget dashboard su dataset sintetico ampio
│       ├── annualHistory.test.ts        # aggregati utenze e automobili
│       ├── catalogUsage.test.ts         # conteggi uso categorie/metodi e protezione riferimenti
│       ├── historyViews.test.ts          # filtri immobili, serie investimenti e totali vetture
│       ├── investments.test.ts          # separazione pensioni, aggregati e vincoli raccoglitore
│       ├── investmentTransactionSync.test.ts # sincronizzazione, riparazione e casi ambigui
│       ├── importTemplates.test.ts       # contratti e chiavi gerarchiche degli otto template
│       ├── import-preview-dialog.test.tsx # riepilogo IT/EN e conferma accessibile
│       ├── taxTypes.test.ts              # CRUD, archiviazione e vincoli del catalogo tasse
│       ├── linkedRecords.test.ts         # collegamenti, limiti e chiusura delle ricorrenze
│       ├── migrations.test.ts            # compatibilità schema v1–v8 → v9
│       ├── recurringRates.test.ts        # decorrenze, storico, collegamenti e rollover tariffario
│       ├── overviewTransactions.test.ts  # liste recenti alla data odierna / as-of-today lists
│       ├── propertyIndicators.test.ts    # indicatori residenza bilingui / bilingual residence indicators
│       ├── uuidRepair.test.ts             # collisioni UUID e collegamenti conservati
│       └── rollover.test.ts             # nuovo anno, riconciliazione e rate a cavallo d’anno
├── AGENTS.md                            # regole per agenti e maintainer
├── INSTRUCTIONS.md                     # manuale utente inglese
├── ISTRUZIONI.md                       # manuale utente italiano
├── LICENSE                              # Apache License 2.0
├── MAP.md                               # questo documento / this document
├── PLAN.md                              # milestone, branch e criteri
├── QUICK-START_Desktop.md               # avvio rapido bilingue
├── README.md                            # pagina GitHub bilingue
├── SECURITY_MODEL.md                    # controlli, minacce e limiti bilingui
├── STARTUP_PREFERENCES.md               # preferenze progettuali del proprietario
├── index.html                           # host renderer e CSP
├── package.json / package-lock.json     # comandi, dipendenze e packaging
├── eslint.config.js                     # qualità TypeScript/React
├── playwright.config.ts                 # browser QA riproducibile a 1080 px
├── tsconfig.json                        # compilazione e tipi
├── vite.config.ts                       # build renderer
└── vitest.config.ts                     # test unitari e integrazione

Generati, non versionati / Generated, not versioned:
├── node_modules/                        # dipendenze locali
├── dist/                                # renderer di produzione
├── dist-electron/                       # main e preload compilati
├── release/                             # DMG/ZIP/NSIS e metadata
├── coverage/                            # copertura test
├── outputs/                             # workbook personali/locali, esclusi da Git
├── output/playwright/                   # screenshot QA locali / local UI QA screenshots
├── tmp/                                 # lavorazioni temporanee locali
└── .playwright-cli/                     # snapshot del collaudo UI locale
```

## Dipendenze tra livelli / Layer direction

```text
Renderer UI ──typed bridge──> Preload ──validated IPC──> Main service
     │                                                    │
     └── shared contracts <── Domain rules ───────────────┤
                                                          ├── Settings
                                                          └── Spreadsheet adapters
                                                               ├── canonical .xlsx v9 + migrations
                                                               └── optional .numbers mirror
```

Il renderer non importa moduli Node/Electron privilegiati. Il dominio non dipende dalla UI. `FinanceFileService` coordina dialoghi, dominio e persistenza; i dettagli Excel/Numbers restano negli adapter.

The renderer imports no privileged Node/Electron modules. Domain code is UI-independent. `FinanceFileService` coordinates dialogs, domain rules, and persistence; Excel/Numbers details remain inside adapters.

## File da non modificare o pubblicare / Files not to edit or publish

- `sources/` e ogni `.numbers`/`.xlsx` locale possono contenere dati finanziari reali e sono esclusi da Git e packaging.
- `_Meta` dentro un workbook è gestito dall’app; non rinominare fogli o colonne.
- `outputs/` e `tmp/` contengono risultati locali o temporanei e non vanno pubblicati.
- `dist/`, `dist-electron/`, `release/` e `node_modules/` sono rigenerabili.
- `.contami-backups` è una cartella dell’utente accanto al workbook, non parte del repository.

- `sources/` and local `.numbers`/`.xlsx` files may contain real financial data and are excluded from Git and packages.
- Workbook `_Meta`, sheet names, and columns are app-managed.
- `outputs/` and `tmp/` contain local or temporary artifacts and must not be published.
- Build/dependency folders are reproducible generated output.
- `.contami-backups` belongs beside the user workbook, not in this repository.
