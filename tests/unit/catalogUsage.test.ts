import { describe, expect, it } from "vitest";
import { catalogUsageCount } from "../../src/domain/catalogUsage";
import { createEmptyFinanceData } from "../../src/domain/finance";

describe("catalog usage", () => {
  it("counts direct and periodic references across every supported area", () => {
    const data = createEmptyFinanceData(2026);
    const categoryId = data.categories[0].id;
    const paymentMethodId = data.paymentMethods[0].id;
    const investmentId = crypto.randomUUID();
    data.investments.push({
      id: investmentId, name: "Synthetic plan", kind: "fund", typeId: data.investmentTypes[1].id,
      provider: "", currency: "EUR", periodicAmount: 10, periodicFrequency: "monthly",
      periodicNextDueDate: "2026-08-01", periodicCategoryId: categoryId, periodicPaymentMethodId: paymentMethodId,
      active: true, openedAt: "2026-01-01", notes: "",
    });
    data.investmentEntries.push({
      id: crypto.randomUUID(), investmentId, date: "2026-01-10", kind: "contribution", amount: 10,
      description: "Contribution", categoryId, paymentMethodId, notes: "",
    });
    data.recurringItems.push({
      id: crypto.randomUUID(), name: "Synthetic recurrence", kind: "investment", direction: "expense", amount: 10,
      frequency: "monthly", categoryId, paymentMethodId, investmentId, nextDueDate: "2026-08-01", active: true, notes: "",
    });

    expect(catalogUsageCount(data, "category", categoryId)).toBe(3);
    expect(catalogUsageCount(data, "paymentMethod", paymentMethodId)).toBe(3);
  });
});
