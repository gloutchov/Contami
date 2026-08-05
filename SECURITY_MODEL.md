# ContaMì — Modello di sicurezza / Security model

Versione del documento / Document version: 2026-08-05 · Applicazione / Application: 1.12.0

## Italiano

### 1. Obiettivo e modello operativo

ContaMì è un’app desktop local-first per dati finanziari personali. Il confine di fiducia principale è il computer dell’utente: l’app legge e scrive soltanto il workbook scelto tramite dialoghi nativi e un piccolo file di preferenze. Non esistono backend, account, telemetria, pubblicità, analytics o sincronizzazione cloud integrata.

Il workbook è la fonte dati autorevole. I dati in memoria sono una copia validata usata per calcoli e UI; ogni comando valido genera un nuovo workbook verificato prima della sostituzione.

### 2. Asset da proteggere

- transazioni, patrimonio, investimenti, pensioni integrative/comparti, immobili, consumi domestici, automobili, spese condivise, catalogo tasse e copie dei cataloghi inserite nei template di importazione;
- percorsi locali del workbook e dei backup;
- integrità dello schema e dei consuntivi annuali;
- preferenze di lingua, tema e formato;
- codice di release e pipeline di distribuzione.

ContaMì non raccoglie credenziali, password, PIN, token o chiavi API.

### 3. Avversari e rischi considerati

- contenuto malformato o intenzionalmente ostile in un `.xlsx` aperto dall’utente;
- renderer compromesso che prova ad accedere a Node.js, filesystem, rete o IPC non autorizzato;
- sovrascrittura accidentale o modifica contemporanea da Excel/Numbers;
- interruzione durante il salvataggio;
- formula injection o contenuti che tentano di diventare codice nel foglio;
- path non valido, file enorme, popup, navigazione o download inattesi;
- dipendenze o artifact di build compromessi;
- accesso locale da parte di un altro utente/processo già autorizzato sul computer.

Non sono risolvibili dall’app, da soli, un sistema operativo compromesso, malware con i privilegi dell’utente o l’accesso fisico a una sessione sbloccata.

### 4. Architettura e separazione dei privilegi

- Electron usa `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true` e `allowRunningInsecureContent: false`.
- Il preload espone un oggetto congelato con soli metodi ContaMì; non espone `ipcRenderer`, Node.js o primitive filesystem generiche.
- I canali IPC sono una allowlist centralizzata. Ogni richiesta deve provenire dal frame principale e dall’URL già caricato nella finestra autorizzata; tuple, arità e payload sono validati con Zod e gli errori sono redatti. Il recupero M10 non accetta argomenti o percorsi e può rimuovere soltanto il lock già scaduto del workbook configurato.
- Il renderer non sceglie né invia percorsi file: creazione, apertura e destinazione dei template passano dai dialoghi nativi nel main process. Per i template il renderer invia soltanto tipo e lingua validati e riceve soltanto annullamento e nome del file, mai il percorso completo.
- Main, preload, dominio, persistenza, configurazione e renderer sono moduli separati.
- È ammessa una sola istanza dell’app. Durante il commit, un lock cooperativo per workbook impedisce inoltre a processi o copie ContaMì distinti di salvare contemporaneamente la stessa revisione.

### 5. Rete, navigazione e contenuti attivi

- In produzione la sessione Electron annulla richieste `http`, `https`, `ws` e `wss`.
- La Content Security Policy consente soltanto risorse locali; `object-src` e `base-uri` sono disabilitati. In sviluppo è ammesso solo il server locale Vite.
- Popup, nuove finestre e tentativi di collegare `webview` sono negati; navigazioni fuori dalla pagina corrente, drag-and-drop navigabile e download avviati dal renderer sono bloccati.
- Tutte le richieste e le verifiche di permesso Electron sono negate.
- Non vengono caricati font, immagini, script o analytics remoti.

La CSP permette stili inline necessari alla UI corrente. Il rischio è mitigato dall’assenza di HTML non fidato e dall’escaping predefinito di React; una futura rimozione di `style-src 'unsafe-inline'` è auspicabile.

### 6. Validazione dati e workbook

- Entità, UUID, date ISO, timestamp, enum, testo, importi, quote e cardinalità massime sono validati con schemi Zod.
- Testo descrittivo: massimo 240 caratteri; note: massimo 2.000; importi e quantità hanno limiti finiti; le quote condivise devono riconciliare al centesimo.
- Sono accettati soltanto percorsi assoluti `.xlsx`, senza byte nulli e lunghi al massimo 4.096 caratteri.
- Il file compresso in ingresso non può superare 250 MiB e deve contenere `_Meta`, una versione schema supportata e tutti i fogli richiesti.
- Prima di ExcelJS, un preflight ZIP isolato apre il file in sola lettura e legge soltanto la coda, la directory centrale, le intestazioni locali e gli eventuali data descriptor: non legge né decomprime i payload delle entry. Per il workbook autorevole ammette al massimo 4.096 entry, 4 MiB di directory centrale, nomi da 1.024 byte, extra field da 16 KiB, commenti da 4 KiB, 256 MiB non compressi complessivi, 128 MiB per entry e rapporto 200:1. I template importati riusano lo stesso motore con un profilo più restrittivo; addizioni e rapporti vengono controllati prima del parser.
- Il preflight rifiuta troncamenti, archivi multidisco o ZIP64, cifratura, flag o metodi di compressione non supportati, nomi vuoti/assoluti/traversali/con caratteri di controllo, duplicati anche dopo normalizzazione Unicode e confronto senza distinzione tra maiuscole e minuscole, offset sovrapposti, metadati centrali/locali o data descriptor incoerenti, parti OOXML obbligatorie mancanti, archivi annidati e parti macro, ActiveX, oggetti incorporati o link esterni. Gli errori IPC distinguono struttura non sicura e limite di risorse senza includere percorso o contenuto.
- Lo schema v9 mantiene UUID espliciti tra transazioni e registrazioni collegate, incluse spese di immobili, automobile e spese condivise, e conserva `accountId` anche sui movimenti e sulle ricorrenze di investimenti/comparti. `dueDate` separa la scadenza/competenza dalla data effettiva delle Transazioni e delle registrazioni immobiliari collegate. `Recurring Rate Changes` conserva soltanto UUID, UUID della ricorrenza, importo positivo finito e decorrenza normalizzata al primo giorno del mese; riferimenti orfani e due variazioni nello stesso mese sono rifiutati. La tabella `Accounts` comprende conti e Casse; soltanto una Cassa può avere un `defaultFundingAccountId`, che deve riferirsi a un conto non-Cassa nella stessa valuta. Le tasse immobiliari restano un catalogo validato nel workbook. I comandi dedicati salvano atomicamente i record collegati e la propagazione del dominio impedisce riferimenti orfani.
- Il finanziamento Automobile riusa senza nuovi campi persistenti `Vehicles`, `Recurring Items`, `Recurring Rate Changes`, `Transactions` e `Vehicle Entries`. Un comando validato salva insieme mezzo e piano, richiede una rata di uscita con categoria, metodo, Conto/Cassa e almeno rate residue o data di fine, normalizza il nome su quello del mezzo e impedisce due piani attivi per lo stesso `vehicleId`. Ogni scadenza mantiene una sola coppia UUID Transazione↔registrazione classificata `installment`; importazione e rollover scartano un piano se il mezzo collegato non esiste o non viene conservato.
- Chiudere un mezzo chiude il piano e rimuove soltanto le pianificazioni; riaprirlo le rigenera senza toccare le operazioni confermate. La cancellazione definitiva di un mezzo è rifiutata quando esistono Transazioni, registrazioni o consuntivi confermati. Un piano mai usato può essere eliminato; se possiede storico o cronologia tariffaria viene invece chiuso logicamente, conservando i collegamenti.
- I trasferimenti finanziari dichiarano esplicitamente l’effetto sulla liquidità (`inflow`, `outflow` o `neutral`). Un trasferimento interno neutro richiede `accountId` sorgente e `destinationAccountId` distinti, disponibili alla data e nella stessa valuta; produce effetti opposti sui due saldi ed è escluso dai consuntivi di entrate/uscite. Il conto di alimentazione della Cassa è solo un suggerimento della UI, non autorizza movimenti automatici.
- La liquidità include i saldi iniziali di conti e Casse e accetta movimenti soltanto nei rispettivi intervalli di validità (`openedAt`–`closedAt`). I riepiloghi filtrati sono trasformazioni pure di dominio: attribuiscono ogni effetto al gruppo Conto o Cassa e non introducono nuovi dati, IPC o persistenza. I nuovi movimenti con metodo contanti accettano soltanto una Cassa, mentre gli altri metodi accettano soltanto conti non-Cassa. All’apertura, un riferimento mancante viene completato solo quando esiste esattamente una scelta compatibile anche con metodo, valuta e data; i casi non univoci o privi di Cassa restano invariati e vengono segnalati. La stessa riparazione chiude i piani rateali attivi già arrivati a zero e rimuove esclusivamente le pianificazioni obsolete collegate. Ogni modifica viene salvata tramite il normale flusso verificato con backup ed è idempotente.
- Pensioni e comparti riusano le tabelle Investimenti dello schema v9: il tipo tecnico `pension` è riservato e protetto da modifica/cancellazione. Il controvalore, il capitale netto investito e la liquidità applicano soltanto movimenti confermati, escludendo le transazioni pianificate; i selettori separano investimenti e pensioni e aggregano soltanto le posizioni finali attive, impedendo il doppio conteggio.
- Versamenti e Liquidazioni di investimenti e comparti condividono una coppia UUID bidirezionale con una sola Transazione di tipo trasferimento. All’apertura, la riconciliazione usa prima i riferimenti espliciti e poi soltanto impronte esatte e univoche; crea il solo lato mancante, non modifica i casi ambigui e convalida nuovamente l’intero `FinanceData` prima di ogni scrittura.
- I workbook v1–v8 sono trasformati in memoria tramite migrazioni deterministiche e vengono convalidati integralmente come v9 prima di poter essere salvati. La migrazione v5→v6 propaga un conto già presente tra le due metà collegate e completa i riferimenti mancanti soltanto quando la scelta è univoca. La migrazione v6→v7 aggiunge destinazione, conto di alimentazione e riferimenti delle registrazioni collegate, propagando soltanto UUID già espliciti o coppie univoche. La migrazione v7→v8 assegna `dueDate` alle sole occorrenze pianificate, per le quali la data precedente era certamente la scadenza, e propaga il conto a una ricorrenza soltanto se tutte le sue Transazioni collegate indicano lo stesso UUID; non indovina la competenza di incassi storici confermati. La migrazione v8→v9 aggiunge una cronologia tariffaria vuota: l’importo base, le Transazioni e i record collegati restano invariati.
- Dopo la validazione, il caricamento verifica l’unicità degli UUID in ogni tabella identificata. Le occorrenze successive di un UUID duplicato ricevono un nuovo identificativo senza rimuovere record; i collegamenti bidirezionali vengono aggiornati soltanto quando la corrispondenza è univoca. Se anche il riferimento è stato copiato e risulta ambiguo, la copia successiva resta nel workbook ma viene scollegata per evitare cancellazioni o aggiornamenti incrociati.
- I consuntivi annuali dettagliati (`Property History`, `Investment History`, `Vehicle History`) contengono solo dati aggregati e identificativi interni; il rollover non copia movimenti confermati nel nuovo workbook, ma conserva le sole rate di affitto ancora pianificate e insolute con competenza originaria, UUID della Transazione e nuovi collegamenti interni validati. Per ogni ricorrenza mantenuta copia anche la cronologia tariffaria, così le scadenze del nuovo anno sono rigenerate con l’importo deterministico applicabile.
- Le stringhe utente vengono scritte come valori, non concatenate in formule. Il loader non esegue macro o formule; se incontra una cella formula legge il risultato memorizzato.
- Il file Numbers non viene modificato direttamente: su macOS è rigenerato importando il sidecar `.xlsx` tramite uno script AppleScript fisso.

Il generatore M14 è separato dal repository del workbook autorevole e non lo modifica. Accetta soltanto uno degli otto tipi in allowlist e una lingua supportata, usa esclusivamente un percorso assoluto `.xlsx` scelto dal dialogo nativo e prepara al massimo 5.000 righe. Ogni template contiene un foglio dati visibile e due fogli tecnici molto nascosti e protetti, metadati di tipo/versione e liste tramite intervalli denominati. Non inserisce formule di cella, macro, collegamenti esterni o contenuto attivo; rilegge il file temporaneo e ne verifica firma, fogli, intestazioni e assenza di formule/link prima della sostituzione con rollback. I cataloghi incorporati provengono dalla copia `FinanceData` già validata; senza workbook vengono omessi gli UUID instabili.

L’importatore M15 accetta soltanto `.xlsx` scelti con dialogo nativo e contratti template v2 in allowlist. I contratti rendono espliciti conto/Cassa e destinazione dei trasferimenti interni. Prima di ExcelJS esamina la directory centrale ZIP con limiti su file, voci, dimensione espansa, singola voce e rapporto di compressione; rifiuta cifratura, ZIP64, nomi duplicati o traversali, macro, fogli macro/dialogo, ActiveX, oggetti incorporati e link esterni. Dopo l’apertura richiede esattamente i tre fogli attesi, stati di visibilità, firma, versione, tipo, intestazioni e limiti, e rifiuta ogni formula o valore di cella attivo.

Il renderer riceve soltanto nome base, conteggi, importo aggregato, codici errore riga/colonna e un UUID di anteprima; non riceve percorso né comandi. Il piano validato resta in memoria nel main per 15 minuti. I riferimenti sono risolti tramite UUID attivo o nome esatto univoco, senza approssimazioni. La conferma passa il piano già preparato a una sola trasformazione di dominio, verifica la revisione del workbook e usa il salvataggio esistente con temporaneo, rilettura, backup, sostituzione e rollback. Nessuna scrittura avviene durante anteprima o annullamento e i contenuti finanziari non vengono loggati.

Il preflight limita deterministicamente l’espansione ZIP ma non sostituisce la validazione Zod, i limiti di cardinalità o il controllo dei fogli dopo l’apertura. L’isolamento dell’intero parsing in un worker/processo terminabile è stato valutato in M9: richiederebbe spostare caricamento, migrazione, riparazione e trasferimento del modello oltre un nuovo confine privilegiato. I limiti preventivi e i budget sintetici coprono gli attacchi ZIP noti senza tale complessità; resta possibile un’amplificazione CPU/heap del parser XML entro i limiti ammessi. Un processo terminabile va riesaminato se benchmark sintetici multipiattaforma mostrano che questi limiti non mantengono il caricamento entro il budget previsto. Aprire comunque soltanto file ContaMì provenienti da fonti affidabili.

### 7. Salvataggio, backup e conflitti

- Il nuovo workbook viene scritto in un file temporaneo nella stessa cartella.
- ContaMì lo rilegge e verifica fogli critici prima di sostituire il file attivo.
- La sostituzione usa rename e un file di rollback quando la piattaforma non consente la sovrascrittura diretta.
- Prima della sostituzione viene creata una copia in `.contami-backups`; sono mantenuti gli ultimi 10 backup `.xlsx`. L’impronta SHA-256 del backup deve coincidere con la revisione caricata, altrimenti il backup incompleto viene rimosso e il commit viene bloccato.
- La riparazione automatica degli UUID modifica in posto soltanto le celle necessarie e il timestamp tecnico, scrive un temporaneo, rilegge le celle corrette, crea un backup e usa la stessa sostituzione con rollback. Un file già corretto non viene riscritto alla riapertura.
- La migrazione di schema e la riconciliazione dei movimenti patrimoniali possono aggiungere campi o righe mancanti e quindi riscrivono il workbook canonico tramite il normale salvataggio temporaneo, rilettura, backup e sostituzione con rollback. Sono idempotenti: un workbook già migrato e riconciliato non viene riscritto; corrispondenze multiple o conflittuali vengono soltanto segnalate.
- Un cambio tariffa è una sola trasformazione di dominio: prima del salvataggio valida importo, decorrenza mensile, unicità e invarianza delle tariffe già confermate; modifica in posto soltanto pianificazioni interessate e relativi record collegati. Il renderer mostra un conteggio calcolato sulla copia validata, mentre il main ricontrolla la revisione del workbook e riusa temporaneo, rilettura, backup e rollback. Annullare l’anteprima non invia comandi e non scrive file.
- Anche il salvataggio Automobile+finanziamento attraversa un unico comando IPC tipizzato e una sola trasformazione `FinanceData`; non introduce percorsi, canali o capacità del renderer. Un errore di validazione lascia invariata la copia autorevole e quindi non avvia alcun salvataggio parziale.
- Dimensione, timestamp e impronta SHA-256 vengono catturati tramite un handle locale stabile dopo apertura e salvataggio. Il contenuto viene ricontrollato prima del backup e ancora immediatamente prima della sostituzione; qualunque differenza, anche a dimensione e timestamp invariati, blocca il commit e richiede la riapertura del workbook.
- Il commit usa un sidecar `.<nome-workbook>.contami.lock` creato in modo esclusivo e limitato a 4 KiB. Contiene soltanto versione, UUID casuali del proprietario/lease e tempi di acquisizione/scadenza, mai il percorso completo o dati finanziari. La lease dura cinque minuti ed è verificata prima delle mutazioni: un lock attivo blocca un secondo writer, uno scaduto richiede conferma esplicita nel renderer prima che il main rimuova esclusivamente quel sidecar e ricarichi il workbook. Lock malformati recenti sono trattati come attivi; diventano recuperabili soltanto dopo la stessa finestra temporale.
- Il passaggio d’anno crea un nuovo file e non elimina, sposta o rende inaccessibile il precedente.
- Se all’avvio il percorso ricordato non esiste più (`ENOENT`), ContaMì non crea né sovrascrive file: rimuove soltanto il collegamento obsoleto dalle preferenze, usa uno stato vuoto in memoria e richiede di aprire o creare esplicitamente un workbook. Errori di schema, struttura ZIP o limiti non vengono confusi con un file mancante: il percorso resta nelle preferenze, il file non viene modificato e la UI entra in stato non configurato con un messaggio di recupero, impedendo che lo stato vuoto possa essere salvato sopra il file rifiutato.

Il secondo hash restringe ma non elimina una gara nel brevissimo intervallo tra l’ultima verifica e `rename`: i programmi esterni non rispettano il lock cooperativo ContaMì. Evitare quindi modifiche simultanee in Excel/Numbers. Il backup della revisione verificata e il rollback restano il percorso di recupero.

### 8. Adapter Numbers

- Disponibile solo su macOS quando è rilevato il bundle `com.apple.Numbers`, nei percorsi standard di **Numbers** o **Numbers Creator Studio** dentro `/Applications` o `~/Applications`.
- I percorsi sorgente/destinazione devono essere assoluti e avere estensione prevista.
- `/usr/bin/osascript` viene invocato con `execFile` e argomenti separati, senza shell interpolation.
- Timeout 60 secondi e buffer output 64 KiB.
- La copia è prodotta in un percorso temporaneo e sostituita con rollback; in caso di errore il sidecar `.xlsx` resta la copia sicura.

macOS può chiedere il permesso di controllare Numbers. L’utente deve concederlo consapevolmente. L’adapter non è disponibile né emulato su Windows.

### 9. Preferenze, segreti e logging

- `settings.json` contiene solo lingua, tema, formato e percorsi; non contiene dati finanziari completi o segreti.
- Il file viene scritto atomicamente e con modalità `0600` sui sistemi POSIX. Su Windows valgono le ACL della cartella dati utente.
- Configurazione assente/corrotta produce valori sicuri di default; il workbook non viene cancellato.
- L’app non crea log applicativi persistenti e non stampa contenuti finanziari.
- Nessun keychain è necessario perché la versione corrente non usa segreti.

### 10. Protezione locale e cifratura

I workbook e i backup sono file normali non cifrati dall’app. La riservatezza dipende da permessi del filesystem, FileVault/BitLocker, blocco sessione e politiche di backup/sincronizzazione dell’utente. Non memorizzare il file in servizi cloud non approvati e non condividerlo senza una protezione adeguata.

### 11. Landing pubblica

La landing pubblica è un artifact web statico separato dall’app desktop. Il contenuto versionato sotto `landing/` non viene incluso in `app.asar` e non modifica CSP, blocchi di rete o capacità del renderer Electron. Il sito carica soltanto HTML, CSS, JavaScript, immagini e video dalla propria origine GitHub Pages; non usa CDN, font remoti, analytics, telemetria, cookie, backend o chiamate API. I soli collegamenti esterni portano, su azione dell’utente, al repository, alla licenza e alla pagina GitHub `releases/latest`. L’override manuale della lingua conserva esclusivamente `it` o `en` in `localStorage`; in assenza di override la lingua viene derivata da `navigator.language`, usando italiano solo per codici che iniziano con `it`.

Screenshot e dimostrazioni della landing devono contenere esclusivamente dati sintetici e non possono mostrare percorsi completi, workbook privati o informazioni identificative. I poster PNG coprono IT/EN e tema chiaro/scuro; le GIF di produzione restano sorgenti locali ignorate da Git e vengono pubblicate come MP4 H.264 ridimensionati e caricati con `preload="none"`. La validazione automatica controlla parità dei dizionari, asset richiesti, CSP, assenza di dipendenze remote, percorsi relativi compatibili con Project Pages e budget massimo dei video. Il workflow Pages è limitato a `landing/`, parte soltanto da `main` e usa Actions ufficiali fissate a commit SHA.

### 12. Dipendenze e supply chain

- `package-lock.json` rende riproducibili le versioni installate con `npm ci`.
- L’audit npm è eseguito localmente e in CI; al 2026-08-03 riporta 0 vulnerabilità note dopo gli override compatibili di `uuid >=11.1.1` per ExcelJS e di `shell-quote >=1.10.0`, `brace-expansion >=5.0.9` e `postcss >=8.5.23` per la toolchain di sviluppo.
- Gli script di installazione sono negati per default da npm 11; la allowlist versionata consente soltanto `esbuild@0.28.1` ed `electron-winstaller@5.4.0`, necessari alla build e al pacchetto Windows.
- Sviluppo, CI e packaging usano Node.js 24 LTS dalla versione 24.15.0. `.node-version` è la fonte unica della baseline; il preflight verifica che soddisfi `engines`, i requisiti delle dipendenze dirette e le configurazioni CI/documentali. `jsdom` 30.0.1 è stato integrato sulla stessa baseline.
- Dependabot controlla settimanalmente npm e GitHub Actions; tutte le Actions usate da CI e release sono fissate a commit SHA verificati nei repository ufficiali.
- CI esegue document hygiene, lint, typecheck, test, build, Playwright a 1080 px e audit su macOS e Windows.
- Le release su tag sono costruite da GitHub Actions, ispezionano il contenuto effettivo di `app.asar`, avviano l’eseguibile unpacked, installano il DMG/NSIS in un’area temporanea della piattaforma di build, verificano avvio e rimozione e includono checksum SHA-256.

Rischi residui: alcune catene transitive di `exceljs` ed `electron-builder` includono pacchetti deprecati pur senza vulnerabilità note correnti; vanno rivalutate con gli aggiornamenti upstream. La Action fissata `softprops/action-gh-release@v3.0.2` usa nativamente Node.js 24. Gli artifact sono deliberatamente generati senza certificati, firma ad-hoc del bundle o notarizzazione. Bundle, metadati tecnici ed eseguibile macOS usano il nome ASCII `Contami` per evitare un crash del runtime unsigned su Apple Silicon; logo, titolo e UI mantengono il marchio `ContaMì`. Lo smoke test locale del bundle ARM non firmato, con Hardened Runtime predefinito, è riuscito. Gatekeeper richiede comunque l’approvazione esplicita in Privacy e Sicurezza e Windows può mostrare SmartScreen o bloccare l’app con Smart App Control. Checksum e istruzioni riducono il rischio operativo, ma non sostituiscono l’identità crittografica del produttore.

### 13. Verifiche implementate

- unit test per comandi, catalogo tasse e relativi vincoli, saldi separati di conti/Casse, trasferimenti interni neutri, compatibilità metodo-conto, aggregazioni di consumi/condominio/automobili, finanziamento Automobile atomico e univoco, classificazione/ciclo di vita delle rate, indicatori di perdita investimenti/pensioni, competenza/incasso delle rate di affitto, variazioni tariffarie future e storico confermato, rollover, migrazione v1–v8→v9, propagazione del conto e sincronizzazione bidirezionale/cancellazione di Versamenti/Liquidazioni;
- integrazione round-trip workbook, hash con dimensione/timestamp invariati, destinazione creata in concorrenza e controllo file modificato esternamente;
- gare controllate tra writer, modifica nella finestra pre-`rename`, lock attivo/scaduto/malformato e recupero esplicito dopo crash;
- preflight ZIP a lettura limitata con limiti separati per file, entry, directory centrale, espansione e rapporto; corpus sintetico per troncamenti, duplicati, percorsi anomali, archivi annidati, metadati incoerenti e mutazioni con seed riproducibile; rifiuto integrato prima di ExcelJS e regressione dei workbook v1/v2 migrabili;
- integrazione del recupero all’avvio quando il workbook ricordato è stato spostato o cancellato;
- test impostazioni atomiche e validate;
- test delle tuple IPC, inclusi argomenti inattesi e payload non validi;
- test strutturali e round-trip degli otto template, cataloghi presenti/assenti, intervalli denominati, fogli protetti, limite di 5.000 righe, assenza di formule/link e dialogo che non espone il percorso;
- preflight dei workbook con corpus interamente sintetico per troncamenti, archivi annidati, zip bomb, duplicati, traversal, cifratura, ZIP64 e metadati locali/centrali incoerenti; mutazioni seeded riproducibili e budget di rifiuto prima di ExcelJS;
- test del focus intrappolato/ripristinato nelle modali e riduzione del movimento;
- budget prestazionale su 25.000 transazioni, 1.200 immobili e 1.200 investimenti sintetici;
- lint, typecheck e build separata main/preload/renderer;
- controllo automatico della baseline Node.js rispetto a `engines`, dipendenze dirette, CI e documentazione;
- audit dipendenze;
- verifica Playwright riproducibile IT/EN, chiaro/scuro, focus e assenza di overflow a 1080 px, oltre al collaudo visivo esteso delle viste;
- rendering indipendente di un workbook sintetico, senza dati dell’utente;
- controllo CI che impedisce di tracciare `sources/`, `.numbers`, `.xlsx`, chiavi e certificati.
- ispezione di `app.asar` e delle risorse effettive, più installazione, avvio e rimozione automatica del DMG/NSIS su runner macOS e Windows.
- validazione statica della landing bilingue, dei percorsi Project Pages, della CSP, dei media localizzati e dell’assenza di dipendenze web remote.

### 14. Risposta a incidenti e recupero

1. Chiudi ContaMì e le app che usano il workbook.
2. Copia il file sospetto senza modificarlo.
3. Recupera l’ultimo backup valido da `.contami-backups` o il workbook dell’anno precedente.
4. Verifica il checksum dell’installer e reinstalla da una release privata ufficiale se sospetti una manomissione.
5. Non allegare workbook reali a issue o log pubblici; usa una riproduzione sintetica.

### 15. Miglioramenti pianificati

- M11: rimozione di `style-src 'unsafe-inline'` dalla CSP.

La cifratura applicativa non è pianificata: resta una decisione futura senza milestone o versione assegnata. Sarà rivalutata soltanto se una soluzione standard conserverà interoperabilità e recupero con Excel e Numbers; nel frattempo sono raccomandati FileVault/BitLocker, permessi del filesystem e backup protetti.

La firma Developer ID/notarizzazione macOS e Authenticode Windows non è una milestone pianificata in assenza delle relative credenziali. Le build restano non firmate e accompagnate da checksum e istruzioni Gatekeeper/SmartScreen. Non sono pianificate integrazioni web o dati di mercato: il blocco della rete resta invariato.

---

## English

### 1. Purpose and operating model

ContaMì is a local-first desktop app for personal financial data. Its primary trust boundary is the user’s computer: it reads and writes only a workbook selected through native dialogs and a small preferences file. There is no backend, account, telemetry, advertising, analytics, or built-in cloud sync.

The workbook is authoritative. In-memory data is a validated copy used for calculations and UI; each valid command produces a newly verified workbook before replacement.

### 2. Protected assets and threats

Protected assets include financial records—including investments, private pensions and compartments, household consumption, vehicles, the property-tax catalog, and catalog snapshots embedded in import templates—workbook/backup paths, schema and annual-summary integrity, preferences, and release artifacts. ContaMì does not collect credentials, passwords, PINs, tokens, or API keys.

Threats considered include malformed `.xlsx` input, a compromised renderer attempting privileged access, concurrent external edits, interrupted saves, formula injection, invalid paths/oversized files, unexpected navigation or network access, and supply-chain compromise. A compromised operating system, same-user malware, or unlocked physical access remains outside what the app alone can defend.

### 3. Privilege separation

- Electron enables context isolation, disabled Node integration, sandboxing, web security, and no insecure content.
- The preload exposes only a frozen, minimal ContaMì API—never raw IPC, Node.js, or generic filesystem methods.
- IPC uses a centralized allowlist. Every call must originate from the authorized window's main frame and currently loaded URL; Zod validates argument tuples, arity, and payloads, and errors are redacted. M10 recovery accepts no argument or path and can remove only the configured workbook’s already-expired lock.
- File paths come only from native main-process dialogs. For templates, the renderer sends only a validated type and language and receives only cancellation state and file name, never the complete path.
- Main, preload, domain, persistence, settings, and renderer remain separate modules.
- A single application instance is allowed. During commit, a per-workbook cooperative lock also prevents separate ContaMì processes or copies from saving the same revision concurrently.

### 4. Network and active content

Production Electron sessions cancel HTTP/HTTPS and WS/WSS requests. CSP allows local resources only, disables objects and base URLs, and permits only the local Vite server during development. Popups, webviews, external navigation, navigable drag-and-drop, renderer downloads, permission requests, and permission checks are denied. No remote font, image, script, or analytics endpoint is loaded.

Inline styles remain allowed for the current UI. React escaping and the absence of untrusted HTML mitigate this, but removing `style-src 'unsafe-inline'` is a future hardening target.

### 5. Data and workbook validation

Zod validates UUIDs, ISO dates, timestamps, enum values, text length, finite amounts, share reconciliation, and collection limits. Only absolute `.xlsx` paths up to 4,096 characters and compressed files up to 250 MiB are accepted. Before ExcelJS, an isolated read-only ZIP preflight reads only the tail, central directory, local headers, and any data descriptors—never entry payloads—and permits at most 4,096 entries, a 4-MiB central directory, 1,024-byte names, 16-KiB extra fields, 4-KiB comments, 256 MiB total uncompressed data, 128 MiB per entry, and a 200:1 ratio. Imported templates use the same engine with a stricter profile. The preflight rejects truncation, multidisk/ZIP64 archives, encryption, unsupported flags or compression, empty/absolute/traversal/control-character paths, normalized case-insensitive duplicates, overlapping offsets, inconsistent central/local metadata or data descriptors, missing required OOXML parts, nested archives, macros, ActiveX, embedded objects, and external links. Renderer-visible failures distinguish unsafe structure from resource limits with redacted codes containing no paths or content. Required sheets, `_Meta`, and schema version must then validate. Schema v9 uses explicit UUID links between Transactions and mirrored property, vehicle, shared-expense, investment, and recurring records; `dueDate` keeps the due period separate from the Transaction’s actual date and is mirrored to linked property entries. `Recurring Rate Changes` stores only its UUID, recurring-item UUID, a positive finite amount, and an effective date normalized to the first day of a month; orphan references and two changes in the same month are rejected. `Accounts` stores both accounts and cash registers; only a cash register may reference a same-currency, non-cash default funding account. A neutral internal transfer requires distinct, date-available, same-currency source and destination accounts and applies opposite balance effects while remaining outside income/expense actuals. The funding account is a UI suggestion only and never authorizes an automatic movement. Domain propagation keeps linked records synchronized, cascade deletion removes dependants, and in-use catalogs return `ENTITY_IN_USE`.

Vehicle financing reuses `Vehicles`, `Recurring Items`, `Recurring Rate Changes`, `Transactions`, and `Vehicle Entries` without adding persistent fields. One validated command saves vehicle and plan together, requires an expense installment with category, method, account/cash register, and either remaining installments or an end date, synchronizes the plan name with the vehicle, and rejects two active plans for one `vehicleId`. Each occurrence retains one Transaction↔Vehicle Entry UUID pair classified as `installment`; import and rollover do not carry a plan whose vehicle is missing or excluded. Closing/reopening a vehicle removes/regenerates planned rows only. Permanent deletion is rejected once confirmed Transactions, entries, or annual history exist; an unused plan can be removed, while a plan with confirmed/rate history is logically closed and retained.

Liquidity includes opening balances for accounts and cash registers and accepts movements only within each opening/closing interval. Filtered summaries are pure domain transformations: they attribute each effect to the account or cash-register group and add no data, IPC, or persistence. New cash-payment records accept cash registers only; other payment methods accept non-cash accounts only. On load, a missing reference is assigned only when exactly one account is compatible with payment method, currency, and date; ambiguous cases and cash records with no cash register remain unchanged and are reported. Version 1–8 data is deterministically migrated in memory and fully validated as v9 before save. The v6→v7 migration adds destinations, funding references, and linked-record account fields by propagating explicit or unique references only; the v7→v8 migration adds due dates to planned occurrences and never guesses the period of confirmed historical receipts; v8→v9 adds an empty rate history without changing base amounts, Transactions, or linked records. Liquidity follows the actual Transaction date, while rent status follows `dueDate`. The same idempotent, backed-up repair closes active installment plans already at zero and removes only their obsolete planned rows.

Pensions and compartments reuse the schema-v9 Investments tables. The technical `pension` type is reserved and protected against editing/deletion. Countervalue, net invested capital, and current liquidity apply confirmed movements only, excluding planned Transactions; domain selectors separate investments from pensions and aggregate active leaf positions only, preventing double counting. Detailed property, investment, and vehicle history sheets store annual aggregates only; rollover does not copy confirmed transactions into the new workbook, but carries still-planned overdue rent instalments with their original due period, Transaction UUID, newly validated internal links, and the rate history for each retained recurring item.

Investment and pension-compartment Contributions and Liquidations share a bidirectional UUID pair with exactly one transfer Transaction. On load, reconciliation first uses explicit references and then exact unique fingerprints only; it creates only the missing side, leaves ambiguous cases unchanged, and validates the complete `FinanceData` again before any write.

After schema validation, loading checks UUID uniqueness within every identified table. Later occurrences of a duplicate UUID receive a new identifier without removing records, and bidirectional links are updated only when the match is unambiguous. If a copied reference is also ambiguous, the later copy remains in the workbook but is detached to prevent cross-record deletion or updates.

User strings are written as values, not interpolated into formulas. The loader never executes macros or formulas. ZIP expansion is now bounded before schema validation; those checks do not replace Zod and collection limits after parsing.

The M14 generator is separate from the authoritative workbook repository and never modifies that workbook. It accepts only one of eight allowlisted types and a supported language, uses only an absolute `.xlsx` destination selected by the native dialog, and prepares at most 5,000 rows. Each template contains one visible data sheet and two very-hidden protected technical sheets, type/version metadata, and named-range validation lists. It adds no cell formulas, macros, external links, or active content; it reopens the temporary output and verifies its signature, sheets, headers, and absence of formulas/links before replacement with rollback. Embedded catalogs come from already validated `FinanceData`; without a workbook, unstable UUIDs are omitted.

The M15 importer accepts only native-dialog-selected `.xlsx` files and allowlisted v2 template contracts, which explicitly include account/cash-register references and internal-transfer destinations. Before ExcelJS opens the file, it inspects the ZIP central directory and enforces limits on file size, entry count, expanded size, individual entries, and compression ratio; encryption, ZIP64, duplicate or traversal names, macros, macro/dialog sheets, ActiveX, embedded objects, and external links are rejected. After opening, it requires exactly the three expected sheets and states, signature, version, type, headers, and limits, and rejects every formula or active cell value.

The renderer receives only the base file name, counts, an aggregate amount, row/column error codes, and an opaque preview UUID; it receives neither paths nor commands. The validated plan stays in main-process memory for 15 minutes. References resolve only through an active UUID or an exact unique name, with no fuzzy guessing. Confirmation sends the prepared plan through one domain transformation, checks workbook revision, and reuses temporary save, re-read verification, backup, replacement, and rollback. Preview and cancellation perform no writes, and financial content is never logged.

M9 evaluated moving the whole parser into a terminable worker/process. That would require moving load, migration, repair, and model transfer across a new privileged boundary. The preventive limits and synthetic budgets cover known ZIP attacks without that complexity, so parsing remains in the main process for now. XML parsing can still amplify CPU or heap within the admitted expansion limits; a terminable process should be reconsidered if cross-platform synthetic benchmarks show those limits do not keep loading within budget. Workbooks should still come from trusted sources.

### 6. Saves, backups, and conflicts

ContaMì writes a same-directory temporary workbook and reopens it to verify critical sheets. It then creates an adjacent backup whose SHA-256 fingerprint must match the loaded revision, rechecks that revision immediately before replacement, and replaces the active file with rollback behavior. It retains 10 backups. Schema migration uses the same guarded replacement. Size, modification time, and SHA-256 detect external changes—including same-size, same-timestamp edits—and block the save until the workbook is reopened. Year rollover creates a new file and never deletes or moves the previous one.

The commit uses an exclusively created, 4-KiB-bounded `.<workbook-name>.contami.lock` sidecar. It contains only a version, random owner/lease UUIDs, and acquisition/expiry times—never the complete path or financial data. Its five-minute lease is checked before mutations. An active lock blocks another writer; an expired lock requires explicit renderer confirmation before main removes only that sidecar and reloads the workbook. Recent malformed locks are treated as active and become recoverable only after the same lease window.

Automatic UUID repair changes only the required cells and technical timestamp in place, writes a temporary file, rereads the repaired cells, creates a backup, and uses the same rollback-capable replacement. Reopening an already repaired workbook does not rewrite it.

Schema migration and asset-movement reconciliation may add missing fields or rows, so they rewrite the canonical workbook through the normal temporary save, reread verification, backup, and rollback-capable replacement. They are idempotent: an already migrated and reconciled workbook is not rewritten, while multiple or conflicting matches are only reported.

A rate change is one domain transformation: before save it validates the amount, normalized effective month, uniqueness, and invariance of confirmed rates, then updates in place only affected planned rows and linked records. The renderer previews a count from its validated copy; main checks the workbook revision again and reuses temporary save, reread verification, backup, and rollback. Canceling the preview sends no command and writes no file.

Saving a Vehicle with financing likewise uses one typed IPC command and one `FinanceData` transformation. It adds no path, IPC channel, or renderer capability; validation failure leaves authoritative data unchanged and starts no partial save.

If the remembered path no longer exists at startup (`ENOENT`), ContaMì creates or overwrites no file: it removes only the stale preference, uses an empty in-memory state, and requires the user to explicitly open or create a workbook. Schema, ZIP-structure, and resource-limit failures are not treated as missing files: the path remains in preferences, the file is unchanged, and the UI enters an unconfigured recovery state, preventing empty data from being saved over the rejected file.

The second hash narrows but cannot eliminate the very small race between the last check and `rename`, because external spreadsheet apps do not honor ContaMì’s cooperative lock. Avoid simultaneous Excel/Numbers edits. The verified-revision backup and rollback remain the recovery path.

### 7. Numbers adapter

The adapter is macOS-only and detects Apple bundle id `com.apple.Numbers` at standard **Numbers** and **Numbers Creator Studio** locations under `/Applications` or `~/Applications`. It validates absolute `.xlsx`/`.numbers` paths and invokes a fixed AppleScript via `execFile` with separate arguments. It has a 60-second timeout and 64-KiB output cap. Temporary and rollback paths protect the previous copy; the interoperable `.xlsx` sidecar remains safe on failure. macOS automation consent may be required.

### 8. Preferences, secrets, logging, and encryption

`settings.json` stores language, theme, format, and paths only. It is atomically written with POSIX mode `0600`; Windows uses user-data-folder ACLs. Invalid settings fall back safely and never remove the workbook. The app creates no persistent application logs and does not print financial content.

Workbooks and backups are not encrypted by ContaMì. Use filesystem permissions, FileVault/BitLocker, session locking, and appropriate encrypted backups. No keychain is required because the app has no secrets.

### 9. Public landing page

The public landing page is a static web artifact separate from the desktop application. Versioned content under `landing/` is not included in `app.asar` and does not change the Electron renderer's CSP, network blocks, or capabilities. The site loads only HTML, CSS, JavaScript, images, and video from its own GitHub Pages origin; it uses no CDN, remote fonts, analytics, telemetry, cookies, backend, or API calls. External links navigate, only after user action, to the repository, license, and GitHub `releases/latest` page. A manual language override stores only `it` or `en` in `localStorage`; without an override, `navigator.language` selects Italian only for codes starting with `it`.

Landing screenshots and demonstrations must contain synthetic data only and must not expose full paths, private workbooks, or identifying information. PNG posters cover Italian/English and light/dark themes; production GIFs remain local, Git-ignored sources and are published as resized H.264 MP4 files loaded with `preload="none"`. Automated validation checks translation parity, required assets, CSP, absence of remote runtime dependencies, relative Project Pages paths, and video budgets. The Pages workflow is scoped to `landing/`, deploys only from `main`, and pins official Actions to commit SHAs.

### 10. Supply chain and verification

`package-lock.json` plus `npm ci` provide deterministic dependency resolution. As of 2026-08-03, npm audit reports zero known vulnerabilities after compatible `uuid >=11.1.1` for ExcelJS and `shell-quote >=1.10.0`, `brace-expansion >=5.0.9`, and `postcss >=8.5.23` overrides for the development toolchain. npm 11 denies unlisted install scripts; the versioned allowlist permits only `esbuild@0.28.1` and `electron-winstaller@5.4.0`, required for builds and Windows packaging. Development, CI, and packaging use Node.js 24 LTS from version 24.15.0. `.node-version` is the single baseline source; preflight verifies it against `engines`, direct-dependency requirements, CI, and documentation. `jsdom` 30.0.1 uses the same baseline. Dependabot monitors npm and Actions weekly; every Action used by CI and release is pinned to a commit SHA resolved from its official repository. CI runs hygiene checks, lint, typecheck, tests, build, 1080-px Playwright checks, and audit on macOS and Windows. Tagged releases inspect the actual `app.asar` content, launch the unpacked executable, install the DMG/NSIS in a temporary platform-specific location, verify launch and removal, and publish SHA-256 checksums.

Residual risks: transitive `exceljs` and `electron-builder` chains still contain deprecated packages despite having no current known vulnerabilities; upstream updates must be reassessed. The pinned `softprops/action-gh-release@v3.0.2` uses Node.js 24 natively. Artifacts are deliberately built without certificates, bundle-level ad-hoc signing, or notarization. The macOS bundle, technical metadata, and executable use the ASCII name `Contami` to avoid an unsigned-runtime crash on Apple Silicon; the logo, title, and UI retain the **ContaMì** brand. The local unsigned ARM-bundle smoke test passed with the default Hardened Runtime. Gatekeeper still requires explicit approval under Privacy & Security, and Windows may show SmartScreen or block the app through Smart App Control. Checksums and instructions reduce risk but do not provide cryptographic publisher identity.

### 11. Tests and recovery

Implemented checks cover domain aggregation (including separate account/cash-register balances, neutral internal transfers, payment-method compatibility, utilities, condominium, vehicles, atomic and unique vehicle financing, installment classification/lifecycle, confirmed-only liquidity, and rent due/receipt allocation), future-only recurring rate changes and confirmed-history invariance, configurable-tax CRUD and constraints, investment/private-pension loss indicators and separation without double counting, reserved pension-type protection and rollover, v1–v8→v9 migration with conservative account/due-date propagation and unchanged base rates, bidirectional record synchronization and deletion, idempotent Contribution/Liquidation reconciliation with ambiguous cases, workbook round-trip, missing/unsafe-workbook startup recovery, SHA-256 external-edit detection with preserved size/timestamp, overlapping-writer races, pre-rename interference, active/stale/malformed locks and explicit crash recovery, validated atomic settings, strict IPC tuples, bounded-read ZIP preflight limits, a fully synthetic corpus for truncation, zip bombs, duplicates, traversal, nesting, encryption, ZIP64, inconsistent metadata and data descriptors, reproducible seeded mutations, adapter rejection before ExcelJS, v1/v2 migration regression, structural and round-trip verification of all eight v2 templates (catalog modes, named ranges, protected sheets, 5,000-row limit, no formulas/links, and path-redacting dialog), dialog focus containment/restoration, reduced motion, a synthetic large-dataset performance budget, Node.js-baseline consistency across `engines`, direct dependencies, CI, and documentation, builds, dependency audit, reproducible Playwright UI flows in both languages/themes at 1080 px, actual `app.asar` inspection, unpacked and installed-package smoke tests with removal, independent workbook rendering, and CI rejection of private sources/workbooks/keys.

For recovery: close all workbook users, preserve a copy of the suspect file, restore from `.contami-backups` or the prior-year workbook, verify installer checksums, and never attach real financial files to public issues—use synthetic reproduction data.

### 12. Planned improvements

M11 removes `style-src 'unsafe-inline'` from the CSP.

Application-level encryption is not planned and has no assigned milestone or version. It may be reconsidered only if a standard solution preserves direct Excel/Numbers interoperability and recovery. FileVault/BitLocker, filesystem permissions, and protected backups remain the recommended controls.

macOS Developer ID signing/notarization and Windows Authenticode are not scheduled milestones while the required credentials are unavailable. Builds remain unsigned and accompanied by checksums and Gatekeeper/SmartScreen instructions. No web integrations or market-data features are planned, and the network block remains unchanged.
