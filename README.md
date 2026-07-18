![ContaMì](assets/logo.png)

# ContaMì

ContaMì è un’app desktop local-first per gestire finanze personali articolate mantenendo un foglio di calcolo leggibile come fonte dati durevole. È bilingue italiano/inglese, segue il tema del sistema e funziona su macOS e Windows.

ContaMì is a local-first desktop app for managing detailed personal finances while keeping a readable spreadsheet as the durable data source. It is bilingual (Italian/English), follows the system theme, and targets macOS and Windows.

> Stato / Status: **0.1.0 — development preview** · Licenza / License: **Apache-2.0**

## Funzioni principali / Key features

- Dashboard generale con patrimonio netto, liquidità, immobili, investimenti, entrate, uscite, impegni periodici e saldo condiviso.
- Dashboard dedicate e inserimenti guidati per transazioni, immobili e consumi, investimenti e pensione, ricorrenze/rate e spese condivise.
- Data, descrizione, categoria, metodo di pagamento e importo validati a ogni inserimento pertinente.
- Chiusura e riapertura logica di conti, immobili, investimenti e ricorrenze senza perdere lo storico.
- Workbook `.xlsx` portabile su macOS e Windows; copia `.numbers` nativa su macOS quando Apple Numbers è installato.
- Passaggio d’anno guidato: il file precedente resta intatto, mentre il nuovo conserva anagrafiche attive, saldi di apertura, ultime valutazioni e soli consuntivi storici.
- Salvataggio locale verificato, sostituzione atomica, fino a 10 backup e blocco se il file è stato modificato da un’altra app.
- Nessun account, cloud, telemetria o richiesta di rete durante l’uso normale.

---

- Overall dashboard for net worth, liquidity, properties, investments, income, expenses, recurring commitments, and shared balance.
- Dedicated dashboards and guided entry flows for transactions, property and consumption, investments and pensions, recurring/installment payments, and shared expenses.
- Date, description, category, payment method, and amount validation wherever applicable.
- Logical close/reopen for accounts, properties, investments, and recurring items without losing history.
- Portable `.xlsx` workbook on macOS and Windows; native `.numbers` mirror on macOS when Apple Numbers is installed.
- Guided year rollover: the previous file stays untouched while the new one carries active registries, opening balances, latest valuations, and historical annual totals only.
- Verified local saves, atomic replacement, up to 10 backups, and conflict protection when another app changes the file.
- No account, cloud, telemetry, or network request during normal use.

## Installazione rapida / Quick install

Le build della preview non sono ancora firmate. Quando gli artifact saranno pubblicati nella sezione Releases:

1. scarica il pacchetto per macOS o Windows e il file `SHA256SUMS.txt`;
2. verifica il checksum;
3. installa e avvia ContaMì;
4. scegli **Crea nuovo foglio** oppure **Apri foglio esistente**.

Preview builds are not code-signed yet. Once artifacts are available under Releases:

1. download the macOS or Windows package and `SHA256SUMS.txt`;
2. verify the checksum;
3. install and launch ContaMì;
4. choose **Create new workbook** or **Open existing workbook**.

Consulta [QUICK-START_Desktop.md](QUICK-START_Desktop.md), [ISTRUZIONI.md](ISTRUZIONI.md) o [INSTRUCTIONS.md](INSTRUCTIONS.md).

## Formati del foglio / Spreadsheet formats

| Formato | macOS | Windows | Note |
|---|---:|---:|---|
| Excel `.xlsx` | Sì | Sì | Formato interoperabile canonico; apribile anche in Numbers. |
| Numbers `.numbers` | Sì | No | Richiede Apple Numbers. ContaMì conserva anche un sidecar `.contami.xlsx` per recupero e compatibilità. |

Il file Numbers originale in `sources/` è materiale privato di riferimento: non viene incluso in Git, build o release. ContaMì usa un proprio schema normalizzato e non modifica quel documento.

The original Numbers file under `sources/` is private reference material: it is never included in Git, builds, or releases. ContaMì uses its own normalized schema and does not modify that document.

## Configurazione / Configuration

Da **Impostazioni / Settings** puoi scegliere lingua (`Sistema`, `Italiano`, `English`), tema (`Sistema`, `Chiaro`, `Scuro`), formato dei nuovi workbook, conti, categorie e metodi di pagamento. Le preferenze vengono validate e salvate localmente con permessi riservati all’utente.

## Sviluppo locale / Local development

Requisiti: Node.js **22.12 o successivo**, npm e Git.

```bash
npm install
npm run dev
```

Controlli completi:

```bash
npm run preflight
npm audit
```

Build e pacchetti:

```bash
npm run build
npm run dist:mac
npm run dist:win
```

`dist:mac` va eseguito su macOS e `dist:win` preferibilmente su Windows. La CI genera entrambe le piattaforme. Nessun file in `sources/` o workbook locale viene incluso nel pacchetto.

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
