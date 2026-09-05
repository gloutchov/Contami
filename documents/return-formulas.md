# Rendimenti percentuali / Percentage returns

Questo documento descrive le formule usate da ContaMì `1.17.0`. I risultati sono indicatori di registrazione basati sui dati locali: non sono quotazioni di mercato né consulenza finanziaria.

This document describes the formulas used by ContaMì `1.17.0`. Results are record-keeping indicators derived from local data; they are neither market quotes nor financial advice.

## Investimenti e comparti / Investments and compartments

Il rendimento mensile usa Modified Dietz:

`R = (Vf − Vi − ΣF) / (Vi + Σ(w × F))`

- `Vi` / `Vf`: ultima valutazione confermata precedente disponibile e ultima valutazione confermata del mese corrente;
- `F`: Versamento positivo o Liquidazione negativa;
- `w = giorni tra il flusso e la valutazione finale / giorni tra le due valutazioni`;
- pianificazioni e Correzioni sono escluse;
- un denominatore non positivo/non finito o una valorizzazione finale assente produce un dato non disponibile, mai uno `0%` inventato.

Le date delle due osservazioni delimitano il periodo effettivo: non è necessario che coincidano con l’inizio o la fine del mese. Due osservazioni in mesi consecutivi producono un punto mensile coperto. Se manca la valutazione di un mese, quel mese resta una lacuna e l’eventuale confronto successivo su più mesi è mostrato come intervallo parziale, senza interpolazione o annualizzazione.

Monthly return uses Modified Dietz:

- `Vi` / `Vf`: the latest available previous confirmed valuation and the current month’s latest confirmed valuation;
- `F`: positive Contribution or negative Liquidation;
- `w = days from the cash flow to the ending valuation / days between the two valuations`;
- planned rows and Corrections are excluded;
- a non-positive/non-finite denominator or missing ending valuation produces an unavailable value, never an invented `0%`.

The two observation dates delimit the actual period; they do not need to fall on the first or last day of a month. Observations in consecutive months produce a covered monthly point. If a month has no valuation, it remains a gap and any later comparison spanning multiple months is shown as partial, without interpolation or annualization.

Un anno con copertura mensile completa collega geometricamente i mesi: `(Π(1 + Rm)) − 1`. Un periodo iniziato o terminato durante l’anno è parziale. Quando restano soltanto consuntivi annuali consecutivi, ContaMì usa il valore di chiusura dell’anno precedente come apertura e quello dell’anno corrente come chiusura, mostrando una **stima** Original Dietz con peso `0,5` sui flussi. La stima viene derivata in memoria anche per i workbook migrati e non riscrive retroattivamente lo storico; il primo anno privo di valore iniziale viene omesso. Questa distinzione segue il principio GIPS di valutare i portafogli almeno mensilmente e ponderare i flussi esterni per il tempo investito: [GIPS Standards for Asset Owners](https://www.cfainstitute.org/-/media/documents/code/gips/2020-gips-standards-asset-owners.pdf) e [GIPS Standards Handbook](https://www.gipsstandards.org/standards/gips-standards-for-firms/gips-standards-handbook-for-firms/).

A year with complete monthly coverage geometrically links its months: `(Π(1 + Rm)) − 1`. A period starting or ending during the year is partial. When only consecutive annual summaries remain, ContaMì uses the prior year’s closing value as the opening and the current year’s closing value as the ending, showing an **estimated** Original Dietz result with a `0.5` cash-flow weight. The estimate is derived in memory for migrated workbooks too and does not retroactively rewrite history; a first year with no opening value is omitted.

Per gruppi e pensioni-raccoglitore, valori e flussi delle posizioni finali applicabili a ciascun periodo vengono sommati prima di applicare la formula. Le percentuali dei figli non sono sommate o mediate. Un insieme con valute diverse non produce un aggregato senza tassi di conversione.

For groups and pension collectors, values and flows from leaf positions applicable to each period are summed before applying the formula. Child percentages are never added or arithmetically averaged. A mixed-currency set produces no aggregate without conversion rates.

## Immobili in affitto / Rental properties

Il rendimento locativo netto mensile, non annualizzato, è:

`R = (affitti confermati di competenza − spese immobiliari confermate) / valore commerciale di riferimento`

Le entrate usano `dueDate` quando presente, le spese la propria data. I movimenti pianificati sono esclusi. Il rendimento annuo usa entrate e spese dell’anno e il relativo valore di chiusura. La percentuale è identica usando importi e valore interi oppure applicando a entrambi la stessa quota di proprietà. Il concetto è coerente con la definizione di rental yield come reddito da locazione in rapporto al valore del bene, qui resa netta sottraendo le spese confermate: [OECD Economic Survey: India 2019](https://www.oecd.org/en/publications/oecd-economic-surveys-india-2019_554c1c22-en/full-report/component-6.html).

Un canone incassato dopo il passaggio d’anno viene attribuito al consuntivo dell’anno di competenza e tale riallineamento viene conservato al rollover successivo usando i campi già presenti; non sono salvate percentuali derivate.

The non-annualized monthly net rental yield is:

`R = (confirmed rent income for the due period − confirmed property expenses) / reference commercial value`

Income uses `dueDate` when present; expenses use their own date. Planned movements are excluded. Annual yield uses the year’s income and expenses and its closing value. The percentage is identical whether full amounts/value are used or the same ownership share is applied to both.

Rent received after year rollover is assigned to the annual summary for its due year, and that reconciliation is retained at the next rollover using existing fields; no derived percentages are stored.

## Copertura e interfaccia / Coverage and interface

- Una lacuna nel grafico mensile significa copertura insufficiente, non rendimento zero.
- **stima / estimate** identifica dati annuali senza date dei singoli flussi.
- Il tooltip del dettaglio espone l’intervallo osservato e i componenti numerici usati dalla formula.
- I punti mensili restano trasformazioni pure della `FinanceData` già validata. Al rollover, il workbook v11 conserva in `Investment History` il rendimento annuale già calcolato, metodo, copertura, stato parziale e data dell’osservazione finale; la migrazione v10→v11 lascia assenti i risultati storici non ricostruibili. Non vengono richieste quotazioni.

- A gap in the monthly chart means insufficient coverage, not a zero return.
- **stima / estimate** identifies annual data with no individual cash-flow dates.
- The detail tooltip exposes the observed interval and the numeric formula components.
- Monthly points remain pure transformations of already validated `FinanceData`. At rollover, the v11 workbook stores the calculated annual return, method, coverage, partial-period status, and ending-observation date in `Investment History`; v10→v11 migration leaves non-reconstructible historical results absent. No quotes are requested.
