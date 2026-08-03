# ContaMì — Manuale utente

## 1. Cos’è ContaMì

ContaMì organizza le finanze personali attraverso un’interfaccia semplice e conserva i dati in un foglio di calcolo leggibile anche senza l’app. Gestisce transazioni, conti, immobili e consumi, investimenti e risparmio, ricorrenze/rate, spese condivise e consuntivi annuali.

L’app è local-first: non richiede account, non usa servizi cloud e non invia telemetria.

## 2. Requisiti e installazione

- macOS o Windows a 64 bit;
- spazio sufficiente per l’app, il workbook e i backup;
- Apple Numbers installato solo se vuoi una copia `.numbers` nativa;
- Excel non è richiesto: ContaMì legge e scrive `.xlsx` direttamente.

Le build di release sono generate da GitHub Actions senza certificati e senza firma ad-hoc del bundle. Verifica sempre il checksum SHA-256 pubblicato con la release. macOS Gatekeeper o Windows SmartScreen possono mostrare un avviso: procedi solo se il file proviene dalla release privata ufficiale.

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

Smart App Control può bloccare un’app senza consentire un’eccezione individuale. In quel caso non disattivarlo per installare ContaMì: usa l’avvio dal sorgente con Node.js 24 LTS dalla 24.15.0, oppure attendi una build firmata. Mantieni Microsoft Defender attivo. Vedi le indicazioni Microsoft su [app non riconosciute](https://support.microsoft.com/en-us/office/protect-my-pc-from-viruses) e [Smart App Control](https://support.microsoft.com/windows/smart-app-control-frequently-asked-questions-285ea03d-fa88-4d56-882e-6698afdb7003).

## 3. Primo avvio

1. Avvia ContaMì: se il sistema è in italiano usa l’italiano, altrimenti l’inglese.
2. Tema chiaro/scuro segue il sistema.
3. Dalla Panoramica scegli **Crea nuovo foglio** oppure **Apri foglio esistente**.
4. In **Impostazioni → Conto** crea il conto corrente; se usi contanti, crea una o più **Casse** e associa facoltativamente a ciascuna il conto di alimentazione predefinito.
5. Controlla categorie, metodi di pagamento e tipi di investimento; puoi aggiungerli o adattarli alle tue abitudini.

### Excel o Numbers

- **Excel (.xlsx)**: scelta consigliata e portabile su macOS e Windows.
- **Numbers (.numbers)**: disponibile soltanto su macOS con Numbers installato, anche tramite **Apple Creator Studio**. ContaMì mantiene un file `.contami.xlsx` accanto alla copia Numbers: non eliminarlo, perché è la copia interoperabile usata dall’app.

La scelta del formato nelle Impostazioni si applica al prossimo workbook creato. Aprire un `.xlsx` esistente imposta quel file come workbook attivo.

## 4. Panoramica

La pagina iniziale mostra:

- patrimonio netto: liquidità + valore degli immobili attivi + investimenti attivi + pensioni integrative;
- liquidità: saldi iniziali di conti e Casse più movimenti confermati associati; i trasferimenti interni spostano valore tra due saldi senza modificare il totale, mentre i movimenti anteriori all’apertura o successivi alla chiusura non incidono;
- saldo Cassa: quota della liquidità conservata complessivamente nelle Casse, calcolata dai rispettivi saldi iniziali e movimenti confermati;
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

I trasferimenti non sono conteggiati come reddito o spesa corrente. Possono essere interni e neutri per la liquidità complessiva, oppure indicare un’entrata/uscita dal patrimonio liquido. Un prelievo Bancomat, per esempio, è una sola transazione dal conto sorgente alla Cassa destinazione: il saldo bancario diminuisce, quello della Cassa aumenta dello stesso importo. Versamenti, acquisti, liquidazioni e vendite di investimenti usano invece la direzione di cassa prevista. Le valute sono registrate, ma la versione iniziale non effettua conversioni automatiche.

## 5. Transazioni

Premi **Nuova transazione** e indica:

- tipo: entrata, uscita o trasferimento;
- per un trasferimento, effetto sulla liquidità (uscita, entrata oppure neutro tra conti);
- data e descrizione;
- categoria e metodo di pagamento;
- conto o Cassa obbligatori per entrate, uscite e trasferimenti con effetto di cassa; per un trasferimento interno sono obbligatori sorgente e destinazione, distinti e nella stessa valuta; immobile, investimento o ricorrenza restano collegamenti opzionali;
- se una spesa è condivisa e chi l’ha pagata;
- importo, valuta EUR e note opzionali.

Puoi filtrare per testo, tipo, categoria, metodo di pagamento e mese. **Azzera filtri** ripristina insieme tutti i criteri e l’elenco completo. La prima fila di riquadri mostra Entrate, Uscite e Saldo filtrati dei conti non-Cassa; la seconda mostra gli stessi tre valori per le sole Casse. Ogni saldo parte dai saldi iniziali del proprio gruppo e applica soltanto gli effetti delle righe visibili: un trasferimento interno conto→Cassa è quindi un’uscita del Conto e un’entrata della Cassa, pur restando neutro per la liquidità complessiva. La fascia “alla data odierna” usa soltanto righe confermate fino a oggi e mostra i flussi complessivi e la liquidità. Un avviso persistente segnala i movimenti dell’anno senza conto o Cassa. All’apertura di un vecchio workbook ContaMì completa un riferimento mancante soltanto quando esiste un’unica scelta compatibile, senza riclassificare automaticamente i movimenti storici in contanti. Le righe generate da una ricorrenza sono evidenziate; quelle future sono pianificate. **Conferma** chiede la data effettiva di incasso o pagamento e conserva separatamente la scadenza originaria.

Collegare una transazione a un immobile, investimento o spesa condivisa crea/aggiorna automaticamente la registrazione corrispondente. Per investimenti e comparti pensione, un trasferimento in uscita diventa un Versamento e uno in entrata una Liquidazione. Modifica, conferma e cancellazione restano sincronizzate, per evitare doppie contabilizzazioni.

Esempio: per una spesa alimentare pagata in contanti seleziona **Uscita**, categoria **Alimentari**, metodo **Contanti** e la Cassa interessata. Il conto bancario non viene modificato.

## 6. Immobili

### Aggiungere un immobile

Usa **Nuovo immobile** per inserire nome, tipo, destinazione (residenza, locazione o altro), indirizzo, metri quadri, quota di proprietà, valore catastale, data/prezzo di acquisto e note. Per una locazione puoi indicare canone atteso e giorno di scadenza.

### Registrazioni dell’immobile

Apri un immobile dall’elenco e usa **Nuova registrazione** per:

- entrate, per esempio un affitto;
- spese, per esempio manutenzione o imposte;
- valutazioni, cioè valore commerciale a una certa data;
- consumi, con quantità e unità (per esempio kWh o m³), oltre all’eventuale costo.

Per una valutazione puoi inserire direttamente il valore totale oppure il valore al metro quadro: in questo secondo caso ContaMì usa la superficie dell’anagrafica per calcolare e salvare il totale dell’immobile.

I comandi dedicati **Utenze** e **Tasse** rendono più strutturate le spese ricorrenti dell’abitazione. Utenze comprende Elettricità, Gas, Acqua e Telefono/Internet; per l’elettricità sono disponibili F1, F2, F3 oppure il dato aggregato F2+F3, mentre gas e acqua accettano i metri cubi. Il catalogo Tasse parte da Canone TV, IMU e TARI, ma può essere modificato in Impostazioni. Ogni tassa può applicarsi a tutti gli immobili, alla sola residenza o ai soli immobili in affitto e può prevedere da 1 a 24 rate. Una tassa può essere inclusa nel riepilogo delle Spese comuni degli immobili tramite l’apposita checkbox. Separatamente, ogni costo crea la Transazione collegata e può essere aggiunto anche alle Spese condivise tra persone, indicando pagante e quote.

Per entrate e spese, **Categoria** usa le stesse categorie delle Transazioni e richiede anche il metodo di pagamento. La registrazione viene riportata automaticamente nelle Transazioni; vale anche il percorso opposto.

Il dettaglio può essere filtrato su tutti i dodici mesi dell’anno attivo e per descrizione e mostra i relativi parziali. Anche il riepilogo **Spese comuni degli immobili** dispone degli stessi filtri combinabili e ricalcola il totale sulle sole righe visibili. Per la residenza include consumi e costi di luce, gas e acqua, spese condominiali, Telefono/Internet e Canone TV, con grafici annuali separati per quantità e spesa. Tutti gli immobili mostrano l’andamento del valore commerciale sulle date effettive delle valutazioni; quelli affittati mostrano consuntivi e un grafico entrate/uscite basato sugli incassi effettivi. La tabella **Rate di affitto** usa invece la scadenza/competenza e distingue Pagata, Pagata in ritardo, Insoluta e Da incassare: un canone di giugno ricevuto a luglio resta quindi attribuito a giugno e non salda luglio. Le rate previste non compaiono tra le normali registrazioni immobiliari né nei relativi parziali; se restano insolute al passaggio d’anno, conservano la competenza originaria. Nella nuova registrazione di un immobile in affitto, scegliendo Entrata e categoria Affitti puoi creare anche la ricorrenza mensile collegata alla rata corrente. Gli indicatori monetari riconoscono le voci tramite categoria o descrizione.

## 7. Automobile

Usa **Nuova automobile** per registrare nome, marca, modello, alimentazione, date e prezzi di acquisto/vendita. Le vetture dismesse restano disponibili per i confronti storici.

Nel medesimo modulo puoi attivare **Gestisci il finanziamento** e indicare importo rata, frequenza, prossima scadenza, rate residue oppure data di fine, categoria, metodo di pagamento e Conto/Cassa. Automobile e piano vengono salvati insieme: ContaMì crea una sola Ricorrenza collegata e una coppia Transazione↔registrazione Automobile di tipo **Pagamento rateale** per ogni scadenza. Le modifiche ripetute non duplicano il piano. Per cambiare l’importo futuro usa **Cambia tariffa** nella stessa sezione; la tariffa base e le rate confermate restano immutate.

**Chiudi** e **Riapri** agiscono insieme sull’automobile e sul suo piano, rimuovendo o rigenerando soltanto le scadenze pianificate. Un’automobile con registrazioni confermate non può essere cancellata definitivamente: chiudila per conservarne lo storico. Disattivare il finanziamento elimina un piano mai usato oppure lo chiude conservando le rate già confermate.

Con **Nuova spesa / rilevazione** puoi inserire rifornimenti, rate, bollo, assicurazione, pneumatici, manutenzione ordinaria, riparazioni/manutenzione straordinaria, valutazioni e altre spese. Ogni costo richiede data, descrizione, categoria e metodo di pagamento ed è riportato nelle Transazioni. Per i rifornimenti puoi indicare chilometraggio, distanza, litri e prezzo al litro.

La dashboard mostra costi dell’anno, carburante e percorrenza. Ogni scheda vettura mostra invece i costi complessivi dell’intero periodo di possesso; aprendo una vettura trovi il dettaglio per categoria, i filtri combinabili per descrizione e mese con totale filtrato e il confronto annuale. Il grafico di confronto dispone i nomi delle vetture sull’asse orizzontale e il costo per chilometro su quello verticale, combinando le registrazioni della vettura corrente con i consuntivi delle precedenti.

## 8. Investimenti e risparmio

Con **Nuovo investimento** puoi registrare titoli, fondi, fogli, ETF, obbligazioni o altre forme di risparmio non pensionistiche. Indica tipologia, gestore, data di apertura, eventuale investimento padre e, quando disponibile, il versamento iniziale con il conto interessato. Il versamento iniziale diventa subito controvalore e genera il trasferimento collegato nelle Transazioni. Gli investimenti sono raggruppati per tipologia e ogni gruppo mostra il proprio totale.

Apri un investimento per il dettaglio. I movimenti possono essere filtrati insieme per descrizione e mese e i parziali di Versamenti e Liquidazioni seguono le righe visibili. **Nuovo movimento** registra soltanto **Versamento** o **Liquidazione**; **Aggiorna valore**, disponibile anche accanto a **Modifica investimento** nella modale, aggiunge invece una valutazione che alimenta dashboard e patrimonio netto. Puoi modificare e cancellare investimenti e movimenti con conferma.

Nel box dell’investimento il controvalore è rosso quando è inferiore al capitale netto investito, calcolato come Versamenti confermati meno Liquidazioni confermate. Le valutazioni e le operazioni pianificate non alterano questo capitale di confronto.

Un Versamento/Liquidazione richiede il conto interessato e genera una sola Transazione collegata come trasferimento con uscita/entrata dalla liquidità; una Transazione associata a un investimento genera o aggiorna lo stesso movimento e lo stesso conto. La regola vale per operazioni una tantum, versamento iniziale, importazione e ricorrenze; la conferma di una pianificazione conserva la coppia esistente senza duplicarla. Il controvalore parte dai versamenti, viene sostituito da ogni valutazione e poi incorpora i movimenti confermati successivi; le operazioni pianificate non modificano né controvalore né liquidità corrente. Il badge **Ricorrente** appare soltanto sulle Transazioni collegate esplicitamente a una ricorrenza. Se dichiari un versamento periodico, ContaMì richiede il conto e crea o aggiorna anche la Ricorrenza e le transazioni pianificate dell’anno.

Quando apri un workbook esistente, ContaMì riconcilia automaticamente i movimenti patrimoniali privi del collegamento: usa solo riferimenti espliciti o corrispondenze esatte e univoche, conserva un backup recuperabile e non modifica i casi ambigui, che vengono segnalati nell’interfaccia.

ContaMì è uno strumento di registrazione, non fornisce consulenza finanziaria né quotazioni di mercato.

## 9. Pensione integrativa

La sezione **Pensione integrativa** è separata dagli altri investimenti e usa due livelli:

- **Crea pensione** aggiunge il raccoglitore principale, per esempio **Fondo Pensione Fideuram**;
- **Crea comparto** aggiunge una posizione associata a una pensione esistente, per esempio **Linea Equilibrio**, **Linea Crescita** o **Linea Valore**.

Il riquadro della pensione mostra il totale dei comparti attivi senza duplicazioni. Il valore diventa rosso quando è inferiore alla somma del capitale netto investito nei comparti attivi. Ogni comparto conserva valutazioni, versamenti e liquidazioni: la modale consente di filtrarli insieme per descrizione e mese e mostra i relativi parziali. Versamenti e Liquidazioni, una tantum o periodici, mantengono una sola Transazione collegata con effetto di cassa coerente. Il controvalore include i movimenti confermati, usa le valutazioni come nuovo riferimento e il raccoglitore aggrega le stesse serie senza duplicarle.

Nel workbook pensioni e comparti restano nella tabella `Investments`, identificati dal tipo pensione e dalla relazione padre/figlio. In questo modo i file già creati restano compatibili e leggibili senza migrazioni distruttive.

## 10. Ricorrenze e rate

**Nuova ricorrenza** gestisce abbonamenti, servizi, pagamenti rateali autonomi, affitti in entrata e versamenti periodici. Specifica direzione, importo, frequenza (inclusa mensile o una tantum annuale), categoria, metodo, conto o Cassa coerenti, prossima scadenza, eventuale data di fine e rate residue. Per un investimento periodico puoi collegare la ricorrenza a un investimento o comparto pensione esistente; un affitto può essere collegato all’immobile. I finanziamenti delle automobili si creano invece dal modulo **Nuova/Modifica automobile**.

La dashboard mostra equivalente mensile, numero di elementi attivi e rate residue note. Passa il mouse sul riquadro **Rate residue**, oppure portagli il focus con la tastiera, per vedere nome del piano, numero di rate ancora dovute e prossima scadenza. Puoi filtrare per nome, tipo e mese: i totali e il dettaglio del riquadro seguono i filtri. Sono disponibili modifica, cancellazione, chiusura e riapertura; per un piano gestito da Automobile, stato e cancellazione restano controllati dalla relativa scheda del mezzo, mentre modifica delle scadenze e **Cambia tariffa** restano disponibili.

Per cambiare un importo senza riscrivere lo storico, apri **Modifica ricorrenza** e scegli **Cambia tariffa**. Indica il nuovo importo e il mese di decorrenza: ContaMì normalizza la data al primo giorno del mese e mostra quante scadenze pianificate verranno aggiornate prima della conferma. Puoi inserire più variazioni, modificarle o annullarle finché non fanno parte di operazioni confermate. Per esempio, una tariffa base sintetica di 50 € con variazione a 65 € da ottobre conserva 50 € fino a settembre e porta a 65 € soltanto le scadenze non confermate da ottobre in avanti. L’importo base, le operazioni confermate, gli UUID e i collegamenti restano invariati; per i piani rateali non cambiano rate residue, prossima scadenza o data di fine. La cronologia viene riapplicata in modo deterministico dopo chiusura/riapertura, rigenerazione e passaggio d’anno.

Se il pagamento rateale è iniziato prima del workbook corrente, inserisci in **Prossima scadenza** la prima rata non ancora pagata e in **Rate residue** soltanto quelle ancora dovute, non il numero originario del piano. Per esempio, di 12 rate iniziate l’anno scorso con 4 ancora da pagare, indica la prossima scadenza effettiva e `4`.

Per le ricorrenze non rateali, ContaMì genera transazioni **pianificate** fino alla data di fine o alla fine dell’anno. Per i pagamenti rateali genera soltanto il numero di rate residue, sempre entro l’eventuale data di fine. Confermare una rata la rende effettiva, riduce il residuo e, dopo l’ultima, chiude automaticamente la ricorrenza conservando le righe confermate nello storico. All’apertura vengono chiusi anche eventuali piani rateali ancora attivi ma già arrivati a zero, rimuovendo soltanto le loro pianificazioni obsolete. Durante il passaggio d’anno, il nuovo workbook conserva il residuo aggiornato e rigenera soltanto le rate ancora dovute nell’anno nuovo. L’app non esegue pagamenti.

## 11. Spese condivise

Puoi creare la spesa dalla vista dedicata oppure selezionare **Spesa condivisa** in una Transazione: in entrambi i casi viene mantenuta un’unica coppia collegata. Per impostazione iniziale il totale viene diviso a metà; dal modulo dedicato puoi modificare le quote.

- Se hai pagato tu, il saldo positivo rappresenta quanto il partner deve restituire.
- Se ha pagato il partner, il saldo negativo rappresenta quanto devi restituire tu.
- **Segna saldata** chiude la singola posizione; **Riapri saldo** la rimette tra le pendenze.
- I filtri combinabili per descrizione e mese mostrano i parziali delle sole righe visibili; quando è selezionato un mese puoi saldarlo con un solo comando.
- **Stampa non saldate** prepara una lista stampabile delle sole pendenze del mese selezionato.
- Modifica e cancellazione aggiornano automaticamente anche la Transazione collegata.

## 12. Conti, categorie, metodi e tasse

In **Impostazioni**:

- crea conti bancari o di altro tipo con saldo iniziale e data di apertura;
- crea una o più Casse personali, familiari o aziendali con saldo iniziale e un conto di alimentazione predefinito facoltativo;
- controlla separatamente il saldo corrente di conti e Casse, quindi chiudili o riaprili;
- crea, modifica e cancella categorie con nome italiano, nome inglese e tipo entrata/uscita/entrambi; badge distinti rendono visibile la tipologia e un contatore prima della matita mostra quante registrazioni la usano;
- crea, modifica e cancella metodi di pagamento; anche qui il contatore mostra il numero di utilizzi;
- crea, modifica e cancella tipi di investimento;
- crea e modifica tasse immobiliari specificando ambito e numero di rate; una tassa usata può essere archiviata e riaperta, mentre può essere eliminata definitivamente soltanto quando il contatore degli utilizzi è zero.

Un elemento già usato non può essere cancellato: ContaMì mostra un errore e conserva i riferimenti storici.

## 13. Template Excel per dati precedenti

In **Impostazioni → Importazione dati** puoi generare e importare otto template `.xlsx`: immobile di residenza, immobili in affitto, transazioni, investimenti, fondo pensione, spese condivise, spese ricorrenti e automobile.

Ogni file v2 contiene un solo foglio visibile `Dati - Data`, intestazioni tecniche stabili, descrizioni bilingui, colori per distinguere campi obbligatori, condizionali e opzionali e fino a 5.000 righe. Date e importi restano valori Excel reali. I campi chiusi hanno menu a discesa; quando un workbook è aperto, categorie, metodi, conti, Casse, tipi di investimento e tasse attive vengono inclusi con UUID non ambiguo. Ogni riga monetaria indica il conto o la Cassa; un trasferimento interno indica anche la destinazione.

Puoi generare i template anche senza workbook: saranno presenti i valori di sistema disponibili, senza UUID temporanei. Durante l’importazione un riferimento testuale viene accettato soltanto se corrisponde in modo esatto e univoco a un elemento attivo del workbook.

Per importare, apri prima il workbook di destinazione, scegli **Ignora**, **Crea nuove copie** o **Aggiorna** per le sole corrispondenze esatte, quindi premi **Importa file compilato**. L’anteprima mostra righe valide, rifiutate, conflitti, operazioni previste, importi aggregati ed errori con riga e colonna. Nessun dato viene scritto finché non scegli **Conferma importazione**; chiudere l’anteprima lascia il workbook invariato. La conferma esegue un solo salvataggio con controllo delle modifiche esterne e backup recuperabile.

Non rinominare il foglio o le intestazioni e non aggiungere formule, macro, link esterni, oggetti incorporati o altri fogli: questi elementi vengono rifiutati. Correggi il file e ripeti l’anteprima se una riga segnala un riferimento mancante o ambiguo. La specifica completa è in [docs/import-template-spec.md](docs/import-template-spec.md) e la guida agli errori è in [docs/import-guide.md](docs/import-guide.md).

## 14. Lingua, tema e preferenze

- **Lingua → Automatico**: italiano solo se il sistema è italiano, inglese negli altri casi.
- **Tema → Automatico**: segue in tempo reale il tema di sistema.
- Gli override Italiano/English e Chiaro/Scuro sono immediati e persistenti.
- I contenuti scritti dall’utente non vengono tradotti.

## 15. Chiusura dell’anno

1. Assicurati che il workbook non sia aperto e modificato in un’altra app.
2. In **Impostazioni** premi **Chiudi anno** e conferma.
3. Scegli il percorso del file per l’anno successivo.
4. Conserva e archivia manualmente il file dell’anno precedente: ContaMì non lo elimina né lo sposta.

Il nuovo workbook contiene:

- categorie, metodi, tipi di investimento e catalogo tasse, incluse le tasse archiviate necessarie allo storico;
- conti e Casse attivi con saldo di chiusura come nuovo saldo iniziale e associazioni di alimentazione ancora valide;
- immobili, automobili e investimenti attivi con le ultime valutazioni previste;
- ricorrenze ancora attive e non scadute, con prossima data utile; un finanziamento Automobile viene copiato soltanto insieme al mezzo attivo;
- cronologia tariffaria delle ricorrenze conservate, incluse variazioni con decorrenza nell’anno nuovo;
- sole spese condivise non saldate;
- consuntivo aggregato dell’anno precedente e consuntivi storici già presenti, inclusi liquidità, valore immobili, valore investimenti/pensioni e impegni mensili;
- consuntivi annuali dettagliati per ogni immobile (entrate, uscite, valore e consumi), investimento/comparto (valore, versamenti e liquidazioni) e automobile (costi per tipo, percorrenza e consumo).

Non contiene le singole transazioni dell’anno chiuso, i movimenti storici, gli elementi chiusi o le spese condivise già saldate. Il vecchio workbook resta la fonte dettagliata di quell’anno.

## 16. Il workbook e i backup

I fogli principali sono `Overview`, `Schema`, `Categories`, `Payment Methods`, `Investment Types`, `Tax Types`, `Accounts`, `Transactions`, `Properties`, `Property Entries`, `Investments`, `Investment Entries`, `Recurring Items`, `Recurring Rate Changes`, `Shared Expenses`, `Vehicles`, `Vehicle Entries`, `Annual Summaries`, `Property History`, `Investment History` e `Vehicle History`. `_Meta` è nascosto e contiene versione schema e anno attivo. Lo schema corrente è v9; i workbook v1–v8 vengono migrati all’apertura. La v7 conserva il conto di alimentazione delle Casse, sorgente e destinazione dei trasferimenti interni e il conto/Cassa delle registrazioni collegate; la v8 aggiunge `dueDate` a Transazioni e registrazioni immobiliari per separare la scadenza dalla data effettiva. La migrazione assegna automaticamente la scadenza soltanto alle righe ancora pianificate, dove coincide in modo certo con la data precedente; non attribuisce una competenza alle entrate storiche confermate quando potrebbe essere ambigua. La v9 aggiunge la cronologia tariffaria per UUID della ricorrenza, importo e primo giorno del mese di decorrenza. I file precedenti ricevono una cronologia vuota e continuano a usare l’importo base esistente senza modificare Transazioni o registrazioni collegate. `Property History` conserva anche i costi annuali aggregati di Telefono/Internet e Condominio.

Non rinominare fogli o colonne se vuoi riaprire il file in ContaMì. Puoi leggerlo, copiarlo e archiviarlo liberamente.

Prima di sostituire un file esistente, ContaMì crea un backup in `.contami-backups` accanto al `.xlsx` e conserva le ultime 10 copie. La scrittura avviene prima su un file temporaneo, viene riletta e solo dopo sostituisce il file attivo.

Prima di leggere il contenuto con ExcelJS, ContaMì controlla la struttura ZIP senza decomprimere le entry. Un workbook può contenere al massimo 4.096 entry, 256 MiB complessivi e 128 MiB per singola entry non compressa, con rapporto massimo 200:1; la directory centrale, i nomi e i metadati hanno limiti separati. Percorsi anomali o duplicati, archivi annidati, cifratura, ZIP64, macro, ActiveX, oggetti incorporati e collegamenti esterni vengono rifiutati. Questi controlli non sostituiscono la successiva validazione completa dello schema e dei dati.

Se un ritocco manuale crea UUID duplicati nelle tabelle del workbook, alla riapertura ContaMì conserva la prima occorrenza e assegna nuovi UUID alle successive. Nessuna riga o informazione economica viene eliminata; i collegamenti non ambigui vengono riallineati. La correzione interessa soltanto le celle necessarie, viene verificata prima della sostituzione e conserva la versione precedente in `.contami-backups`. L’app mostra un avviso quando ha eseguito questa riparazione.

## 17. Risoluzione problemi

### Il file configurato è stato spostato o cancellato

ContaMì si apre comunque e torna allo stato **Non configurato**, senza creare automaticamente un file sostitutivo. Usa **Apri foglio esistente** per indicare la nuova posizione oppure **Crea nuovo foglio**. Il percorso non più valido viene rimosso dalle preferenze; eventuali backup esistenti non vengono cancellati.

### “Il foglio è stato modificato da un’altra app”

Chiudi Excel/Numbers, poi usa **Apri foglio esistente** per ricaricare la versione su disco. ContaMì blocca il salvataggio per non sovrascrivere modifiche esterne.

### La copia Numbers non si aggiorna

Il `.xlsx` sidecar è già salvo. Chiudi eventuali finestre Numbers e verifica che sia installato Numbers, anche come `/Applications/Numbers Creator Studio.app`; ContaMì lo identifica tramite il bundle Apple `com.apple.Numbers`. Riprova senza eliminare il sidecar.

### File non valido o troppo grande

ContaMì accetta solo workbook `.xlsx` con schema ContaMì e file compresso fino a 250 MiB, entro i limiti ZIP descritti sopra. Se il controllo strutturale, di espansione o dello schema fallisce, il file non viene modificato: conservane una copia e ripristina l’ultimo backup valido oppure apri il file corretto.

### Preferenze tornate ai valori automatici

Il file locale delle impostazioni può essere assente o non valido. I dati finanziari restano nel workbook; riapri il file e reimposta le preferenze.

### Dashboard inattesa

Controlla che le transazioni abbiano il conto corretto, che esista una valutazione recente e che gli elementi siano attivi. Verifica anche l’anno del workbook e l’uso di una sola valuta coerente.

## 18. Sicurezza e limiti

- Proteggi il workbook con i permessi del sistema, FileVault/BitLocker e backup cifrati se contiene dati sensibili.
- ContaMì non cifra autonomamente il workbook e non gestisce password del foglio.
- Non sincronizzare cartelle sensibili con servizi cloud se non accetti le loro condizioni.
- Le build non firmate possono produrre avvisi del sistema.
- La copia Numbers dipende dall’automazione di Apple Numbers e può richiedere un consenso macOS.

Vedi [SECURITY_MODEL.md](SECURITY_MODEL.md) per dettagli tecnici e rischi residui.

## 19. Aggiornamento e rimozione

Prima di aggiornare, chiudi ContaMì e conserva una copia del workbook. Installa la nuova release sopra la precedente.

Per rimuovere l’app su macOS, chiudi ContaMì e sposta `Contami` da **Applicazioni** al Cestino. Su Windows apri **Impostazioni → App → App installate**, cerca `Contami` e scegli **Disinstalla**. La rimozione dell’app non elimina i workbook scelti né `.contami-backups`: restano nelle cartelle dell’utente e vanno eliminati solo manualmente dopo averne verificato il contenuto.
