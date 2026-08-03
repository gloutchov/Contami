![ContaMì](assets/logo.png)

# ContaMì

ContaMì è un’app desktop local-first per gestire finanze personali articolate mantenendo un foglio di calcolo leggibile come fonte dati durevole. È bilingue italiano/inglese, segue il tema del sistema e funziona su macOS e Windows.

ContaMì is a local-first desktop app for managing detailed personal finances while keeping a readable spreadsheet as the durable data source. It is bilingual (Italian/English), follows the system theme, and targets macOS and Windows.

> Stato / Status: **1.11.0 — apertura workbook con preflight ZIP / workbook-opening ZIP preflight** · Licenza / License: **Apache-2.0**

## Funzioni principali / Key features

- Dashboard generale con saldo Cassa e confronti storici per patrimonio, liquidità, immobili, investimenti e pensioni integrative, entrate, uscite e impegni periodici.
- Registrazioni collegate e bidirezionali: un movimento inserito in Transazioni, Immobili, Automobile, Investimenti, Pensione Integrativa, Ricorrenze o Spese condivise viene riflesso nelle viste pertinenti senza reinserirlo.
- Filtri combinabili e azzerabili in Transazioni, con Entrate/Uscite/Saldo filtrati separati tra conti e Casse; ricerca per descrizione e mese con parziali nelle spese comuni, nelle modali di automobili, investimenti e comparti pensione e nelle spese condivise; dettaglio e CRUD restano controllati.
- Schede immobili filtrabili sui dodici mesi e per descrizione, con valutazione totale o calcolata in €/m², affitti ricorrenti che separano scadenza/competenza e data effettiva di incasso, tabella delle rate pagate/in ritardo/insolute/future, inserimenti guidati per utenze (incluse fasce elettriche) e tasse configurabili, opzione di inclusione nel riepilogo delle spese comuni, consuntivi annuali e grafici che seguono le date delle registrazioni; i costi confluiscono nelle Transazioni e possono essere condivisi.
- Casse personali, familiari o aziendali separate dai conti bancari: un movimento in contanti modifica soltanto la Cassa scelta; un prelievo è un trasferimento interno conto→Cassa che aggiorna entrambi i saldi senza alterare la liquidità totale.
- Il modulo Automobile può creare e modificare un finanziamento facoltativo insieme al mezzo: esiste una sola Ricorrenza collegata, ogni scadenza genera una registrazione `Pagamento rateale`, chiusura/riapertura restano sincronizzate e lo storico confermato non viene cancellato.
- Grafici per ogni investimento e comparto pensione che confrontano nel tempo capitale investito e controvalore. I box mostrano il valore in rosso quando il controvalore è inferiore al capitale netto investito. **Aggiorna valore** è disponibile anche nella modale del singolo investimento. Ogni Versamento o Liquidazione, una tantum o periodico, richiede il conto o la Cassa interessati e mantiene una sola Transazione collegata come trasferimento con direzione di cassa: modifica liquidità e totalizzatori di cassa senza gonfiare redditi o spese correnti.
- Area Pensione Integrativa separata: ogni pensione è un raccoglitore e ogni comparto collegato conserva valore, movimenti ed eventuale versamento periodico; il totale del raccoglitore non duplica quello dei comparti.
- Data, descrizione, categoria, metodo di pagamento e importo validati a ogni inserimento pertinente.
- Chiusura e riapertura logica di conti, immobili, investimenti, pensioni/comparti e ricorrenze senza perdere lo storico.
- I pagamenti rateali generano soltanto le rate residue entro l’eventuale data di fine; ogni conferma scala il residuo, il rollover pianifica nell’anno nuovo solo le rate ancora dovute e l’ultima rata chiude automaticamente la ricorrenza conservando lo storico. Il riquadro **Rate residue** elenca i piani ancora aperti al passaggio del mouse o al focus da tastiera; eventuali piani attivi già arrivati a zero vengono chiusi in modo conservativo all’apertura.
- **Cambia tariffa** mantiene l’importo originario della ricorrenza e applica uno o più nuovi importi dal mese scelto soltanto alle scadenze pianificate. L’anteprima indica quante righe saranno aggiornate; UUID, collegamenti, rate residue e operazioni già confermate restano invariati anche dopo riapertura e rollover.
- Workbook `.xlsx` portabile su macOS e Windows; copia `.numbers` nativa su macOS quando Apple Numbers è installato.
- Ogni workbook viene controllato prima del parser: struttura ZIP, voci, dimensioni espanse, rapporto di compressione, percorsi, duplicati, metadati locali/centrali e contenuto attivo devono rispettare limiti espliciti; un file rifiutato non viene aperto né modificato.
- Otto template Excel versionati e bilingui, generabili da Impostazioni anche senza workbook aperto, con intestazioni stabili, campi guidati e menu a discesa per preparare l’importazione di dati precedenti.
- Importazione guidata degli otto template con preflight di sicurezza, anteprima ed errori per riga/colonna, strategie esplicite per i duplicati e conferma atomica con backup.
- Passaggio d’anno guidato: il file precedente resta intatto, mentre il nuovo conserva anagrafiche attive, saldi di apertura, ultime valutazioni e consuntivi annuali dettagliati per immobili/utenze, investimenti/comparti e automobili.
- Salvataggio locale verificato, sostituzione atomica, fino a 10 backup e blocco se il file è stato modificato da un’altra app.
- Riparazione automatica e conservativa degli UUID duplicati introdotti da modifiche manuali al workbook: nessuna registrazione viene eliminata e la versione precedente resta nel backup.
- Avvio recuperabile se il workbook configurato è stato spostato o cancellato: l’app torna allo stato non configurato e permette di aprire o creare un file.
- Nessun account, cloud, telemetria o richiesta di rete durante l’uso normale.

---

- Overall dashboard with cash-register balance and historical comparisons for net worth, liquidity, properties, investments and private pensions, income, expenses, and recurring commitments.
- Bidirectional linked records: a movement entered under Transactions, Properties, Vehicles, Investments, Private Pension, Recurring Items, or Shared Expenses is reflected in every relevant view without re-entry.
- Combinable, resettable filters in Transactions, with filtered Inflows/Outflows/Balance separated between accounts and cash registers; description/month filters with subtotals for common property expenses, vehicle, investment and pension-compartment dialogs, and shared expenses; detail and CRUD remain controlled.
- Property records can be filtered across all twelve months and by description, and support total or per-square-metre valuations, recurring rents with separate due-period and actual-receipt dates, a paid/late/overdue/future instalment table, guided utility entries (including electricity bands), configurable taxes, optional inclusion in the common property-expense summary, yearly actuals, date-based charts, and optional shared-expense links; costs are mirrored to Transactions.
- Personal, family, or business cash registers are kept separate from bank accounts: a cash payment changes only the selected cash register, while an ATM withdrawal is one internal account→cash-register transfer that updates both balances without changing total liquidity.
- The Vehicles form can create and edit optional financing together with the vehicle: one linked Recurring Item owns the plan, each occurrence creates an Installment vehicle record, close/reopen stays synchronized, and confirmed history cannot be deleted.
- Per-position investment and pension-compartment charts compare net invested capital with countervalue over time. Card values turn red when countervalue is below net invested capital. **Update value** is also available inside each investment dialog. Every one-off or recurring Contribution and Liquidation requires the affected account or cash register and keeps exactly one linked Transaction as a cash-directed transfer without inflating current income or expenses.
- A dedicated Private Pension area: every pension is a collector and each linked compartment keeps its value, movements, and optional periodic contribution; collector totals never double-count compartments.
- Date, description, category, payment method, and amount validation wherever applicable.
- Logical close/reopen for accounts, properties, investments, pensions/compartments, and recurring items without losing history.
- Installment plans generate only the remaining payments up to their optional end date; each confirmation reduces the balance, year rollover schedules only the payments still due, and the final installment closes the recurring item while preserving its history. Hovering or focusing the **Installments left** card lists the open plans; any active plan already at zero is conservatively closed on load.
- **Change rate** preserves the recurring item’s original amount and applies one or more new amounts from a selected month only to planned occurrences. A preview shows how many rows will change; UUIDs, links, remaining-installment counts, and confirmed operations stay unchanged across reopen and rollover.
- Portable `.xlsx` workbook on macOS and Windows; native `.numbers` mirror on macOS when Apple Numbers is installed.
- Every workbook is checked before parsing: ZIP structure, entries, expanded sizes, compression ratio, paths, duplicates, local/central metadata, and active content must meet explicit limits; a rejected file is neither opened nor changed.
- Eight versioned bilingual Excel templates generated from Settings, even without an open workbook, with stable headers, guided fields, and drop-down lists for preparing legacy-data imports.
- Guided import for all eight templates with security preflight, row/column preview errors, explicit duplicate strategies, and atomic confirmation with backup.
- Guided year rollover: the previous file stays untouched while the new one carries active registries, opening balances, latest valuations, and detailed annual actuals for properties/utilities, investments/compartments, and vehicles.
- Verified local saves, atomic replacement, up to 10 backups, and conflict protection when another app changes the file.
- Automatic, conservative repair of duplicate UUIDs introduced by manual workbook edits: no record is deleted, and the previous version remains available in the backup.
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

Da **Impostazioni / Settings** puoi scegliere lingua (`Sistema`, `Italiano`, `English`), tema (`Sistema`, `Chiaro`, `Scuro`), formato dei nuovi workbook e gestire separatamente conti e Casse. Ogni Cassa può indicare un conto di alimentazione predefinito, usato come suggerimento nei trasferimenti interni ma non come vincolo esclusivo. Puoi inoltre gestire categorie, metodi di pagamento, tipi di investimento e tasse immobiliari. Ogni tassa definisce nome, immobili applicabili e numero di rate da 1 a 24. Le tasse usate possono essere archiviate e riaperte, mentre la cancellazione definitiva è consentita soltanto quando non esistono registrazioni collegate. La sezione **Importazione dati** genera e importa otto template `.xlsx` v2; i campi monetari indicano il conto o la Cassa e i trasferimenti interni anche la destinazione.

Under **Settings** you can select language (`System`, `Italiano`, `English`), theme (`System`, `Light`, `Dark`), the format for new workbooks, and manage accounts and cash registers separately. Each cash register may have a default funding account, used as an internal-transfer suggestion rather than an exclusive constraint. You can also manage categories, payment methods, investment types, and property taxes. Each tax defines its name, applicable properties, and 1–24 instalments. Referenced taxes can be archived and reopened; permanent deletion is available only when no records use them. The **Data import** section generates and imports eight v2 `.xlsx` templates; monetary rows identify their account or cash register and internal transfers also identify their destination.

## Sviluppo locale / Local development

Requisiti: Node.js **24 LTS, dalla 24.15.0**, npm e Git. `.node-version` definisce la baseline esatta verificata anche dalla CI.

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
- [Import template specification / Specifica template](docs/import-template-spec.md)

## Licenza / License

Copyright 2026 ContaMì contributors. Distribuito secondo [Apache License 2.0](LICENSE).

Copyright 2026 ContaMì contributors. Distributed under the [Apache License 2.0](LICENSE).
