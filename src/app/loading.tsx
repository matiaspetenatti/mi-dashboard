export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-on-surface-variant">
        <span className="size-4 animate-spin rounded-full border-2 border-on-surface-variant/30 border-t-on-surface-variant" />
        Cargando...
      </div>
    </div>
  );
}
