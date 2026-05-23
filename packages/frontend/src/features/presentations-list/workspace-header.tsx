/** Page header for the presentations-list route. */
export function WorkspaceHeader() {
  return (
    <header className="mb-8 flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent/80">
          Workspace
        </p>
        <h1 className="text-4xl font-semibold tracking-normal text-foreground">
          Presentations
        </h1>
      </div>
      <p className="max-w-sm text-sm leading-6 text-muted">
        Create and manage decks before opening the editor workbench.
      </p>
    </header>
  );
}
