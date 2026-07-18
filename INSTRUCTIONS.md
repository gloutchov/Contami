# ContaMì — User manual

## 1. What ContaMì is

ContaMì organizes detailed personal finances through a simple interface while keeping the data in a spreadsheet that remains readable without the app. It covers transactions, accounts, properties and consumption, investments and savings, recurring/installment payments, shared expenses, and yearly summaries.

The app is local-first: it requires no account, uses no cloud service, and sends no telemetry.

## 2. Requirements and installation

- 64-bit macOS or Windows;
- enough space for the app, workbook, and backups;
- Apple Numbers only if you want a native `.numbers` mirror;
- Excel is not required: ContaMì reads and writes `.xlsx` directly.

Early builds are unsigned. Always verify the SHA-256 checksum shipped with the release. macOS Gatekeeper or Windows SmartScreen may warn: proceed only when the file comes from the official private release.

## 3. First launch

1. Launch ContaMì: it uses Italian when the system language is Italian, otherwise English.
2. Light/dark mode follows the system.
3. From Overview choose **Create new workbook** or **Open existing workbook**.
4. Under **Settings → Account**, add the bank, cash, or other accounts that contribute to liquidity.
5. Review the default categories and payment methods; add your own if needed.

### Excel or Numbers

- **Excel (.xlsx)**: recommended and portable across macOS and Windows.
- **Numbers (.numbers)**: macOS only and requires Numbers. ContaMì also keeps a `.contami.xlsx` file beside the Numbers copy; do not delete it, because it is the interoperable copy used by the app.

The format preference applies to the next workbook you create. Opening an existing `.xlsx` makes that file active.

## 4. Overview

The home page shows:

- net worth: liquidity + active property value + active investment value;
- liquidity: account opening balances plus linked income less linked expenses;
- property value: latest valuation, or purchase price, multiplied by ownership share;
- investment value: latest valuation for each active investment;
- current-year income and expenses;
- monthly equivalent of active recurring commitments;
- outstanding shared balance;
- monthly trend, spending categories, and recent transactions.

Transfers do not count as income or expense. Currency is recorded, but the initial version does not convert currencies automatically; avoid combining currencies in one overview without a consistent manual conversion.

## 5. Transactions

Choose **New transaction** and enter:

- income, expense, or transfer;
- date and description;
- category and payment method;
- optional account;
- amount, EUR currency, and optional notes.

The top summary shows yearly income, expenses, and net cash flow. Search filters descriptions; the adjacent menu filters transaction type.

## 6. Properties

Use **New property** for the name, type, ownership share, purchase date/price, and notes.

Use **New entry** for income, expense, valuation, or consumption. Consumption accepts a quantity and unit such as kWh or m³, plus an optional monetary cost. The view summarizes current value and yearly income/costs. **Close** removes a property from active totals without deleting history; **Reopen** activates it again.

## 7. Investments and savings

**New investment** supports funds, stocks, bonds, ETFs, private pensions, savings, and other forms. Enter provider and opening date.

**New movement** records a contribution, withdrawal, valuation, income, or fee. The latest valuation feeds the dashboard and net worth. The view summarizes value and yearly contributions/withdrawals. Use **Close/Reopen** without losing history.

ContaMì is a record-keeping tool. It does not provide financial advice or market prices.

## 8. Recurring items and installments

**New recurring item** covers subscriptions, services, installments, and recurring investments. Enter amount, frequency, category, payment method, next due date, and optional end date/installments left.

The view shows monthly equivalent, active item count, and known installments left. Use **Close** when an item ends and **Reopen** if it resumes.

The initial version tracks due dates but does not create transactions automatically or execute payments.

## 9. Shared expenses

Enter date, description, total, category, method, payer, and the two shares. Shares must equal the total within one cent.

- When you paid, a positive balance is owed to you by the partner.
- When the partner paid, a negative balance is what you owe.
- **Mark settled** closes the balance; **Reopen balance** makes it pending again.

## 10. Accounts, categories, and methods

Under **Settings** you can add accounts with type, opening balance, and opening date; close/reopen accounts; add bilingual categories with income/expense/both classification; and add payment methods. Categories and methods already referenced by history are not removed.

## 11. Language, theme, and preferences

- **Language → Automatic**: Italian only on an Italian system, English otherwise.
- **Theme → Automatic**: follows system theme changes in real time.
- Manual Italian/English and Light/Dark overrides are immediate and persistent.
- User-authored content is never translated.

## 12. Year rollover

1. Ensure another application is not editing the workbook.
2. In **Settings**, select **Close year** and confirm.
3. Choose the next-year file location.
4. Keep and archive the prior file yourself; ContaMì never deletes or moves it.

The new workbook contains categories and methods, active accounts with closing balance as opening balance, active properties/investments with latest valuation carried to January 1, valid active recurring items with the next applicable due date, unsettled shared expenses, and aggregated annual history.

It does not contain prior-year individual transactions/movements, closed items, or settled shared expenses. The prior workbook remains the detailed source for that year.

## 13. Workbook and backups

Main sheets are `Overview`, `Schema`, `Categories`, `Payment Methods`, `Accounts`, `Transactions`, `Properties`, `Property Entries`, `Investments`, `Investment Entries`, `Recurring Items`, `Shared Expenses`, and `Annual Summaries`. Hidden `_Meta` stores schema version and active year.

Do not rename sheets or columns if you want ContaMì to reopen the file. You may freely read, copy, and archive it.

Before replacing an existing workbook, ContaMì creates a backup in the adjacent hidden `.contami-backups` folder and retains the latest 10. It first writes and verifies a temporary file, then replaces the active file.

## 14. Troubleshooting

### “Another app changed the workbook”

Close Excel/Numbers and use **Open existing workbook** to reload the on-disk version. ContaMì blocks the save instead of overwriting external changes.

### Numbers mirror is not updating

The `.xlsx` sidecar is already safe. Close Numbers windows, confirm `/Applications/Numbers.app` exists, and retry. Do not delete the sidecar.

### Invalid or oversized file

ContaMì accepts only ContaMì-schema `.xlsx` files up to 250 MB. Restore a backup or choose the correct file.

### Preferences reset to Automatic

The local settings file may be missing or invalid. Financial data remains in the workbook; reopen it and choose preferences again.

### Unexpected dashboard value

Check transaction account links, recent valuations, active/closed state, workbook year, and consistent currency usage.

## 15. Security and limitations

- Protect workbooks with operating-system permissions, FileVault/BitLocker, and encrypted backups when appropriate.
- ContaMì does not encrypt workbooks or manage spreadsheet passwords.
- Do not place sensitive workbooks in cloud-synced folders unless you accept that provider’s terms.
- Unsigned builds can trigger operating-system warnings.
- Native Numbers mirroring depends on Apple automation and may require macOS consent.

See [SECURITY_MODEL.md](SECURITY_MODEL.md) for technical controls and residual risks.

## 16. Updates and removal

Close ContaMì and keep a workbook copy before updating, then install the new release over the old one. Use the operating system’s standard process to remove the app. User-selected workbooks and backups remain in their folders and are removed only manually.
