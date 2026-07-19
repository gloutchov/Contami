# ContaMì — Manuale utente

## 1. Cos’è ContaMì

ContaMì organizza le finanze personali attraverso un’interfaccia semplice e conserva i dati in un foglio di calcolo leggibile anche senza l’app. Gestisce transazioni, conti, immobili e consumi, investimenti e risparmio, ricorrenze/rate, spese condivise e consuntivi annuali.

L’app è local-first: non richiede account, non usa servizi cloud e non invia telemetria.

## 2. Requisiti e installazione

- macOS o Windows a 64 bit;
- spazio sufficiente per l’app, il workbook e i backup;
- Apple Numbers installato solo se vuoi una copia `.numbers` nativa;
- Excel non è richiesto: ContaMì legge e scrive `.xlsx` direttamente.

Le build iniziali sono generate da GitHub Actions senza certificati e senza firma ad-hoc del bundle. Verifica sempre il checksum SHA-256 pubblicato con la release. macOS Gatekeeper o Windows SmartScreen possono mostrare un avviso: procedi solo se il file proviene dalla release privata ufficiale.

### Installazione macOS non firmata

1. Scarica il DMG adatto al processore: `arm64` per Apple Silicon oppure `x64` per Mac Intel.
2. Verifica il checksum, apri il DMG e trascina `Contami` in **Applicazioni**.
3. Prova ad aprire `Contami`. Se macOS segnala che non può verificare lo sviluppatore, chiudi l’avviso.
4. Apri **Impostazioni di Sistema → Privacy e sicurezza**, scorri alla sezione Sicurezza e premi **Apri comunque** accanto a `Contami`.
5. Conferma con la password o Touch ID. macOS memorizza l’eccezione per gli avvii successivi.

Non disabilitare Gatekeeper globalmente e non usare comandi che rimuovono in massa gli attributi di sicurezza. Se il checksum non coincide o l’avviso parla di file danneggiato, non avviare l’app: riscaricala dalla release ufficiale. Vedi la [procedura Apple](https://support.apple.com/guide/mac-help/mh40616/mac).

Il bundle e l’eseguibile usano il nome tecnico ASCII `Contami` per la compatibilità delle build macOS non firmate. Logo, titolo della finestra e interfaccia mostrano il nome del prodotto **ContaMì**.

### Installazione Windows non firmata

1. Scarica `Contami-…-win-x64.exe` e verifica il checksum.
2. Avvia l’installer. Se SmartScreen mostra **PC protetto da Windows**, seleziona **Ulteriori informazioni**.
3. Controlla che il file indicato sia `Contami` e scegli **Esegui comunque**.

Smart App Control può bloccare un’app senza consentire un’eccezione individuale. In quel caso non disattivarlo per installare ContaMì: usa l’avvio dal sorgente o attendi una build firmata. Mantieni Microsoft Defender attivo. Vedi le indicazioni Microsoft su [app non riconosciute](https://support.microsoft.com/en-us/office/protect-my-pc-from-viruses) e [Smart App Control](https://support.microsoft.com/windows/smart-app-control-frequently-asked-questions-285ea03d-fa88-4d56-882e-6698afdb7003).

## 3. Primo avvio

1. Avvia ContaMì: se il sistema è in italiano usa l’italiano, altrimenti l’inglese.
2. Tema chiaro/scuro segue il sistema.
3. Dalla Panoramica scegli **Crea nuovo foglio** oppure **Apri foglio esistente**.
4. In **Impostazioni → Conto** crea il conto corrente, il contante o gli altri conti da includere nella liquidità.
5. Controlla categorie, metodi di pagamento e tipi di investimento; puoi aggiungerli o adattarli alle tue abitudini.

### Excel o Numbers

- **Excel (.xlsx)**: scelta consigliata e portabile su macOS e Windows.
- **Numbers (.numbers)**: disponibile soltanto su macOS con Numbers installato, anche tramite **Apple Creator Studio**. ContaMì mantiene un file `.contami.xlsx` accanto alla copia Numbers: non eliminarlo, perché è la copia interoperabile usata dall’app.

La scelta del formato nelle Impostazioni si applica al prossimo workbook creato. Aprire un `.xlsx` esistente imposta quel file come workbook attivo.

## 4. Panoramica

La pagina iniziale mostra:

- patrimonio netto: liquidità + valore degli immobili attivi + investimenti attivi + pensioni integrative;
- liquidità: saldi iniziali dei conti più entrate meno uscite associate;
- valore immobili: ultima valutazione disponibile, oppure prezzo di acquisto, moltiplicata per la quota di proprietà;
- valore investimenti: ultima valutazione degli investimenti attivi, esclusi i comparti pensione;
- valore pensioni: somma delle ultime valutazioni dei comparti attivi, senza duplicare il raccoglitore;
- entrate e uscite dell’anno attivo;
- equivalente mensile delle ricorrenze attive;
- saldo condiviso ancora da regolare;
- andamento mensile e categorie di spesa;
- transazioni recenti e spese ricorrenti recenti, limitate alle registrazioni confermate fino alla data odierna (le righe future o pianificate non compaiono);
- tre confronti annuali: composizione del patrimonio, entrate/uscite e impegni mensili;
- entrate e uscite complessive attribuite agli immobili.

I punti degli anni chiusi provengono da `Annual Summaries`; il punto dell’anno corrente viene ricalcolato dalle registrazioni. Il passaggio d’anno conserva automaticamente i totali necessari ai confronti.

I trasferimenti non sono conteggiati come entrata o uscita. Possono essere neutri tra conti oppure indicare un’entrata/uscita dalla liquidità: versamenti, acquisti, liquidazioni e vendite di investimenti usano questa direzione per aggiornare il saldo del conto senza alterare i consuntivi delle spese correnti. Le valute sono registrate, ma la versione iniziale non effettua conversioni automatiche.

## 5. Transazioni

Premi **Nuova transazione** e indica:

- tipo: entrata, uscita o trasferimento;
- per un trasferimento, effetto sulla liquidità (uscita, entrata oppure neutro tra conti);
- data e descrizione;
- categoria e metodo di pagamento;
- conto, immobile, investimento o ricorrenza opzionali;
- se una spesa è condivisa e chi l’ha pagata;
- importo, valuta EUR e note opzionali.

Puoi filtrare per testo, tipo, categoria, metodo di pagamento e mese. Con un mese selezionato i riquadri mostrano i parziali filtrati; sono inoltre disponibili i totali dell’anno e quelli maturati fino a oggi. Le righe generate da una ricorrenza sono evidenziate; quelle future sono pianificate e possono essere confermate quando il movimento avviene.

Collegare una transazione a un immobile, investimento o spesa condivisa crea/aggiorna automaticamente la registrazione corrispondente. Modifica e cancellazione restano sincronizzate, per evitare doppie contabilizzazioni.

Esempio: per una spesa alimentare seleziona **Uscita**, categoria **Alimentari**, il metodo effettivamente usato e il conto interessato.

## 6. Immobili

### Aggiungere un immobile

Usa **Nuovo immobile** per inserire nome, tipo, destinazione (residenza, locazione o altro), indirizzo, metri quadri, quota di proprietà, valore catastale, data/prezzo di acquisto e note. Per una locazione puoi indicare canone atteso e giorno di scadenza.

### Registrazioni dell’immobile

Apri un immobile dall’elenco e usa **Nuova registrazione** per:

- entrate, per esempio un affitto;
- spese, per esempio manutenzione o imposte;
- valutazioni, cioè valore commerciale a una certa data;
- consumi, con quantità e unità (per esempio kWh o m³), oltre all’eventuale costo.

Per entrate e spese, **Categoria** usa le stesse categorie delle Transazioni e richiede anche il metodo di pagamento. La registrazione viene riportata automaticamente nelle Transazioni; vale anche il percorso opposto.

Il dettaglio può essere filtrato per mese e descrizione e mostra i relativi parziali. Per la residenza include consumi e costi di luce, gas e acqua, spese condominiali, Telefono/Internet e Canone TV, con grafici annuali separati per quantità e spesa. Tutti gli immobili mostrano l’andamento del valore commerciale; quelli affittati mostrano consuntivi e grafico entrate/uscite e segnalano il canone atteso non registrato entro la scadenza. Gli indicatori monetari riconoscono le voci tramite categoria o descrizione.

## 7. Automobile

Usa **Nuova automobile** per registrare nome, marca, modello, alimentazione, date e prezzi di acquisto/vendita. Le vetture dismesse restano disponibili per i confronti storici.

Con **Nuova spesa / rilevazione** puoi inserire rifornimenti, rate, bollo, assicurazione, pneumatici, manutenzione ordinaria, riparazioni/manutenzione straordinaria, valutazioni e altre spese. Ogni costo richiede data, descrizione, categoria e metodo di pagamento ed è riportato nelle Transazioni. Per i rifornimenti puoi indicare chilometraggio, distanza, litri e prezzo al litro.

La dashboard mostra costi dell’anno, carburante e percorrenza. Ogni scheda vettura mostra invece i costi complessivi dell’intero periodo di possesso; aprendo una vettura trovi il dettaglio per categoria e il confronto annuale. Il grafico di confronto dispone i nomi delle vetture sull’asse orizzontale e il costo per chilometro su quello verticale, combinando le registrazioni della vettura corrente con i consuntivi delle precedenti.

## 8. Investimenti e risparmio

Con **Nuovo investimento** puoi registrare titoli, fondi, fogli, ETF, obbligazioni o altre forme di risparmio non pensionistiche. Indica tipologia, gestore, data di apertura ed eventuale investimento padre. Gli investimenti sono raggruppati per tipologia e ogni gruppo mostra il proprio totale.

Apri un investimento per il dettaglio. **Nuovo movimento** registra soltanto **Versamento** o **Liquidazione**; **Aggiorna valore** aggiunge invece una valutazione, che alimenta dashboard e patrimonio netto. Puoi modificare e cancellare investimenti e movimenti con conferma.

Un versamento/liquidazione genera un trasferimento collegato con uscita/entrata dalla liquidità; una transazione associata a un investimento genera il movimento corrispondente. Il dettaglio confronta cifra investita e controvalore usando tutte le osservazioni datate disponibili, non soltanto l’ultimo valore annuale. Se dichiari un versamento periodico, ContaMì crea o aggiorna anche la Ricorrenza e le transazioni pianificate dell’anno.

ContaMì è uno strumento di registrazione, non fornisce consulenza finanziaria né quotazioni di mercato.

## 9. Pensione integrativa

La sezione **Pensione integrativa** è separata dagli altri investimenti e usa due livelli:

- **Crea pensione** aggiunge il raccoglitore principale, per esempio **Fondo Pensione Fideuram**;
- **Crea comparto** aggiunge una posizione associata a una pensione esistente, per esempio **Linea Equilibrio**, **Linea Crescita** o **Linea Valore**.

Il riquadro della pensione mostra il totale dei comparti attivi senza duplicazioni. Ogni comparto conserva valutazioni, versamenti e liquidazioni e mostra il grafico cifra investita/controvalore; il raccoglitore aggrega le stesse serie dei comparti. Può inoltre avere un versamento periodico collegato automaticamente a Ricorrenze e Transazioni.

Nel workbook pensioni e comparti restano nella tabella `Investments`, identificati dal tipo pensione e dalla relazione padre/figlio. In questo modo i file già creati restano compatibili e leggibili senza migrazioni distruttive.

## 10. Ricorrenze e rate

**Nuova ricorrenza** gestisce abbonamenti, servizi, pagamenti rateali, affitti in entrata e versamenti periodici. Specifica direzione, importo, frequenza (inclusa mensile o una tantum annuale), categoria, metodo, prossima scadenza, eventuale data di fine e rate residue. Un investimento periodico può essere collegato a un investimento o comparto pensione esistente; un affitto può essere collegato all’immobile; una rata può essere associata a un’automobile.

La dashboard mostra equivalente mensile, numero di elementi attivi e rate residue note. Puoi filtrare per nome, tipo e mese: i totali seguono i filtri. Sono disponibili modifica, cancellazione, chiusura e riapertura.

ContaMì genera transazioni **pianificate** fino alla fine dell’anno e collega eventuali righe reali già presenti. Confermare una riga la rende effettiva; l’app non esegue pagamenti.

## 11. Spese condivise

Puoi creare la spesa dalla vista dedicata oppure selezionare **Spesa condivisa** in una Transazione: in entrambi i casi viene mantenuta un’unica coppia collegata. Per impostazione iniziale il totale viene diviso a metà; dal modulo dedicato puoi modificare le quote.

- Se hai pagato tu, il saldo positivo rappresenta quanto il partner deve restituire.
- Se ha pagato il partner, il saldo negativo rappresenta quanto devi restituire tu.
- **Segna saldata** chiude la singola posizione; **Riapri saldo** la rimette tra le pendenze.
- Il filtro mese mostra i parziali del periodo e permette di saldare/riaprire l’intero mese con un solo comando.
- **Stampa non saldate** prepara una lista stampabile delle sole pendenze del mese selezionato.
- Modifica e cancellazione aggiornano automaticamente anche la Transazione collegata.

## 12. Conti, categorie e metodi

In **Impostazioni**:

- crea conti con tipo, saldo iniziale e data di apertura;
- chiudi o riapri conti;
- crea, modifica e cancella categorie con nome italiano, nome inglese e tipo entrata/uscita/entrambi; badge distinti rendono visibile la tipologia e un contatore prima della matita mostra quante registrazioni la usano;
- crea, modifica e cancella metodi di pagamento; anche qui il contatore mostra il numero di utilizzi;
- crea, modifica e cancella tipi di investimento.

Un elemento già usato non può essere cancellato: ContaMì mostra un errore e conserva i riferimenti storici.

## 13. Lingua, tema e preferenze

- **Lingua → Automatico**: italiano solo se il sistema è italiano, inglese negli altri casi.
- **Tema → Automatico**: segue in tempo reale il tema di sistema.
- Gli override Italiano/English e Chiaro/Scuro sono immediati e persistenti.
- I contenuti scritti dall’utente non vengono tradotti.

## 14. Chiusura dell’anno

1. Assicurati che il workbook non sia aperto e modificato in un’altra app.
2. In **Impostazioni** premi **Chiudi anno** e conferma.
3. Scegli il percorso del file per l’anno successivo.
4. Conserva e archivia manualmente il file dell’anno precedente: ContaMì non lo elimina né lo sposta.

Il nuovo workbook contiene:

- categorie e metodi;
- conti attivi con saldo di chiusura come nuovo saldo iniziale;
- immobili, automobili e investimenti attivi con le ultime valutazioni previste;
- ricorrenze ancora attive e non scadute, con prossima data utile;
- sole spese condivise non saldate;
- consuntivo aggregato dell’anno precedente e consuntivi storici già presenti, inclusi liquidità, valore immobili, valore investimenti/pensioni e impegni mensili;
- consuntivi annuali dettagliati per ogni immobile (entrate, uscite, valore e consumi), investimento/comparto (valore, versamenti e liquidazioni) e automobile (costi per tipo, percorrenza e consumo).

Non contiene le singole transazioni dell’anno chiuso, i movimenti storici, gli elementi chiusi o le spese condivise già saldate. Il vecchio workbook resta la fonte dettagliata di quell’anno.

## 15. Il workbook e i backup

I fogli principali sono `Overview`, `Schema`, `Categories`, `Payment Methods`, `Investment Types`, `Accounts`, `Transactions`, `Properties`, `Property Entries`, `Investments`, `Investment Entries`, `Recurring Items`, `Shared Expenses`, `Vehicles`, `Vehicle Entries`, `Annual Summaries`, `Property History`, `Investment History` e `Vehicle History`. `_Meta` è nascosto e contiene versione schema e anno attivo. Lo schema corrente è v3; i workbook v1 e v2 vengono migrati all’apertura.

Non rinominare fogli o colonne se vuoi riaprire il file in ContaMì. Puoi leggerlo, copiarlo e archiviarlo liberamente.

Prima di sostituire un file esistente, ContaMì crea un backup in `.contami-backups` accanto al `.xlsx` e conserva le ultime 10 copie. La scrittura avviene prima su un file temporaneo, viene riletta e solo dopo sostituisce il file attivo.

## 16. Risoluzione problemi

### Il file configurato è stato spostato o cancellato

ContaMì si apre comunque e torna allo stato **Non configurato**, senza creare automaticamente un file sostitutivo. Usa **Apri foglio esistente** per indicare la nuova posizione oppure **Crea nuovo foglio**. Il percorso non più valido viene rimosso dalle preferenze; eventuali backup esistenti non vengono cancellati.

### “Il foglio è stato modificato da un’altra app”

Chiudi Excel/Numbers, poi usa **Apri foglio esistente** per ricaricare la versione su disco. ContaMì blocca il salvataggio per non sovrascrivere modifiche esterne.

### La copia Numbers non si aggiorna

Il `.xlsx` sidecar è già salvo. Chiudi eventuali finestre Numbers e verifica che sia installato Numbers, anche come `/Applications/Numbers Creator Studio.app`; ContaMì lo identifica tramite il bundle Apple `com.apple.Numbers`. Riprova senza eliminare il sidecar.

### File non valido o troppo grande

ContaMì accetta solo workbook `.xlsx` con schema ContaMì e dimensione massima 250 MB. Ripristina un backup o apri il file corretto.

### Preferenze tornate ai valori automatici

Il file locale delle impostazioni può essere assente o non valido. I dati finanziari restano nel workbook; riapri il file e reimposta le preferenze.

### Dashboard inattesa

Controlla che le transazioni abbiano il conto corretto, che esista una valutazione recente e che gli elementi siano attivi. Verifica anche l’anno del workbook e l’uso di una sola valuta coerente.

## 17. Sicurezza e limiti

- Proteggi il workbook con i permessi del sistema, FileVault/BitLocker e backup cifrati se contiene dati sensibili.
- ContaMì non cifra autonomamente il workbook e non gestisce password del foglio.
- Non sincronizzare cartelle sensibili con servizi cloud se non accetti le loro condizioni.
- Le build non firmate possono produrre avvisi del sistema.
- La copia Numbers dipende dall’automazione di Apple Numbers e può richiedere un consenso macOS.

Vedi [SECURITY_MODEL.md](SECURITY_MODEL.md) per dettagli tecnici e rischi residui.

## 18. Aggiornamento e rimozione

Prima di aggiornare, chiudi ContaMì e conserva una copia del workbook. Installa la nuova release sopra la precedente. Per rimuovere l’app, usa la normale procedura del sistema operativo: i workbook scelti e i backup restano nelle cartelle dell’utente e vanno eliminati solo manualmente.
