![ContaMì](assets/logo.png)

# ContaMì

ContaMì è un’app desktop local-first per gestire finanze personali articolate mantenendo un foglio di calcolo leggibile come fonte dati durevole. È bilingue italiano/inglese, segue il tema del sistema e funziona su macOS e Windows.

ContaMì is a local-first desktop app for managing detailed personal finances while keeping a readable spreadsheet as the durable data source. It is bilingual (Italian/English), follows the system theme, and targets macOS and Windows.

> Stato / Status: **1.1.0 — configurable taxes milestone** · Licenza / License: **Apache-2.0**

## Funzioni principali / Key features

- Dashboard generale con confronti storici per patrimonio, liquidità, immobili, investimenti e pensioni integrative, entrate, uscite e impegni periodici.
- Registrazioni collegate e bidirezionali: un movimento inserito in Transazioni, Immobili, Automobile, Investimenti, Pensione Integrativa, Ricorrenze o Spese condivise viene riflesso nelle viste pertinenti senza reinserirlo.
- Ricerca e filtri mensili con parziali; dettaglio e CRUD controllato per immobili, automobili, investimenti, pensioni/comparti, movimenti, ricorrenze e spese condivise.
- Schede immobili filtrabili sui dodici mesi e per descrizione, con valutazione totale o calcolata in €/m², inserimenti guidati per utenze (incluse fasce elettriche) e tasse configurabili, opzione di inclusione nel riepilogo delle spese comuni, consuntivi annuali e grafici che seguono le date delle registrazioni; i costi confluiscono nelle Transazioni e possono essere condivisi.
- Grafici per ogni investimento e comparto pensione che confrontano nel tempo cifra investita e controvalore. Versamenti, liquidazioni e valutazioni aggiornano il controvalore in ordine temporale; il versamento iniziale crea anche la Transazione collegata. I movimenti patrimoniali usano trasferimenti con direzione di cassa senza gonfiare entrate o uscite correnti.
- Area Pensione Integrativa separata: ogni pensione è un raccoglitore e ogni comparto collegato conserva valore, movimenti ed eventuale versamento periodico; il totale del raccoglitore non duplica quello dei comparti.
- Data, descrizione, categoria, metodo di pagamento e importo validati a ogni inserimento pertinente.
- Chiusura e riapertura logica di conti, immobili, investimenti, pensioni/comparti e ricorrenze senza perdere lo storico.
- Workbook `.xlsx` portabile su macOS e Windows; copia `.numbers` nativa su macOS quando Apple Numbers è installato.
- Passaggio d’anno guidato: il file precedente resta intatto, mentre il nuovo conserva anagrafiche attive, saldi di apertura, ultime valutazioni e consuntivi annuali dettagliati per immobili/utenze, investimenti/comparti e automobili.
- Salvataggio locale verificato, sostituzione atomica, fino a 10 backup e blocco se il file è stato modificato da un’altra app.
- Avvio recuperabile se il workbook configurato è stato spostato o cancellato: l’app torna allo stato non configurato e permette di aprire o creare un file.
- Nessun account, cloud, telemetria o richiesta di rete durante l’uso normale.

---

- Overall dashboard with historical comparisons for net worth, liquidity, properties, investments and private pensions, income, expenses, and recurring commitments.
- Bidirectional linked records: a movement entered under Transactions, Properties, Vehicles, Investments, Private Pension, Recurring Items, or Shared Expenses is reflected in every relevant view without re-entry.
- Monthly search/filters with subtotals; controlled detail and CRUD for properties, vehicles, investments, pensions/compartments, movements, recurring items, and shared expenses.
- Property records can be filtered across all twelve months and by description, and support total or per-square-metre valuations, guided utility entries (including electricity bands), configurable taxes, optional inclusion in the common property-expense summary, yearly actuals, date-based charts, and optional shared-expense links; costs are mirrored to Transactions.
- Per-position investment and pension-compartment charts compare invested amount with countervalue over time. Contributions, withdrawals, and valuations update countervalue chronologically, and an initial contribution creates its linked Transaction. Asset movements update liquidity without inflating current income or expenses.
- A dedicated Private Pension area: every pension is a collector and each linked compartment keeps its value, movements, and optional periodic contribution; collector totals never double-count compartments.
- Date, description, category, payment method, and amount validation wherever applicable.
- Logical close/reopen for accounts, properties, investments, pensions/compartments, and recurring items without losing history.
- Portable `.xlsx` workbook on macOS and Windows; native `.numbers` mirror on macOS when Apple Numbers is installed.
- Guided year rollover: the previous file stays untouched while the new one carries active registries, opening balances, latest valuations, and detailed annual actuals for properties/utilities, investments/compartments, and vehicles.
- Verified local saves, atomic replacement, up to 10 backups, and conflict protection when another app changes the file.
- Recoverable startup when the configured workbook was moved or deleted: the app returns to its unconfigured state and lets the user open or create a file.
- No account, cloud, telemetry, or network request during normal use.

## Installazione rapida / Quick install

Le build di release sono generate da GitHub Actions senza certificati e senza applicare una firma ad-hoc al bundle. Gli artifact sono pubblicati nella sezione Releases:

1. scarica il pacchetto per macOS o Windows e il file `SHA256SUMS.txt`;
2. verifica il checksum;
3. installa e avvia ContaMì seguendo, se necessario, le istruzioni per l’avviso del sistema riportate sotto;
4. scegli **Crea nuovo foglio** oppure **Apri foglio esistente**.

Release builds are produced by GitHub Actions without certificates and without applying an ad-hoc signature to the bundle. Artifacts are published under Releases:

1. download the macOS or Windows package and `SHA256SUMS.txt`;
2. verify the checksum;
3. install and launch ContaMì, following the operating-system warning instructions below if needed;
4. choose **Create new workbook** or **Open existing workbook**.

Consulta [QUICK-START_Desktop.md](QUICK-START_Desktop.md), [ISTRUZIONI.md](ISTRUZIONI.md) o [INSTRUCTIONS.md](INSTRUCTIONS.md).

### Primo avvio non firmato / First unsigned launch

**macOS:** apri il DMG, trascina `Contami` in Applicazioni e prova ad avviarla. Se macOS non può verificare lo sviluppatore, chiudi l’avviso, apri **Impostazioni di Sistema → Privacy e sicurezza**, premi **Apri comunque** per `Contami` e conferma. Fallo soltanto dopo aver verificato il checksum della release. Non disabilitare Gatekeeper globalmente. Procedura Apple: [aprire un’app da uno sviluppatore non identificato](https://support.apple.com/guide/mac-help/mh40616/mac).

**Windows:** avvia il file `Setup.exe`. Se SmartScreen mostra **PC protetto da Windows**, seleziona **Ulteriori informazioni → Esegui comunque** soltanto dopo aver verificato il checksum. Se Smart App Control blocca il file senza offrire un’eccezione, non disattivare la protezione per ContaMì: usa l’avvio dal sorgente o attendi una futura build firmata. Informazioni Microsoft: [protezione dalle app non riconosciute](https://support.microsoft.com/en-us/office/protect-my-pc-from-viruses) e [Smart App Control](https://support.microsoft.com/windows/smart-app-control-frequently-asked-questions-285ea03d-fa88-4d56-882e-6698afdb7003).

**macOS:** open the DMG, drag `Contami` to Applications, and try to launch it. If macOS cannot verify the developer, close the warning, open **System Settings → Privacy & Security**, choose **Open Anyway** for `Contami`, and confirm. Do this only after verifying the release checksum. Do not disable Gatekeeper globally. Apple procedure: [open an app from an unidentified developer](https://support.apple.com/guide/mac-help/mh40616/mac).

**Windows:** run `Setup.exe`. If SmartScreen displays **Windows protected your PC**, choose **More info → Run anyway** only after verifying the checksum. If Smart App Control blocks the file without an exception, do not turn off that protection for ContaMì: run from source or wait for a future signed build. Microsoft guidance: [unrecognized-app protection](https://support.microsoft.com/en-us/office/protect-my-pc-from-viruses) and [Smart App Control](https://support.microsoft.com/windows/smart-app-control-frequently-asked-questions-285ea03d-fa88-4d56-882e-6698afdb7003).

Per compatibilità delle build macOS non firmate, file, bundle ed eseguibile usano il nome tecnico ASCII `Contami`; logo, titolo e interfaccia mantengono il marchio **ContaMì**. For unsigned macOS-build compatibility, files, bundle, and executable use the ASCII technical name `Contami`; the logo, window title, and UI retain the **ContaMì** brand.

## Formati del foglio / Spreadsheet formats

| Formato | macOS | Windows | Note |
|---|---:|---:|---|
| Excel `.xlsx` | Sì | Sì | Formato interoperabile canonico; apribile anche in Numbers. |
| Numbers `.numbers` | Sì | No | Richiede Apple Numbers, incluso quando installato come **Numbers Creator Studio**. ContaMì conserva anche un sidecar `.contami.xlsx` per recupero e compatibilità. |

Il file Numbers originale in `sources/` è materiale privato di riferimento: non viene incluso in Git, build o release. ContaMì usa un proprio schema normalizzato e non modifica quel documento.

The original Numbers file under `sources/` is private reference material: it is never included in Git, builds, or releases. ContaMì uses its own normalized schema and does not modify that document.

## Configurazione / Configuration

Da **Impostazioni / Settings** puoi scegliere lingua (`Sistema`, `Italiano`, `English`), tema (`Sistema`, `Chiaro`, `Scuro`), formato dei nuovi workbook e gestire conti, categorie, metodi di pagamento, tipi di investimento e tasse immobiliari. Ogni tassa definisce nome, immobili applicabili e numero di rate da 1 a 24. Le tasse usate possono essere archiviate e riaperte, mentre la cancellazione definitiva è consentita soltanto quando non esistono registrazioni collegate. Categorie, metodi e tipi possono essere creati, modificati e cancellati quando non sono in uso; le categorie sono distinte come entrata, uscita o entrambe. Un badge mostra il numero di utilizzi. Il tipo tecnico `pension` è riservato alla sezione Pensione Integrativa e non è modificabile dal catalogo.

Under **Settings** you can select language (`System`, `Italiano`, `English`), theme (`System`, `Light`, `Dark`), the format for new workbooks, and manage accounts, categories, payment methods, investment types, and property taxes. Each tax defines its name, applicable properties, and 1–24 instalments. Referenced taxes can be archived and reopened; permanent deletion is available only when no records use them. Categories, methods, and types can be created, edited, and deleted when unused; categories are classified as income, expense, or both. A compact badge shows usage counts. The technical `pension` type is reserved for the Private Pension section and cannot be changed through the catalog.

## Sviluppo locale / Local development

Requisiti: Node.js **22.12 o successivo**, npm e Git.

```bash
npm install
npm run dev
```

Controlli completi:

```bash
npm run preflight
npm run test:e2e:install
npm run test:e2e
npm audit
```

Build e pacchetti:

```bash
npm run build
npm run dist:mac
npm run dist:win
npm run test:package:inspect
npm run test:smoke:packaged
npm run test:smoke:installed
```

`test:e2e:install` scarica Chromium una sola volta per il collaudo Playwright. `dist:mac` va eseguito su macOS e `dist:win` preferibilmente su Windows; dopo il packaging, `test:smoke:packaged` avvia l’eseguibile unpacked compatibile con la macchina corrente. La CI esegue questi controlli sulle rispettive piattaforme. Nessun file in `sources/` o workbook locale viene incluso nel pacchetto.

Il workflow di release esegue inoltre `test:package:inspect` sul contenuto effettivo di `app.asar` e `test:smoke:installed`: monta e copia il DMG in un’area temporanea su macOS oppure installa l’NSIS in una directory temporanea su Windows, avvia l’app e ne verifica la rimozione. Questi gate vengono eseguiti soltanto sui runner della piattaforma corrispondente.

The release workflow also runs `test:package:inspect` against the actual `app.asar` content and `test:smoke:installed`: it mounts and copies the DMG into a temporary macOS location or installs NSIS into a temporary Windows directory, launches the app, and verifies removal. These gates run only on matching platform runners.

## Sicurezza e privacy / Security and privacy

Il renderer Electron è isolato e in sandbox, non ha Node.js, usa un bridge minimo e IPC validato. Popup, navigazioni, download, permessi e traffico remoto sono bloccati. I file sono limitati a `.xlsx` scelti dall’utente; la copia Numbers usa uno script AppleScript fisso e argomenti separati. Dettagli, limiti e modello delle minacce sono in [SECURITY_MODEL.md](SECURITY_MODEL.md).

The Electron renderer is isolated and sandboxed, has no Node.js access, and uses a minimal validated IPC bridge. Popups, navigation, downloads, permissions, and remote traffic are blocked. Files are limited to user-selected `.xlsx` paths; the Numbers mirror uses a fixed AppleScript with separate arguments. See [SECURITY_MODEL.md](SECURITY_MODEL.md) for controls, limitations, and threat model.

## Documentazione / Documentation

- [Manuale italiano](ISTRUZIONI.md)
- [English manual](INSTRUCTIONS.md)
- [Desktop quick start](QUICK-START_Desktop.md)
- [Security model / Modello di sicurezza](SECURITY_MODEL.md)
- [Repository map / Mappa](MAP.md)
- [Development plan / Piano](PLAN.md)
- [Reference workbook analysis](docs/reference-analysis.md)

## Licenza / License

Copyright 2026 ContaMì contributors. Distribuito secondo [Apache License 2.0](LICENSE).

Copyright 2026 ContaMì contributors. Distributed under the [Apache License 2.0](LICENSE).
