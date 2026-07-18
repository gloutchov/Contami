import { FolderOpen, Plus, RotateCcw, Tags, WalletCards } from "lucide-react";
import { useState } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { AppSettings, FinanceSnapshot, SystemCapabilities } from "../../shared/contracts";
import { PageHeader } from "../components/PageHeader";
import { AccountForm } from "../forms/AccountForm";
import { CategoryForm, PaymentMethodForm } from "../forms/CatalogForms";
import { useI18n } from "../i18n/I18nContext";
import { todayIso } from "../utils/format";
import { runUiAction } from "../utils/save";

export function SettingsView({ settings, capabilities, snapshot, onUpdate, onCreate, onOpen, onReveal, onRollover, onSave }: {
  settings: AppSettings;
  capabilities: SystemCapabilities;
  snapshot: FinanceSnapshot;
  onUpdate: (patch: Pick<Partial<AppSettings>, "language" | "theme" | "workbookFormat">) => Promise<void>;
  onCreate: () => Promise<void>;
  onOpen: () => Promise<void>;
  onReveal: () => Promise<void>;
  onRollover: () => Promise<void>;
  onSave: (command: FinanceCommand) => Promise<void>;
}) {
  const { t, language } = useI18n();
  const [accountOpen, setAccountOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  return <><PageHeader title={t("settings")} subtitle={t("privacyBody")} />
    <section className="settings-grid">
      <article className="panel settings-card"><h2>{t("language")}</h2><p>{t("languageHelp")}</p><div className="segmented">{(["system", "it", "en"] as const).map((value) => <button key={value} className={settings.language === value ? "selected" : ""} onClick={() => runUiAction(() => onUpdate({ language: value }))}>{value === "system" ? t("automatic") : value === "it" ? t("italian") : t("english")}</button>)}</div></article>
      <article className="panel settings-card"><h2>{t("theme")}</h2><p>{t("themeHelp")}</p><div className="segmented">{(["system", "light", "dark"] as const).map((value) => <button key={value} className={settings.theme === value ? "selected" : ""} onClick={() => runUiAction(() => onUpdate({ theme: value }))}>{value === "system" ? t("automatic") : t(value)}</button>)}</div></article>
      <article className="panel settings-card wide"><h2>{t("spreadsheetFormat")}</h2><p>{t("spreadsheetHelp")}</p><div className="segmented"><button className={settings.workbookFormat === "excel" ? "selected" : ""} onClick={() => runUiAction(() => onUpdate({ workbookFormat: "excel" }))}>{t("excel")}</button><button disabled={!capabilities.numbersAvailable} className={settings.workbookFormat === "numbers" ? "selected" : ""} onClick={() => runUiAction(() => onUpdate({ workbookFormat: "numbers" }))}>{t("numbers")}</button></div>{!capabilities.numbersAvailable && <p style={{ marginTop: 12 }}>{t("numbersUnavailable")}</p>}</article>
      <article className="panel settings-card wide"><h2>{t("dataFile")}</h2><p>{t("setupBody")}</p><div className="file-row"><div className="file-name">{snapshot.workbookDisplayName ?? t("notConfigured")}</div><button className="secondary-button" onClick={() => runUiAction(onOpen)}><FolderOpen size={16}/>{t("openWorkbook")}</button><button className="primary-button" onClick={() => runUiAction(onCreate)}><Plus size={16}/>{t("createWorkbook")}</button>{snapshot.workbookConfigured && <button className="text-button" onClick={() => runUiAction(onReveal)}>{t("showInFolder")}</button>}</div></article>
      <article className="panel settings-card wide"><h2>{t("account")}</h2><p>{t("accountsHelp")}</p><div className="catalog-list">{snapshot.data.accounts.map((item) => <div className="catalog-row" key={item.id}><span><strong>{item.name}</strong><small>{t(item.kind === "digital_wallet" ? "digitalWallet" : item.kind)}</small></span><button className="text-button" onClick={() => runUiAction(() => onSave({ type: "setActive", entity: "account", id: item.id, active: !item.active, closedAt: item.active ? todayIso() : undefined }))}>{item.active ? t("close") : t("reopen")}</button></div>)}</div><button className="secondary-button" onClick={() => setAccountOpen(true)}><Plus size={16}/>{t("newAccount")}</button></article>
      <article className="panel settings-card wide"><h2>{t("categoriesAndPayments")}</h2><p>{t("categoriesAndPaymentsHelp")}</p><div className="catalog-columns"><div><h3><Tags size={15}/>{t("category")}</h3><div className="chip-list">{snapshot.data.categories.filter((item) => item.active).map((item) => <span className="pill" key={item.id}>{language === "it" ? item.nameIt : item.nameEn}</span>)}</div><button className="secondary-button" onClick={() => setCategoryOpen(true)}><Plus size={16}/>{t("newCategory")}</button></div><div><h3><WalletCards size={15}/>{t("paymentMethod")}</h3><div className="chip-list">{snapshot.data.paymentMethods.filter((item) => item.active).map((item) => <span className="pill" key={item.id}>{item.name}</span>)}</div><button className="secondary-button" onClick={() => setPaymentOpen(true)}><Plus size={16}/>{t("newPaymentMethod")}</button></div></div></article>
      <article className="panel settings-card wide"><h2>{t("rollover")}</h2><p>{t("rolloverHelp")}</p><button className="secondary-button" disabled={!snapshot.workbookConfigured} onClick={() => runUiAction(onRollover)}><RotateCcw size={16}/>{t("rollover")}</button></article>
    </section>
    {accountOpen && <AccountForm onClose={() => setAccountOpen(false)} onSave={onSave} />}
    {categoryOpen && <CategoryForm onClose={() => setCategoryOpen(false)} onSave={onSave} />}
    {paymentOpen && <PaymentMethodForm onClose={() => setPaymentOpen(false)} onSave={onSave} />}
  </>;
}
