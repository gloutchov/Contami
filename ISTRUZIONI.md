# ContaMì — Manuale utente

## 1. Cos’è ContaMì

ContaMì organizza le finanze personali attraverso un’interfaccia semplice e conserva i dati in un foglio di calcolo leggibile anche senza l’app. Gestisce transazioni, conti, immobili e consumi, investimenti e risparmio, ricorrenze/rate, spese condivise e consuntivi annuali.

L’app è local-first: non richiede account, non usa servizi cloud e non invia telemetria.

## 2. Requisiti e installazione

- macOS o Windows a 64 bit;
- spazio sufficiente per l’app, il workbook e i backup;
- Apple Numbers installato solo se vuoi una copia `.numbers` nativa;
- Excel non è richiesto: ContaMì legge e scrive `.xlsx` direttamente.

Le build iniziali non sono firmate. Verifica sempre il checksum SHA-256 pubblicato con la release. macOS Gatekeeper o Windows SmartScreen possono mostrare un avviso: procedi solo se il file proviene dalla release privata ufficiale.

## 3. Primo avvio

1. Avvia ContaMì: se il sistema è in italiano usa l’italiano, altrimenti l’inglese.
2. Tema chiaro/scuro segue il sistema.
3. Dalla Panoramica scegli **Crea nuovo foglio** oppure **Apri foglio esistente**.
4. In **Impostazioni → Conto** crea il conto corrente, il contante o gli altri conti da includere nella liquidità.
5. Controlla categorie e metodi di pagamento; puoi aggiungerne di personali.

### Excel o Numbers

- **Excel (.xlsx)**: scelta consigliata e portabile su macOS e Windows.
- **Numbers (.numbers)**: disponibile soltanto su macOS con Numbers installato. ContaMì mantiene anche un file `.contami.xlsx` accanto alla copia Numbers: non eliminarlo, perché è la copia interoperabile usata dall’app.

La scelta del formato nelle Impostazioni si applica al prossimo workbook creato. Aprire un `.xlsx` esistente imposta quel file come workbook attivo.

## 4. Panoramica

La pagina iniziale mostra:

- patrimonio netto: liquidità + valore degli immobili attivi + valore degli investimenti attivi;
- liquidità: saldi iniziali dei conti più entrate meno uscite associate;
- valore immobili: ultima valutazione disponibile, oppure prezzo di acquisto, moltiplicata per la quota di proprietà;
- valore investimenti: ultima valutazione per investimento attivo;
- entrate e uscite dell’anno attivo;
- equivalente mensile delle ricorrenze attive;
- saldo condiviso ancora da regolare;
- andamento mensile, categorie di spesa e transazioni recenti.

I trasferimenti non sono conteggiati come entrata o uscita. Le valute sono registrate, ma la versione iniziale non effettua conversioni automatiche: evita di sommare valute diverse nello stesso quadro senza una conversione manuale coerente.

## 5. Transazioni

Premi **Nuova transazione** e indica:

- tipo: entrata, uscita o trasferimento;
- data e descrizione;
- categoria e metodo di pagamento;
- conto opzionale;
- importo, valuta EUR e note opzionali.

Il riepilogo superiore mostra entrate, uscite e flusso netto dell’anno. La barra di ricerca filtra la descrizione; il menu filtra il tipo.

Esempio: per una spesa alimentare seleziona **Uscita**, categoria **Alimentari**, il metodo effettivamente usato e il conto interessato.

## 6. Immobili

### Aggiungere un immobile

Usa **Nuovo immobile** per inserire nome, tipo, quota di proprietà, data/prezzo di acquisto e note.

### Registrazioni dell’immobile

Usa **Nuova registrazione** per:

- entrate, per esempio un affitto;
- spese, per esempio manutenzione o imposte;
- valutazioni, cioè valore commerciale a una certa data;
- consumi, con quantità e unità (per esempio kWh o m³), oltre all’eventuale costo.

La dashboard della vista mostra valore corrente, entrate e costi dell’anno. **Chiudi** rimuove l’immobile dai calcoli attivi senza cancellarne lo storico; **Riapri** lo riattiva.

## 7. Investimenti e risparmio

Con **Nuovo investimento** puoi registrare fondi, titoli, obbligazioni, ETF, pensione integrativa, risparmio o altre forme. Indica gestore e data di apertura.

Con **Nuovo movimento** registra versamento, prelievo, valutazione, reddito o costo. La valutazione più recente alimenta dashboard e patrimonio netto. La vista riepiloga valore, versamenti e prelievi dell’anno. Usa **Chiudi/Riapri** senza eliminare la storia.

ContaMì è uno strumento di registrazione, non fornisce consulenza finanziaria né quotazioni di mercato.

## 8. Ricorrenze e rate

**Nuova ricorrenza** gestisce abbonamenti, servizi, pagamenti rateali e versamenti periodici. Specifica importo, frequenza, categoria, metodo, prossima scadenza, eventuale data di fine e rate residue.

La dashboard mostra equivalente mensile, numero di elementi attivi e rate residue note. **Chiudi** quando il servizio o piano termina; **Riapri** se riprende.

La versione iniziale traccia le scadenze ma non genera automaticamente una transazione e non effettua pagamenti.

## 9. Spese condivise

Registra data, descrizione, totale, categoria, metodo, pagante e le due quote. La somma delle quote deve coincidere con il totale entro un centesimo.

- Se hai pagato tu, il saldo positivo rappresenta quanto il partner deve restituire.
- Se ha pagato il partner, il saldo negativo rappresenta quanto devi restituire tu.
- **Segna saldata** chiude la posizione; **Riapri saldo** la rimette tra le pendenze.

## 10. Conti, categorie e metodi

In **Impostazioni**:

- crea conti con tipo, saldo iniziale e data di apertura;
- chiudi o riapri conti;
- aggiungi categorie con nome italiano, nome inglese e tipo entrata/uscita/entrambi;
- aggiungi metodi di pagamento e relativo tipo.

Le categorie e i metodi già usati non vengono eliminati dallo storico.

## 11. Lingua, tema e preferenze

- **Lingua → Automatico**: italiano solo se il sistema è italiano, inglese negli altri casi.
- **Tema → Automatico**: segue in tempo reale il tema di sistema.
- Gli override Italiano/English e Chiaro/Scuro sono immediati e persistenti.
- I contenuti scritti dall’utente non vengono tradotti.

## 12. Chiusura dell’anno

1. Assicurati che il workbook non sia aperto e modificato in un’altra app.
2. In **Impostazioni** premi **Chiudi anno** e conferma.
3. Scegli il percorso del file per l’anno successivo.
4. Conserva e archivia manualmente il file dell’anno precedente: ContaMì non lo elimina né lo sposta.

Il nuovo workbook contiene:

- categorie e metodi;
- conti attivi con saldo di chiusura come nuovo saldo iniziale;
- immobili e investimenti attivi con ultima valutazione riportata al 1° gennaio;
- ricorrenze ancora attive e non scadute, con prossima data utile;
- sole spese condivise non saldate;
- consuntivo aggregato dell’anno precedente e consuntivi storici già presenti.

Non contiene le singole transazioni dell’anno chiuso, i movimenti storici, gli elementi chiusi o le spese condivise già saldate. Il vecchio workbook resta la fonte dettagliata di quell’anno.

## 13. Il workbook e i backup

I fogli principali sono `Overview`, `Schema`, `Categories`, `Payment Methods`, `Accounts`, `Transactions`, `Properties`, `Property Entries`, `Investments`, `Investment Entries`, `Recurring Items`, `Shared Expenses` e `Annual Summaries`. `_Meta` è nascosto e contiene versione schema e anno attivo.

Non rinominare fogli o colonne se vuoi riaprire il file in ContaMì. Puoi leggerlo, copiarlo e archiviarlo liberamente.

Prima di sostituire un file esistente, ContaMì crea un backup in `.contami-backups` accanto al `.xlsx` e conserva le ultime 10 copie. La scrittura avviene prima su un file temporaneo, viene riletta e solo dopo sostituisce il file attivo.

## 14. Risoluzione problemi

### “Il foglio è stato modificato da un’altra app”

Chiudi Excel/Numbers, poi usa **Apri foglio esistente** per ricaricare la versione su disco. ContaMì blocca il salvataggio per non sovrascrivere modifiche esterne.

### La copia Numbers non si aggiorna

Il `.xlsx` sidecar è già salvo. Chiudi eventuali finestre Numbers, verifica che `/Applications/Numbers.app` esista e riprova. Non eliminare il sidecar.

### File non valido o troppo grande

ContaMì accetta solo workbook `.xlsx` con schema ContaMì e dimensione massima 250 MB. Ripristina un backup o apri il file corretto.

### Preferenze tornate ai valori automatici

Il file locale delle impostazioni può essere assente o non valido. I dati finanziari restano nel workbook; riapri il file e reimposta le preferenze.

### Dashboard inattesa

Controlla che le transazioni abbiano il conto corretto, che esista una valutazione recente e che gli elementi siano attivi. Verifica anche l’anno del workbook e l’uso di una sola valuta coerente.

## 15. Sicurezza e limiti

- Proteggi il workbook con i permessi del sistema, FileVault/BitLocker e backup cifrati se contiene dati sensibili.
- ContaMì non cifra autonomamente il workbook e non gestisce password del foglio.
- Non sincronizzare cartelle sensibili con servizi cloud se non accetti le loro condizioni.
- Le build non firmate possono produrre avvisi del sistema.
- La copia Numbers dipende dall’automazione di Apple Numbers e può richiedere un consenso macOS.

Vedi [SECURITY_MODEL.md](SECURITY_MODEL.md) per dettagli tecnici e rischi residui.

## 16. Aggiornamento e rimozione

Prima di aggiornare, chiudi ContaMì e conserva una copia del workbook. Installa la nuova release sopra la precedente. Per rimuovere l’app, usa la normale procedura del sistema operativo: i workbook scelti e i backup restano nelle cartelle dell’utente e vanno eliminati solo manualmente.
