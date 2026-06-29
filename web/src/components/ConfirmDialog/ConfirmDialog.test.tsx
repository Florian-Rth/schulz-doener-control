import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/renderWithTheme";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("rendert im destructive-Ton den Abbrechen-Button prominent zuerst und die Bestätigung darunter", () => {
    renderWithTheme(
      <ConfirmDialog
        open
        onClose={() => {}}
        title="Wirklich abbrechen?"
        body="Das verwirft alles."
        confirmLabel="Ja, abbrechen"
        cancelLabel="Doch nicht"
        onConfirm={() => {}}
        tone="destructive"
      />,
    );

    const dialog = screen.getByRole("dialog");
    const buttons = within(dialog).getAllByRole("button");
    // The safe escape (cancel) is the first/prominent button; the destructive
    // confirm sits below it.
    expect(buttons[0]).toHaveTextContent("Doch nicht");
    expect(buttons[1]).toHaveTextContent("Ja, abbrechen");
  });

  it("feuert onConfirm beim Klick auf die Bestätigung", async () => {
    const onConfirm = vi.fn();
    renderWithTheme(
      <ConfirmDialog
        open
        onClose={() => {}}
        title="Bestätigen?"
        body="Sicher?"
        confirmLabel="Ja, los"
        cancelLabel="Doch nicht"
        onConfirm={onConfirm}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Ja, los" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("feuert onClose beim Klick auf Abbrechen", async () => {
    const onClose = vi.fn();
    renderWithTheme(
      <ConfirmDialog
        open
        onClose={onClose}
        title="Bestätigen?"
        body="Sicher?"
        confirmLabel="Ja, los"
        cancelLabel="Doch nicht"
        onConfirm={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Doch nicht" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("zeigt im pending-Zustand das pendingLabel und deaktiviert die Bestätigung", () => {
    renderWithTheme(
      <ConfirmDialog
        open
        onClose={() => {}}
        title="Bestätigen?"
        body="Sicher?"
        confirmLabel="Ja, los"
        pendingLabel="Läuft …"
        cancelLabel="Doch nicht"
        onConfirm={() => {}}
        pending
      />,
    );

    const confirm = screen.getByRole("button", { name: "Läuft …" });
    expect(confirm).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Ja, los" })).not.toBeInTheDocument();
  });
});
