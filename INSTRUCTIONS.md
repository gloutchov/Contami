# ContaMì — User manual

## 1. What ContaMì is

ContaMì organizes detailed personal finances through a simple interface while keeping the data in a spreadsheet that remains readable without the app. It covers transactions, accounts, properties and consumption, investments and savings, recurring/installment payments, shared expenses, and yearly summaries.

The app is local-first: it requires no account, uses no cloud service, and sends no telemetry.

## 2. Requirements and installation

- 64-bit macOS or Windows;
- enough space for the app, workbook, and backups;
- Apple Numbers only if you want a native `.numbers` mirror;
- Excel is not required: ContaMì reads and writes `.xlsx` directly.

Release builds are produced by GitHub Actions without certificates and without a bundle-level ad-hoc signature. Always verify the SHA-256 checksum shipped with the release. macOS Gatekeeper or Windows SmartScreen may warn: proceed only when the file comes from the official private release.

### Unsigned macOS installation

1. Download the DMG for your processor: `arm64` for Apple Silicon or `x64` for an Intel Mac.
2. Verify its checksum, open the DMG, and drag `Contami` to **Applications**.
3. Try to open `Contami`. If macOS says it cannot verify the developer, close the warning.
4. Open **System Settings → Privacy & Security**, scroll to Security, and choose **Open Anyway** beside `Contami`.
5. Confirm with your password or Touch ID. macOS remembers the exception for future launches.

Do not disable Gatekeeper globally or run commands that broadly remove security attributes. If the checksum differs or the alert says the file is damaged, do not launch it: download it again from the official release. See [Apple’s procedure](https://support.apple.com/guide/mac-help/mh40616/mac).

The bundle and executable use the ASCII technical name `Contami` for unsigned macOS-build compatibility. The logo, window title, and UI display the **ContaMì** product name.

### Unsigned Windows installation

1. Download `Contami-…-win-x64.exe` and verify its checksum.
2. Run the installer. If SmartScreen displays **Windows protected your PC**, choose **More info**.
3. Confirm that the named file is `Contami`, then choose **Run anyway**.

Smart App Control can block an app without offering a per-app exception. In that case, do not disable it to install ContaMì: run from source with Node.js 24 LTS from 24.15.0 onward, or wait for a signed build. Keep Microsoft Defender enabled. See Microsoft guidance on [unrecognized apps](https://support.microsoft.com/en-us/office/protect-my-pc-from-viruses) and [Smart App Control](https://support.microsoft.com/windows/smart-app-control-frequently-asked-questions-285ea03d-fa88-4d56-882e-6698afdb7003).

## 3. First launch

1. Launch ContaMì: it uses Italian when the system language is Italian, otherwise English.
2. Light/dark mode follows the system.
3. From Overview choose **Create new workbook** or **Open existing workbook**.
4. Under **Settings → Account**, add the bank account; if you use cash, create one or more **Cash registers** and optionally associate each with its default funding account.
5. Review categories, payment methods, and investment types; add or adapt them to your habits.

### Excel or Numbers

- **Excel (.xlsx)**: recommended and portable across macOS and Windows.
- **Numbers (.numbers)**: macOS only and requires Numbers, including the version installed through **Apple Creator Studio**. ContaMì also keeps a `.contami.xlsx` file beside the Numbers copy; do not delete it, because it is the interoperable copy used by the app.

The format preference applies to the next workbook you create. Opening an existing `.xlsx` makes that file active.

## 4. Overview

The home page shows:

- net worth: liquidity + active property value + active investments + private pensions;
- liquidity: opening balances for accounts and cash registers plus confirmed linked movements; internal transfers move value between two balances without changing the total, and movements before opening or after closure do not affect it;
- cash-register balance: the share of liquidity held across cash registers, calculated from their opening balances and confirmed movements;
- property value: latest valuation, or purchase price, multiplied by ownership share;
- investment value: latest valuation for active non-pension investments;
- pension value: latest active-compartment valuations, without double-counting their pension collector;
- current-year income and expenses;
- monthly equivalent of active recurring commitments;
- outstanding shared balance;
- monthly trend and spending categories;
- recent transactions and recent recurring expenses, limited to confirmed records through today (future or planned rows are excluded);
- three yearly comparisons: asset composition, income/expenses, and monthly commitments;
- total property-related income and expenses.

Closed-year points come from `Annual Summaries`; the current-year point is recalculated from live records. Year rollover preserves the totals required for these comparisons.

Transfers do not count as current income or expense. They may be internal and neutral for total liquidity, or carry an inflow/outflow from liquid assets. An ATM withdrawal, for example, is one Transaction from the source account to the destination cash register: the bank balance decreases and the cash-register balance increases by the same amount. Investment contributions, purchases, liquidations, and sales use their applicable cash-flow direction. Currency is recorded, but the initial version does not convert currencies automatically.

## 5. Transactions

Choose **New transaction** and enter:

- income, expense, or transfer;
- for a transfer, its cash effect (outflow, inflow, or neutral between accounts);
- date and description;
- category and payment method;
- a matching account or cash register is required for income, expenses, and cash-directed transfers; internal transfers require distinct source and destination accounts in the same currency; property, investment, and recurring-item links remain optional;
- whether an expense is shared and who paid it;
- amount, EUR currency, and optional notes.

Filter by text, type, category, payment method, and month. **Reset filters** clears every criterion together and restores the complete list. The first card row shows filtered inflows, outflows, and balance for non-cash accounts; the second shows the same three values for cash registers only. Each balance starts from its own group’s opening balances and applies only the visible rows: an internal account→cash-register transfer is therefore an account outflow and a cash-register inflow while remaining neutral for total liquidity. The “as of today” strip uses confirmed rows through today only and shows aggregate flows and liquidity. A persistent notice reports current-year movements without an account or cash register. On loading an older workbook, ContaMì fills a missing reference only when exactly one compatible choice exists and never automatically reclassifies historical cash movements. Recurring rows are highlighted, while future rows are marked as planned. **Confirm** asks for the actual receipt or payment date and preserves the original due date separately.

Example: for groceries paid in cash, choose **Expense**, category **Groceries**, payment method **Cash**, and the affected cash register. The bank account is not changed.

Linking a transaction to a property, investment, or shared expense creates/updates the corresponding record automatically. For investments and pension compartments, an outflow transfer becomes a Contribution and an inflow transfer becomes a Liquidation. Editing, confirmation, and deletion stay synchronized to prevent double counting.

## 6. Properties

Use **New property** for name, type, use (residence, rental, or other), address, area, ownership share, cadastral value, purchase date/price, and notes. A rental can also define expected rent and due day.

Open a property and choose **New entry** for income, expense, valuation, or consumption. A valuation accepts either the total value or a per-square-metre value calculated against the property floor area. Monetary entries use the same categories and payment methods as Transactions and are mirrored there automatically; the reverse direction works too.

Use **Utilities** for Electricity, Gas, Water, and Phone/Internet. Electricity accepts F1, F2, F3, or combined F2+F3 readings; gas and water accept cubic metres. The **Taxes** catalog starts with TV licence, IMU, and TARI but can be changed under Settings. Each tax can apply to all properties, the residence only, or rental properties only and can define 1–24 instalments. A tax can be included in the common property-expense summary through its dedicated checkbox. Separately, every cost is mirrored to Transactions and can optionally create a Shared expense between people with payer and split details.

Details can be filtered across all twelve months of the active year and by description, with matching subtotals. The **Common property expenses** summary provides the same combinable filters and recalculates its total from visible rows only. A residence shows electricity, gas, and water quantities and costs, condominium, Phone/Internet, and TV licence, plus separate yearly consumption and spending charts. Every property plots commercial values on the actual valuation dates; rentals plot income and expenses on actual receipt dates. Their **Rent instalments** table instead follows the due date/period and distinguishes Paid, Paid late, Overdue, and Awaiting payment: a June rent received in July remains assigned to June and does not settle July. Planned rent rows stay out of ordinary property entries and subtotals; if still overdue at year rollover, they retain their original due period. When adding a new rental-property income entry with the Rent category, you can also create the monthly recurring rent and link the current instalment to it.

## 7. Vehicles

Use **New vehicle** to record its name, make, model, fuel type, and purchase/sale dates and prices. Disposed vehicles remain available for historical comparisons.

In the same form, enable **Manage financing** and enter installment amount, frequency, next due date, remaining installments or an end date, category, payment method, and account/cash register. The vehicle and plan are saved together: ContaMì creates one linked Recurring Item and one Transaction↔Vehicle record pair classified as **Installment** for each occurrence. Repeated edits do not duplicate the plan. Use **Change rate** in the same section for future amount changes; the base rate and confirmed installments remain unchanged.

**Close** and **Reopen** act on both the vehicle and its plan, removing or regenerating planned occurrences only. A vehicle with confirmed records cannot be permanently deleted: close it to preserve its history. Disabling financing removes an unused plan or closes it while retaining confirmed installments.

**New cost / reading** records fuel, installments, road tax, insurance, tyres, routine maintenance, repairs/extraordinary maintenance, valuations, and other costs. Every cost requires date, description, category, and payment method and is mirrored to Transactions. Fuel entries can also store odometer, distance, litres, and price per litre.

The dashboard shows current-year costs, fuel, and distance. Each vehicle card shows lifetime ownership costs; opening it shows the category breakdown, combinable description/month filters with a filtered total, and yearly comparison. The comparison chart places vehicle names on the horizontal axis and cost per kilometre on the vertical axis, combining detailed current-vehicle records with prior-vehicle actuals.

## 8. Investments and savings

**New investment** supports stocks, funds, savings sheets, ETFs, bonds, and other non-pension savings. Enter type, provider, opening date, optional parent/group, and an optional initial contribution with its affected account. The initial contribution immediately establishes countervalue and creates its linked Transaction. Investments are grouped by customizable type, with a subtotal for each group.

Open an investment for its detail. Movements can be filtered together by description and month, with Contribution and Liquidation subtotals following the visible rows. **New movement** records only **Contribution** or **Liquidation**; **Update value**, also available beside **Edit investment** in the detail dialog, adds a valuation used by dashboards and net worth. Investments and movements can be edited or deleted with confirmation.

The investment card displays its countervalue in red when it is below net invested capital, calculated as confirmed Contributions minus confirmed Liquidations. Valuations and planned operations do not change that comparison capital.

A Contribution/Liquidation requires the affected account and creates exactly one linked cash-outflow/inflow transfer; a Transaction assigned to an investment creates or updates that same movement and account. The rule applies to one-off operations, initial contributions, imports, and recurring plans; confirming a planned occurrence preserves the existing pair without duplicating it. Countervalue starts from contributions, resets at each valuation, and then incorporates later confirmed movements; planned transactions change neither countervalue nor current liquidity. The **Recurring** badge appears only on Transactions explicitly linked to a recurring item. Declaring a periodic contribution requires the account and also creates or updates the Recurring Item and the year’s planned transactions.

When an existing workbook is opened, ContaMì automatically reconciles asset movements that lack a link. It uses only explicit references or exact unique matches, keeps a recoverable backup, and reports ambiguous cases without changing them.

ContaMì is a record-keeping tool. It does not provide financial advice or market prices.

## 9. Private pension

The **Private pension** section is separate from other investments and uses two levels:

- **Create pension** adds the main collector, such as **Fondo Pensione Fideuram**;
- **Create compartment** adds a position associated with an existing pension, such as **Linea Equilibrio**, **Linea Crescita**, or **Linea Valore**.

The pension card totals its active compartments without duplication. Its value turns red when it is below the total net capital invested in active compartments. Each compartment dialog filters movements together by description and month and shows the matching subtotals. One-off and recurring Contributions and Liquidations each keep exactly one linked Transaction with the correct cash effect. Countervalue includes confirmed movements, with each valuation establishing a new reference value; the collector aggregates those compartment series without duplication.

In the workbook, pensions and compartments remain in the `Investments` table, identified by the reserved pension type and parent/child relationship. Existing workbooks therefore remain compatible and readable without a destructive migration.

## 10. Recurring items and installments

**New recurring item** covers subscriptions, services, standalone installments, rental income, and periodic investments. Enter direction, amount, frequency (including monthly or yearly one-off), category, payment method, matching account or cash register, next due date, and optional end date/installments left. A periodic investment can link to an existing investment or pension compartment, and rental income can link to its property. Vehicle financing is created from the **New/Edit vehicle** form instead.

The view shows monthly equivalent, active item count, and known installments left. Hover or keyboard-focus the **Installments left** card to see each plan name, remaining count, and next due date. Filters by name, type, and month update both totals and card details. Editing, deletion, close, and reopen are available; for a vehicle-managed plan, status and deletion remain controlled by its Vehicle card, while schedule editing and **Change rate** remain available.

To change an amount without rewriting history, open **Edit recurring item** and choose **Change rate**. Enter the new amount and effective month: ContaMì normalizes it to the first day of that month and previews how many planned occurrences will change before confirmation. You can add multiple changes and edit or cancel them until they are part of confirmed operations. For example, a synthetic base rate of €50 with a €65 change effective in October remains €50 through September and becomes €65 only for unconfirmed occurrences from October onward. The base amount, confirmed operations, UUIDs, and links remain unchanged; installment plans also retain their remaining count, next due date, and end date. The history is applied deterministically after close/reopen, schedule regeneration, and year rollover.

If an installment plan began before the current workbook, enter the first unpaid installment under **Next due date** and only the payments still due under **Installments left**, not the plan’s original total. For example, for a 12-payment plan started last year with 4 payments still due, enter the actual next due date and `4`.

For non-installment recurring items, ContaMì generates **planned** transactions through the end date or year end. For installment plans, it generates only the remaining number of payments, always within the optional end date. Confirming an installment makes it effective, reduces the remaining count, and automatically closes the recurring item after the final payment while retaining confirmed rows in history. Loading also closes any installment plan that is still active after already reaching zero, removing only its obsolete planned rows. During year rollover, the new workbook keeps the updated balance and regenerates only the installments still due in the new year. The app never executes payments.

## 11. Shared expenses

Create a shared expense in its dedicated view or select **Shared expense** on a Transaction. Both routes maintain one linked pair. The default split is 50/50; the dedicated form can adjust the two shares.

- When you paid, a positive balance is owed to you by the partner.
- When the partner paid, a negative balance is what you owe.
- **Mark settled** closes one balance; **Reopen balance** makes it pending again.
- Combinable description and month filters show subtotals for visible rows only; when a month is selected it can be settled with one action.
- **Print unsettled** prepares a printable list of pending rows for the selected month.
- Editing or deleting updates the linked Transaction automatically.

## 12. Accounts, categories, methods, and taxes

Under **Settings** you can add bank or other accounts; create one or more personal, family, or business cash registers with an optional default funding account; inspect each current balance; and close or reopen them independently. You can also create, edit, and delete bilingual categories with distinct income/expense/both badges; create, edit, and delete payment methods; manage custom investment types; and create or edit property taxes with their scope and number of instalments. A usage counter is shown for catalogs. Referenced taxes can be archived and reopened but can be permanently deleted only when their usage count is zero. Other catalog items already referenced by financial history cannot be deleted, preventing orphaned records.

## 13. Excel templates for previous data

Under **Settings → Data import** you can generate and import eight `.xlsx` templates: residence, rental properties, transactions, investments, pension fund, shared expenses, recurring items, and vehicles.

Each v2 file has one visible `Dati - Data` sheet, stable technical headers, bilingual descriptions, colors distinguishing required, conditional, and optional fields, and up to 5,000 rows. Dates and amounts remain real Excel values. Closed fields provide drop-down lists; when a workbook is open, active categories, methods, accounts, cash registers, investment types, and taxes are embedded with unambiguous UUIDs. Every monetary row identifies its account or cash register; an internal transfer also identifies its destination.

Templates can also be generated without a workbook: available system values are included without temporary UUIDs. During import, a textual reference is accepted only when it exactly and uniquely matches an active workbook item.

To import, first open the destination workbook, choose **Skip**, **Create new copies**, or **Update** for exact matches only, then select **Import completed file**. The preview shows valid and rejected rows, conflicts, planned actions, aggregate amounts, and row/column errors. No data is written until you choose **Confirm import**; closing the preview leaves the workbook unchanged. Confirmation performs one save with external-change detection and a recoverable backup.

Do not rename sheets or headers and do not add formulas, macros, external links, embedded objects, or extra sheets: these are rejected. Correct the file and preview it again when a row reports a missing or ambiguous reference. See [docs/import-template-spec.md](docs/import-template-spec.md) for the contract and [docs/import-guide.md](docs/import-guide.md) for error recovery.

## 14. Language, theme, and preferences

- **Language → Automatic**: Italian only on an Italian system, English otherwise.
- **Theme → Automatic**: follows system theme changes in real time.
- Manual Italian/English and Light/Dark overrides are immediate and persistent.
- User-authored content is never translated.

## 15. Year rollover

1. Ensure another application is not editing the workbook.
2. In **Settings**, select **Close year** and confirm.
3. Choose the next-year file location.
4. Keep and archive the prior file yourself; ContaMì never deletes or moves it.

The new workbook contains categories, methods, investment types, the complete tax catalog including archived taxes needed by history, active accounts and cash registers with closing balance as opening balance and still-valid funding associations, active properties/vehicles/investments, latest property and investment valuations, valid active recurring items with the next applicable due date and their rate histories (including changes effective in the new year), and unsettled shared expenses. A vehicle-financing recurrence is carried only together with its active vehicle. It also carries aggregate yearly history plus detailed annual actuals for each property (income, expenses, value, and utilities), investment/compartment (value, contributions, and withdrawals), and vehicle (cost categories, distance, and consumption).

It does not contain prior-year individual transactions/movements, closed items, or settled shared expenses. The prior workbook remains the detailed source for that year.

## 16. Workbook and backups

Main sheets are `Overview`, `Schema`, `Categories`, `Payment Methods`, `Investment Types`, `Tax Types`, `Accounts`, `Transactions`, `Properties`, `Property Entries`, `Investments`, `Investment Entries`, `Recurring Items`, `Recurring Rate Changes`, `Shared Expenses`, `Vehicles`, `Vehicle Entries`, `Annual Summaries`, `Property History`, `Investment History`, and `Vehicle History`. Hidden `_Meta` stores schema version and active year. The current schema is v9; v1–v8 workbooks migrate on opening. Version 7 stores each cash register’s default funding account, internal-transfer source and destination, and the account/cash-register reference of linked records; version 8 adds `dueDate` to Transactions and Property Entries so due period and actual date remain separate. Migration assigns due dates automatically only to still-planned rows, whose former date is unambiguous; it does not guess the period of confirmed historical receipts. Version 9 adds rate history by recurring-item UUID, amount, and first day of the effective month. Older files receive an empty history and continue to use the existing base amount without changing Transactions or linked records. `Property History` also keeps yearly aggregated Phone/Internet and Condominium costs.

Do not rename sheets or columns if you want ContaMì to reopen the file. You may freely read, copy, and archive it.

Before replacing an existing workbook, ContaMì creates a backup in the adjacent hidden `.contami-backups` folder and retains the latest 10. It first writes and verifies a temporary file, then replaces the active file.

Before ExcelJS reads any contents, ContaMì checks the ZIP structure without decompressing entries. A workbook may contain at most 4,096 entries, 256 MiB in total and 128 MiB per uncompressed entry, with a maximum 200:1 ratio; the central directory, names, and metadata have separate limits. Anomalous or duplicate paths, nested archives, encryption, ZIP64, macros, ActiveX, embedded objects, and external links are rejected. These checks do not replace the subsequent full schema and domain-data validation.

If a manual edit creates duplicate UUIDs in workbook tables, ContaMì keeps the first occurrence and assigns new UUIDs to later occurrences when the file is reopened. No row or financial information is deleted, and unambiguous links are realigned. The repair changes only the required cells, is verified before replacement, and preserves the previous version in `.contami-backups`. The app displays a notice after performing this repair.

## 17. Troubleshooting

### The configured file was moved or deleted

ContaMì still opens and returns to the **Not configured** state without creating a replacement automatically. Use **Open existing workbook** to select its new location or **Create new workbook**. The stale path is removed from preferences; existing backups are not deleted.

### “Another app changed the workbook”

Close Excel/Numbers and use **Open existing workbook** to reload the on-disk version. ContaMì blocks the save instead of overwriting external changes.

### Numbers mirror is not updating

The `.xlsx` sidecar is already safe. Close Numbers windows and confirm Numbers is installed, including as `/Applications/Numbers Creator Studio.app`; ContaMì identifies it through Apple bundle id `com.apple.Numbers`. Retry without deleting the sidecar.

### Invalid or oversized file

ContaMì accepts only ContaMì-schema `.xlsx` files up to 250 MiB compressed and within the ZIP limits above. If structural, expansion, or schema validation fails, the file is not modified: preserve a copy and restore the latest valid backup or choose the correct file.

### Preferences reset to Automatic

The local settings file may be missing or invalid. Financial data remains in the workbook; reopen it and choose preferences again.

### Unexpected dashboard value

Check transaction account links, recent valuations, active/closed state, workbook year, and consistent currency usage.

## 18. Security and limitations

- Protect workbooks with operating-system permissions, FileVault/BitLocker, and encrypted backups when appropriate.
- ContaMì does not encrypt workbooks or manage spreadsheet passwords.
- Do not place sensitive workbooks in cloud-synced folders unless you accept that provider’s terms.
- Unsigned builds can trigger operating-system warnings.
- Native Numbers mirroring depends on Apple automation and may require macOS consent.

See [SECURITY_MODEL.md](SECURITY_MODEL.md) for technical controls and residual risks.

## 19. Updates and removal

Close ContaMì and keep a workbook copy before updating, then install the new release over the old one.

To remove the app on macOS, close ContaMì and move `Contami` from **Applications** to the Trash. On Windows open **Settings → Apps → Installed apps**, find `Contami`, and choose **Uninstall**. Removing the app does not delete user-selected workbooks or `.contami-backups`; they stay in their folders and should be removed only manually after reviewing their contents.
