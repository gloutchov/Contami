import type { FinanceCommand } from "../../domain/commands";

export async function saveAndClose(
  onSave: (command: FinanceCommand) => Promise<void>,
  command: FinanceCommand,
  onClose: () => void,
): Promise<void> {
  try {
    await onSave(command);
    onClose();
  } catch {
    // App renders the localized error notice; keeping the form open preserves user input.
  }
}

export function runUiAction(action: () => Promise<unknown>): void {
  void action().catch(() => undefined);
}
