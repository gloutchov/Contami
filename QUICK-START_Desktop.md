# ContaMì — Quick start desktop

## Italiano

1. Scarica dalla release privata il DMG macOS `arm64`/`x64` oppure l’installer Windows `x64` insieme a `SHA256SUMS.txt`; verifica il checksum e installa il pacchetto seguendo gli avvisi documentati nel manuale.
2. Avvia ContaMì. Lingua e tema seguono il sistema finché non scegli un override.
3. Nella Panoramica premi **Crea nuovo foglio**. Scegli Excel su macOS/Windows oppure Numbers su macOS con Numbers installato.
4. Apri **Impostazioni** e crea almeno un conto; se usi contanti, crea anche una **Cassa** e associa facoltativamente il conto di alimentazione predefinito. Personalizza categorie e metodi di pagamento se necessario.
5. Usa **Transazioni** per entrate e uscite quotidiane: i riepiloghi filtrati separano Conto e Cassa. La Panoramica mostra anche il saldo complessivo delle Casse; nelle nuove spese di **Immobili** e **Automobile** puoi scegliere **Dividi automaticamente a metà** per creare anche la Spesa condivisa collegata; in Automobile puoi inoltre aggiungere al mezzo un unico finanziamento collegato alle Ricorrenze.
6. Chiudi elementi conclusi con **Chiudi**: restano nello storico e possono essere riaperti.
7. Per cambiare l’importo di una ricorrenza, apri **Modifica → Cambia tariffa**, scegli importo e mese e controlla l’anteprima: vengono aggiornate soltanto le scadenze pianificate.
8. A fine anno usa **Chiudi anno**. Scegli il nuovo file; ContaMì non elimina né sovrascrive il vecchio.

Il workbook è il dato autorevole. Non tenerlo aperto e modificarlo contemporaneamente in Excel/Numbers mentre salvi dall’app: ContaMì confronta anche l’impronta SHA-256 e blocca il conflitto. I salvataggi ContaMì usano inoltre un lock cooperativo a scadenza; dopo un crash, l’app chiede conferma prima di rimuovere il solo lock scaduto. I backup sono nella cartella nascosta `.contami-backups` accanto al file `.xlsx`.

## English

1. From the private release, download the macOS `arm64`/`x64` DMG or Windows `x64` installer together with `SHA256SUMS.txt`; verify the checksum and install the package by following the warning guidance in the manual.
2. Launch ContaMì. Language and theme follow the system until you choose an override.
3. From Overview, select **Create new workbook**. Choose Excel on macOS/Windows or Numbers on macOS with Numbers installed.
4. Open **Settings** and create at least one account; if you use cash, also create a **Cash register** and optionally select its default funding account. Customize categories and payment methods if needed.
5. Use **Transactions** for everyday income and expenses: filtered summaries separate accounts from cash registers. Overview also shows the total cash-register balance; new **Property** and **Vehicle** costs offer **Split automatically in half** to create the linked Shared Expense; Vehicles can also own one financing plan linked to Recurring Items.
6. Use **Close** for completed items: they remain in history and can be reopened.
7. To change a recurring amount, open **Edit → Change rate**, choose the amount and month, and review the preview: only planned occurrences are updated.
8. At year-end use **Close year**. Pick the new file; ContaMì never deletes or overwrites the old one.

The workbook is authoritative. Do not edit it concurrently in Excel/Numbers while saving from the app: ContaMì also compares a SHA-256 fingerprint and blocks the conflict. ContaMì saves also use an expiring cooperative lock; after a crash, the app asks for confirmation before removing only the expired lock. Backups live in the hidden `.contami-backups` folder beside the `.xlsx` file.
