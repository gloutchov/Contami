import { useState, type FormEvent } from "react";
import type { Property } from "../../domain/models";
import type { PropertyReportRequest, PropertyReportResult } from "../../shared/propertyReportContracts";
import { useI18n } from "../i18n/I18nContext";
import { Field, Modal } from "./Modal";

export function PropertyReportDialog({
  property,
  onClose,
  onGenerate,
}: {
  property: Property;
  onClose: () => void;
  onGenerate: (request: PropertyReportRequest) => Promise<PropertyReportResult>;
}) {
  const { t, language } = useI18n();
  const [scope, setScope] = useState<PropertyReportRequest["scope"]>("current-year");
  const [ownerName, setOwnerName] = useState(() => t("you"));
  const [coOwnerName, setCoOwnerName] = useState(() => t("partner"));
  const [pending, setPending] = useState(false);
  const valid = ownerName.trim().length > 0 && ownerName.trim().length <= 120
    && coOwnerName.trim().length > 0 && coOwnerName.trim().length <= 120;

  const generate = async (action: PropertyReportRequest["action"]) => {
    if (!valid || pending) return;
    setPending(true);
    let result: PropertyReportResult;
    try {
      result = await onGenerate({
        propertyId: property.id,
        scope,
        language,
        action,
        ownerName: ownerName.trim(),
        coOwnerName: coOwnerName.trim(),
      });
    } finally {
      setPending(false);
    }
    if (!result.canceled) onClose();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void generate("save-pdf").catch(() => undefined);
  };

  return <Modal
    title={`${t("propertyReport")} · ${property.name}`}
    onClose={onClose}
    onSubmit={submit}
    submitDisabled={!valid || pending}
    submitLabel={t("propertyReportSavePdf")}
    secondaryActionLabel={t("propertyReportPrint")}
    onSecondaryAction={() => { void generate("print").catch(() => undefined); }}
  >
    <p className="modal-intro">{t("propertyReportDescription")}</p>
    <Field label={t("propertyReportScope")} wide>
      <select value={scope} onChange={(event) => setScope(event.target.value as PropertyReportRequest["scope"])} disabled={pending}>
        <option value="current-year">{t("propertyReportCurrentYear")}</option>
        <option value="lifetime">{t("propertyReportLifetime")}</option>
      </select>
    </Field>
    <Field label={t("propertyReportOwnerName")}>
      <input required maxLength={120} value={ownerName} onChange={(event) => setOwnerName(event.target.value)} disabled={pending} />
    </Field>
    <Field label={t("propertyReportCoOwnerName")}>
      <input required maxLength={120} value={coOwnerName} onChange={(event) => setCoOwnerName(event.target.value)} disabled={pending} />
    </Field>
    <p className="modal-help">{t("propertyReportOwnerNamesHelp")}</p>
    {pending && <p className="modal-status" role="status">{t("propertyReportGenerating")}</p>}
  </Modal>;
}
