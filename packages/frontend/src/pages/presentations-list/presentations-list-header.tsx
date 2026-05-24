export function PresentationsListHeader() {
  return (
    <header className="mb-8 flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent/80">
          TOTALLY NOT POWER POINT
        </p>
        <h1 className="text-4xl font-semibold tracking-normal text-foreground">
          Presentations
        </h1>
      </div>
    </header>
  );
}
