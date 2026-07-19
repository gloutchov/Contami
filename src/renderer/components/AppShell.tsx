import {
  ArrowLeftRight, Building2, CalendarClock, CarFront, ChartNoAxesCombined, HandCoins, Landmark,
  LoaderCircle, Settings, ShieldCheck, UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import icon from "../../../assets/icon.png";
import { useI18n } from "../i18n/I18nContext";

export type AppView = "overview" | "transactions" | "properties" | "vehicles" | "investments" | "pensions" | "recurring" | "shared" | "settings";

const navigation: Array<{ view: AppView; icon: typeof Landmark; label: "overview" | "transactions" | "properties" | "vehicles" | "investments" | "pension" | "recurring" | "shared" | "settings" }> = [
  { view: "overview", icon: ChartNoAxesCombined, label: "overview" },
  { view: "transactions", icon: ArrowLeftRight, label: "transactions" },
  { view: "properties", icon: Building2, label: "properties" },
  { view: "vehicles", icon: CarFront, label: "vehicles" },
  { view: "investments", icon: Landmark, label: "investments" },
  { view: "pensions", icon: ShieldCheck, label: "pension" },
  { view: "recurring", icon: CalendarClock, label: "recurring" },
  { view: "shared", icon: UsersRound, label: "shared" },
  { view: "settings", icon: Settings, label: "settings" },
];

export function AppShell({ view, onNavigate, workbookName, busy, children }: {
  view: AppView;
  onNavigate: (view: AppView) => void;
  workbookName?: string;
  busy: boolean;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => onNavigate("overview")} aria-label={t("overview")}>
          <span className="brand-icon"><img src={icon} alt="" /></span>
          <span className="brand-word">Conta<strong>Mì</strong></span>
        </button>
        <nav aria-label="Main navigation">
          {navigation.map(({ view: itemView, icon: Icon, label }) => (
            <button
              key={itemView}
              className={view === itemView ? "nav-item active" : "nav-item"}
              onClick={() => onNavigate(itemView)}
              aria-current={view === itemView ? "page" : undefined}
            >
              <Icon size={19} strokeWidth={1.9} />
              <span>{t(label)}</span>
            </button>
          ))}
        </nav>
        <div className="privacy-chip">
          <HandCoins size={18} />
          <div><strong>{t("privacyTitle")}</strong><span>{t("privacyBody")}</span></div>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div className="workbook-status">
            <span className={workbookName ? "status-dot connected" : "status-dot"} />
            <span>{workbookName ?? t("notConfigured")}</span>
          </div>
          {busy && <span className="saving-indicator"><LoaderCircle className="spin" size={16} />{t("saving")}</span>}
        </header>
        <main>{children}</main>
      </section>
    </div>
  );
}
