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
│   └── reference-analysis.md          # analisi priva di PII del Numbers sorgente
├── scripts/
│   ├── build-electron.mjs             # build separata main + preload
│   ├── check-required-docs.mjs         # controllo documenti e file privati
│   ├── generate-demo-workbook.ts       # workbook sintetico per QA, mai dati reali
│   └── numbers-mirror.applescript      # import xlsx in Numbers su macOS
├── sources/                            # input privati locali, esclusi da Git/build
├── src/
│   ├── config/
│   │   └── appConfig.ts                # limiti e parametri applicativi centrali
│   ├── domain/
│   │   ├── commands.ts                 # comandi validati e tipi azione
│   │   ├── finance.ts                  # aggregazioni, KPI e applicazione comandi
│   │   ├── models.ts                   # schema Zod e modello finanziario
│   │   └── rollover.ts                 # trasformazione pura del passaggio d’anno
│   ├── infrastructure/
│   │   ├── settings/
│   │   │   └── SettingsService.ts      # preferenze locali atomiche
│   │   └── spreadsheet/
│   │       ├── ExcelWorkbookRepository.ts # lettura/scrittura, backup e verifica xlsx
│   │       ├── NumbersMirrorService.ts # adattatore nativo macOS isolato
│   │       ├── WorkbookRevisionGuard.ts # conflitti con modifiche esterne
│   │       └── workbookSchema.ts       # fogli, colonne e versione schema
│   ├── main/
│   │   ├── index.ts                    # processo privilegiato Electron e hardening
│   │   ├── ipc/registerIpc.ts          # allowlist IPC e validazione confini
│   │   └── services/FinanceFileService.ts # casi d’uso file, save e rollover
│   ├── preload/
│   │   └── index.ts                    # bridge minimo e congelato verso la UI
│   ├── renderer/
│   │   ├── components/                 # shell, KPI, modali, header e stati vuoti
│   │   ├── forms/                      # moduli di inserimento per ogni dominio
│   │   ├── i18n/                       # dizionari IT/EN e provider lingua
│   │   ├── services/api.ts             # bridge reale + demo locale di sviluppo
│   │   ├── theme/ThemeProvider.tsx     # tema sistema/chiaro/scuro reattivo
│   │   ├── utils/                      # formati e salvataggi UI sicuri
│   │   ├── views/                      # dashboard e liste tematiche lazy-loaded
│   │   ├── App.tsx                     # orchestrazione UI e stato applicativo
│   │   ├── main.tsx                    # entry point React
│   │   └── styles.css                  # design system ContaMì responsive
│   ├── shared/
│   │   ├── contracts.ts                # contratti tipizzati main/preload/renderer
│   │   └── ipc.ts                      # nomi canali IPC consentiti
│   └── test/setup.ts                   # ambiente comune Vitest
├── tests/
│   ├── integration/
│   │   ├── revision-guard.test.ts      # blocco modifiche concorrenti
│   │   ├── settings.test.ts            # preferenze validate e atomiche
│   │   └── workbook.test.ts            # round-trip e schema leggibile
│   └── unit/
│       ├── finance.test.ts              # comandi e KPI finanziari
│       └── rollover.test.ts             # nuovo anno e riconciliazione
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
├── tsconfig.json                        # compilazione e tipi
├── vite.config.ts                       # build renderer
└── vitest.config.ts                     # test unitari e integrazione

Generati, non versionati / Generated, not versioned:
├── node_modules/                        # dipendenze locali
├── dist/                                # renderer di produzione
├── dist-electron/                       # main e preload compilati
├── release/                             # DMG/ZIP/NSIS e metadata
├── coverage/                            # copertura test
└── .playwright-cli/                     # snapshot del collaudo UI locale
```

## Dipendenze tra livelli / Layer direction

```text
Renderer UI ──typed bridge──> Preload ──validated IPC──> Main service
     │                                                    │
     └── shared contracts <── Domain rules ───────────────┤
                                                          ├── Settings
                                                          └── Spreadsheet adapters
                                                               ├── canonical .xlsx
                                                               └── optional .numbers mirror
```

Il renderer non importa moduli Node/Electron privilegiati. Il dominio non dipende dalla UI. `FinanceFileService` coordina dialoghi, dominio e persistenza; i dettagli Excel/Numbers restano negli adapter.

The renderer imports no privileged Node/Electron modules. Domain code is UI-independent. `FinanceFileService` coordinates dialogs, domain rules, and persistence; Excel/Numbers details remain inside adapters.

## File da non modificare o pubblicare / Files not to edit or publish

- `sources/` e ogni `.numbers`/`.xlsx` locale possono contenere dati finanziari reali e sono esclusi da Git e packaging.
- `_Meta` dentro un workbook è gestito dall’app; non rinominare fogli o colonne.
- `dist/`, `dist-electron/`, `release/` e `node_modules/` sono rigenerabili.
- `.contami-backups` è una cartella dell’utente accanto al workbook, non parte del repository.

- `sources/` and local `.numbers`/`.xlsx` files may contain real financial data and are excluded from Git and packages.
- Workbook `_Meta`, sheet names, and columns are app-managed.
- Build/dependency folders are reproducible generated output.
- `.contami-backups` belongs beside the user workbook, not in this repository.
