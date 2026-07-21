import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DetailDialog } from "../../src/renderer/components/DetailDialog";
import { Field, Modal } from "../../src/renderer/components/Modal";
import { I18nProvider } from "../../src/renderer/i18n/I18nContext";

afterEach(cleanup);

describe("accessible dialogs", () => {
  it("moves focus inside a form modal, traps it and restores it on unmount", async () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    const onClose = vi.fn();
    const user = userEvent.setup();
    const view = render(
      <I18nProvider language="it">
        <Modal title="Nuova voce" onClose={onClose} onSubmit={(event) => event.preventDefault()}>
          <Field label="Descrizione"><input /></Field>
        </Modal>
      </I18nProvider>,
    );

    expect(screen.getByLabelText("Descrizione")).toHaveFocus();
    const close = screen.getByRole("button", { name: "Chiudi" });
    close.focus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Salva" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();

    view.unmount();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it("gives each detail dialog an accessible name", () => {
    render(<I18nProvider language="en"><DetailDialog title="Synthetic detail" onClose={() => undefined}>Content</DetailDialog></I18nProvider>);
    expect(screen.getByRole("dialog", { name: "Synthetic detail" })).toBeInTheDocument();
  });
});
