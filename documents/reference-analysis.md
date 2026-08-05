# Analisi del documento di riferimento

> Documento interno di progettazione. Non contiene importi, indirizzi, nominativi, numeri di contratto o altri dati personali estratti dalla fonte.

## Integrità e trattamento

- Fonte analizzata in sola lettura: `sources/Gestione Conti 2026.numbers`.
- Il file originale è escluso da Git e dal packaging.
- L’analisi è stata eseguita localmente; nessun contenuto del documento è stato caricato su servizi remoti.
- Hash SHA-256 della copia analizzata: `56865720777d894953239b1238e0e545d52320b53e13fe20a7c73a0973a44e19`.

## Struttura osservata

Il documento contiene undici fogli e numerose tabelle, con queste aree funzionali:

- panoramica patrimoniale e andamento storico;
- sintesi del portafoglio finanziario e immobiliare;
- saldi e riepiloghi del conto corrente;
- movimenti classificati come entrate e uscite;
- immobili con valori commerciali, affitti, imposte, condominio, manutenzione, utenze e consumi;
- investimenti, fondi, titoli e previdenza, con versamenti, liquidazioni, controvalori e rendimenti;
- costi dell’automobile, carburante, manutenzione, assicurazione e rate;
- transazioni quotidiane e riepiloghi per categoria;
- abbonamenti, spese fisse, investimenti periodici e acquisti rateali;
- spese condivise mensili e saldo tra persone;
- tabelle di stampa e fogli predisposti per il nuovo anno.

## Elementi da conservare nel nuovo modello

- Data, descrizione, categoria, metodo di pagamento, importo e valuta per ogni transazione.
- Distinzione tra flussi di cassa, trasferimenti e variazioni di valore.
- Storico delle valutazioni per immobili e investimenti.
- Quote di proprietà e quote condivise.
- Stato attivo/chiuso senza perdita della storia.
- Frequenza, numero rate, prossima scadenza e fine prevista per ricorrenze.
- Consumi separati dai costi, con unità di misura esplicita.
- KPI riconciliabili alle righe origine e confronti annuali.

## Semplificazioni intenzionali

Il nuovo workbook non replica la disposizione grafica né la proliferazione di tabelle per singolo immobile, mese o investimento. Usa invece tabelle normalizzate con identificativi stabili e colonne coerenti. Dashboard e consuntivi sono viste derivate; la fonte durevole resta leggibile e filtrabile con Numbers, Excel o software compatibile.

## Metodo e limiti

- L’analisi è stata eseguita su una copia tecnica `.xlsx` esportata localmente da Apple Numbers/Numbers Creator Studio; la fonte `.numbers` è rimasta invariata.
- Le tabelle normalizzate conservano valori e consuntivi, non la grafica o le formule del documento originario.
- Windows non dispone di Apple Numbers; in quel sistema il formato nativo supportato è `.xlsx`.
