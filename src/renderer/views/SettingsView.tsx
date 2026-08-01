import { FileSpreadsheet, FolderOpen, Pencil, Plus, ReceiptText, RotateCcw, Tags, Trash2, Upload, WalletCards } from "lucide-react";
import { useState } from "react";
import { accountBalance } from "../../domain/accounts";
import { catalogUsageCount } from "../../domain/catalogUsage";
import type { FinanceCommand } from "../../domain/commands";
import type { ImportTemplateType } from "../../domain/importTemplates";
import type { ImportDuplicateStrategy, ImportPreview } from "../../domain/imports";
import type { Category, InvestmentType, PaymentMethod, TaxType } from "../../domain/models";
import type { AppSettings, FinanceSnapshot, SystemCapabilities } from "../../shared/contracts";
import { PageHeader } from "../components/PageHeader";
import { ImportPreviewDialog } from "../components/ImportPreviewDialog";
import { AccountForm, CashRegisterForm } from "../forms/AccountForm";
import { CategoryForm, InvestmentTypeForm, PaymentMethodForm, TaxTypeForm } from "../forms/CatalogForms";
import { useI18n } from "../i18n/I18nContext";
import { todayIso } from "../utils/format";
import { runUiAction } from "../utils/save";

const importTemplateActions: Array<{ type: ImportTemplateType; label: "templateResidence" | "templateRentalProperties" | "templateTransactions" | "templateInvestments" | "templatePension" | "templateSharedExpenses" | "templateRecurringItems" | "templateVehicles" }> = [
  { type: "residence", label: "templateResidence" },
  { type: "rental_properties", label: "templateRentalProperties" },
  { type: "transactions", label: "templateTransactions" },
  { type: "investments", label: "templateInvestments" },
  { type: "pension", label: "templatePension" },
  { type: "shared_expenses", label: "templateSharedExpenses" },
  { type: "recurring_items", label: "templateRecurringItems" },
  { type: "vehicles", label: "templateVehicles" },
];

export function SettingsView({ settings, capabilities, snapshot, onUpdate, onCreate, onOpen, onReveal, onRollover, onGenerateImportTemplate, onPreviewImport, onConfirmImport, onDiscardImport, onSave }: {
  settings: AppSettings; capabilities: SystemCapabilities; snapshot: FinanceSnapshot;
  onUpdate: (patch: Pick<Partial<AppSettings>, "language" | "theme" | "workbookFormat">) => Promise<void>;
  onCreate: () => Promise<void>; onOpen: () => Promise<void>; onReveal: () => Promise<void>; onRollover: () => Promise<void>;
  onGenerateImportTemplate: (type: ImportTemplateType) => Promise<void>;
  onPreviewImport: (strategy: ImportDuplicateStrategy) => Promise<ImportPreview>;
  onConfirmImport: (previewId: string) => Promise<void>;
  onDiscardImport: (previewId: string) => Promise<void>;
  onSave: (command: FinanceCommand) => Promise<void>;
}) {
  const { t, language } = useI18n();
  const [accountOpen, setAccountOpen] = useState(false);
  const [cashRegisterOpen, setCashRegisterOpen] = useState(false);
  const [category, setCategory] = useState<Category | null | undefined>();
  const [payment, setPayment] = useState<PaymentMethod | null | undefined>();
  const [investmentType, setInvestmentType] = useState<InvestmentType | null | undefined>();
  const [taxType, setTaxType] = useState<TaxType | null | undefined>();
  const [duplicateStrategy, setDuplicateStrategy] = useState<ImportDuplicateStrategy>("skip");
  const [importPreview, setImportPreview] = useState<ImportPreview>();
  const startImport = () => runUiAction(async () => {
    const result = await onPreviewImport(duplicateStrategy);
    if (!result.canceled) setImportPreview(result);
  });
  const closeImportPreview = () => {
    const previewId = importPreview?.previewId;
    setImportPreview(undefined);
    if (previewId) void onDiscardImport(previewId);
  };
  const confirmImport = async () => {
    const previewId = importPreview?.previewId;
    if (!previewId) return;
    await onConfirmImport(previewId);
    setImportPreview(undefined);
  };
  const remove = (entity: "category" | "paymentMethod" | "investmentType" | "taxType", id: string) => {
    if (window.confirm(t("deleteConfirm"))) runUiAction(() => onSave({ type: "deleteEntity", entity, id }));
  };
  const categoryGroups = (["expense", "income", "both"] as const).map((kind) => ({ kind, items: snapshot.data.categories.filter((item) => item.kind === kind) }));
  const accounts = snapshot.data.accounts.filter((item) => item.kind !== "cash");
  const cashRegisters = snapshot.data.accounts.filter((item) => item.kind === "cash");
  const accountRow = (item: typeof snapshot.data.accounts[number]) => <div className="catalog-row" key={item.id}><span><strong>{item.name}</strong><small>{t(item.kind === "digital_wallet" ? "digitalWallet" : item.kind)} · {t("balance")}: {new Intl.NumberFormat(language === "it" ? "it-IT" : "en-GB", { style: "currency", currency: item.currency }).format(accountBalance(snapshot.data, item.id, todayIso()))}</small>{item.kind === "cash" && item.defaultFundingAccountId && <small>{t("defaultFundingAccount")}: {snapshot.data.accounts.find((candidate) => candidate.id === item.defaultFundingAccountId)?.name ?? "—"}</small>}</span><button className="text-button" onClick={() => runUiAction(() => onSave({ type: "setActive", entity: "account", id: item.id, active: !item.active, closedAt: item.active ? todayIso() : undefined }))}>{item.active ? t("close") : t("reopen")}</button></div>;
  return <><PageHeader title={t("settings")} subtitle={t("privacyBody")} />
    <section className="settings-grid">
      <article className="panel settings-card"><h2>{t("language")}</h2><p>{t("languageHelp")}</p><div className="segmented">{(["system", "it", "en"] as const).map((value) => <button key={value} className={settings.language === value ? "selected" : ""} onClick={() => runUiAction(() => onUpdate({ language: value }))}>{value === "system" ? t("automatic") : value === "it" ? t("italian") : t("english")}</button>)}</div></article>
      <article className="panel settings-card"><h2>{t("theme")}</h2><p>{t("themeHelp")}</p><div className="segmented">{(["system", "light", "dark"] as const).map((value) => <button key={value} className={settings.theme === value ? "selected" : ""} onClick={() => runUiAction(() => onUpdate({ theme: value }))}>{value === "system" ? t("automatic") : t(value)}</button>)}</div></article>
      <article className="panel settings-card wide"><h2>{t("spreadsheetFormat")}</h2><p>{t("spreadsheetHelp")}</p><div className="segmented"><button className={settings.workbookFormat === "excel" ? "selected" : ""} onClick={() => runUiAction(() => onUpdate({ workbookFormat: "excel" }))}>{t("excel")}</button><button disabled={!capabilities.numbersAvailable} className={settings.workbookFormat === "numbers" ? "selected" : ""} onClick={() => runUiAction(() => onUpdate({ workbookFormat: "numbers" }))}>{t("numbers")}</button></div>{!capabilities.numbersAvailable && <p className="inline-help">{t("numbersUnavailable")}</p>}</article>
      <article className="panel settings-card wide"><h2>{t("dataFile")}</h2><p>{t("setupBody")}</p><div className="file-row"><div className="file-name">{snapshot.workbookDisplayName ?? t("notConfigured")}</div><button className="secondary-button" onClick={() => runUiAction(onOpen)}><FolderOpen size={16}/>{t("openWorkbook")}</button><button className="primary-button" onClick={() => runUiAction(onCreate)}><Plus size={16}/>{t("createWorkbook")}</button>{snapshot.workbookConfigured && <button className="text-button" onClick={() => runUiAction(onReveal)}>{t("showInFolder")}</button>}</div></article>
      <article className="panel settings-card wide"><h2>{t("account")}</h2><p>{t("accountsHelp")}</p><div className="catalog-list">{accounts.map(accountRow)}</div><button className="secondary-button" onClick={() => setAccountOpen(true)}><Plus size={16}/>{t("newAccount")}</button></article>
      <article className="panel settings-card wide"><h2>{t("cashRegisters")}</h2><p>{t("cashRegistersHelp")}</p><div className="catalog-list">{cashRegisters.map(accountRow)}</div><button className="secondary-button" onClick={() => setCashRegisterOpen(true)}><Plus size={16}/>{t("newCashRegister")}</button></article>
      <article className="panel settings-card wide"><h2>{t("categoriesAndPayments")}</h2><p>{t("categoriesAndPaymentsHelp")}</p><div className="catalog-columns">
        <div><h3><Tags size={15}/>{t("category")}</h3>{categoryGroups.map((group) => <section className="catalog-group" key={group.kind}><h4><span className={`pill kind-${group.kind}`}>{t(group.kind)}</span></h4>{group.items.map((item) => { const usage = catalogUsageCount(snapshot.data, "category", item.id); return <div className="catalog-item" key={item.id}><span>{language === "it" ? item.nameIt : item.nameEn}</span><div><span className="usage-badge" title={t("usageCount", { count: usage })} aria-label={t("usageCount", { count: usage })}>{usage}</span><button className="icon-button" aria-label={t("edit")} onClick={() => setCategory(item)}><Pencil size={15}/></button><button className="icon-button danger" aria-label={t("delete")} onClick={() => remove("category", item.id)}><Trash2 size={15}/></button></div></div>; })}</section>)}<button className="secondary-button" onClick={() => setCategory(null)}><Plus size={16}/>{t("newCategory")}</button></div>
        <div><h3><WalletCards size={15}/>{t("paymentMethod")}</h3><div className="catalog-list">{snapshot.data.paymentMethods.map((item) => { const usage = catalogUsageCount(snapshot.data, "paymentMethod", item.id); return <div className="catalog-item" key={item.id}><span><strong>{item.name}</strong><small>{t(item.kind === "bank_transfer" ? "bankTransfer" : item.kind === "direct_debit" ? "directDebit" : item.kind === "digital_wallet" ? "digitalWallet" : item.kind)}</small></span><div><span className="usage-badge" title={t("usageCount", { count: usage })} aria-label={t("usageCount", { count: usage })}>{usage}</span><button className="icon-button" aria-label={t("edit")} onClick={() => setPayment(item)}><Pencil size={15}/></button><button className="icon-button danger" aria-label={t("delete")} onClick={() => remove("paymentMethod", item.id)}><Trash2 size={15}/></button></div></div>; })}</div><button className="secondary-button" onClick={() => setPayment(null)}><Plus size={16}/>{t("newPaymentMethod")}</button></div>
      </div></article>
      <article className="panel settings-card wide"><h2>{t("investmentTypes")}</h2><p>{t("investmentTypesHelp")}</p><div className="catalog-list compact">{snapshot.data.investmentTypes.filter((item) => item.code !== "pension").map((item) => <div className="catalog-item" key={item.id}><span><strong>{language === "it" ? item.nameIt : item.nameEn}</strong><small>{item.code}</small></span><div><button className="icon-button" aria-label={t("edit")} onClick={() => setInvestmentType(item)}><Pencil size={15}/></button><button className="icon-button danger" aria-label={t("delete")} onClick={() => remove("investmentType", item.id)}><Trash2 size={15}/></button></div></div>)}</div><button className="secondary-button" onClick={() => setInvestmentType(null)}><Plus size={16}/>{t("newInvestmentType")}</button></article>
      <article className="panel settings-card wide"><h2>{t("taxTypes")}</h2><p>{t("taxTypesHelp")}</p><div className="catalog-list compact">{snapshot.data.taxTypes.map((item) => { const usage = catalogUsageCount(snapshot.data, "taxType", item.id); return <div className="catalog-item" key={item.id}><span><strong>{item.name}</strong><small><ReceiptText size={14}/>{t(item.appliesTo === "all" ? "allProperties" : item.appliesTo)} · {t("taxInstallments", { count: item.installments })}{!item.active && ` · ${t("archived")}`}</small></span><div><span className="usage-badge" title={t("usageCount", { count: usage })} aria-label={t("usageCount", { count: usage })}>{usage}</span><button className="text-button" onClick={() => runUiAction(() => onSave({ type: "setActive", entity: "taxType", id: item.id, active: !item.active }))}>{item.active ? t("archive") : t("reopen")}</button><button className="icon-button" aria-label={t("edit")} onClick={() => setTaxType(item)}><Pencil size={15}/></button><button className="icon-button danger" aria-label={t("delete")} disabled={usage > 0} title={usage > 0 ? t("entityInUse") : undefined} onClick={() => remove("taxType", item.id)}><Trash2 size={15}/></button></div></div>; })}</div><button className="secondary-button" onClick={() => setTaxType(null)}><Plus size={16}/>{t("newTaxType")}</button></article>
      <article className="panel settings-card wide"><h2>{t("importTemplates")}</h2><p>{t("importTemplatesHelp")}</p>{!snapshot.workbookConfigured && <p className="inline-help">{t("importTemplatesNoWorkbook")}</p>}<div className="import-controls"><label className="import-strategy-control"><span>{t("importDuplicateStrategy")}</span><select value={duplicateStrategy} onChange={(event) => setDuplicateStrategy(event.target.value as ImportDuplicateStrategy)}><option value="skip">{t("importStrategySkip")}</option><option value="create">{t("importStrategyCreate")}</option><option value="update">{t("importStrategyUpdate")}</option></select></label><button className="primary-button" disabled={!snapshot.workbookConfigured} onClick={startImport}><Upload size={17}/>{t("importCompletedFile")}</button><small className="import-strategy-help">{t("importDuplicateStrategyHelp")}</small></div><h3 className="template-heading">{t("generateTemplates")}</h3><div className="template-grid">{importTemplateActions.map((item) => <button className="secondary-button" key={item.type} onClick={() => runUiAction(() => onGenerateImportTemplate(item.type))}><FileSpreadsheet size={17}/><span>{t(item.label)}</span></button>)}</div></article>
      <article className="panel settings-card wide"><h2>{t("rollover")}</h2><p>{t("rolloverHelp")}</p><button className="secondary-button" disabled={!snapshot.workbookConfigured} onClick={() => runUiAction(onRollover)}><RotateCcw size={16}/>{t("rollover")}</button></article>
    </section>
    {accountOpen && <AccountForm onClose={() => setAccountOpen(false)} onSave={onSave} />}
    {cashRegisterOpen && <CashRegisterForm data={snapshot.data} onClose={() => setCashRegisterOpen(false)} onSave={onSave} />}
    {category !== undefined && <CategoryForm value={category ?? undefined} onClose={() => setCategory(undefined)} onSave={onSave} />}
    {payment !== undefined && <PaymentMethodForm value={payment ?? undefined} onClose={() => setPayment(undefined)} onSave={onSave} />}
    {investmentType !== undefined && <InvestmentTypeForm value={investmentType ?? undefined} onClose={() => setInvestmentType(undefined)} onSave={onSave} />}
    {taxType !== undefined && <TaxTypeForm value={taxType ?? undefined} onClose={() => setTaxType(undefined)} onSave={onSave} />}
    {importPreview && <ImportPreviewDialog preview={importPreview} onClose={closeImportPreview} onConfirm={confirmImport} />}
  </>;
}
