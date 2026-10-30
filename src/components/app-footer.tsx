import paquete from "../../package.json";

export function AppFooter() {
  return (
    <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-card px-4 py-4 text-xs text-charcoal ring-1 ring-inset ring-black/[0.07] dark:ring-[rgba(159,232,112,0.12)]">
      <p className="flex items-center gap-2" role="status">
        <span aria-hidden="true" className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-spruce opacity-60 motion-reduce:hidden dark:bg-lime-voltage" />
          <span className="relative inline-flex size-2 rounded-full bg-spruce dark:bg-lime-voltage" />
        </span>
        <span className="font-bold text-heading">Sistema en línea</span>
      </p>

      <div className="flex items-center gap-4">
        <span className="rounded-full bg-surface-container px-2 py-0.5 font-mono text-[12px] text-on-surface-variant">
          v{paquete.version}
        </span>
        <span className="font-medium text-on-surface-variant">
          Wise Engine © 2026
        </span>
      </div>
    </footer>
  );
}
