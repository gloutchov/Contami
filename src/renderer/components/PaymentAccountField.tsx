import { useEffect, useMemo } from "react";
import { accountsForPaymentMethod } from "../../domain/accounts";
import type { FinanceData } from "../../domain/models";
import { useI18n } from "../i18n/I18nContext";
import { Field } from "./Modal";

export function PaymentAccountField({ data, paymentMethodId, date, currency = "EUR", value, onChange }: {
  data: FinanceData;
  paymentMethodId: string;
  date: string;
  currency?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const options = useMemo(
    () => accountsForPaymentMethod(data, paymentMethodId, date, value).filter((item) => item.currency === currency),
    [currency, data, paymentMethodId, date, value],
  );
  const cashPayment = data.paymentMethods.find((item) => item.id === paymentMethodId)?.kind === "cash";

  useEffect(() => {
    if (options.some((item) => item.id === value)) return;
    onChange(options.length === 1 ? options[0].id : "");
  }, [onChange, options, value]);

  return <Field label={cashPayment ? t("cashRegister") : t("account")}>
    <select required value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">—</option>
      {options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select>
  </Field>;
}
