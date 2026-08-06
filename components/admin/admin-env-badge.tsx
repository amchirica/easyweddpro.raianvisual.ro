export function AdminEnvBadge() {
  const env =
    process.env.NEXT_PUBLIC_APP_ENV?.trim() ||
    process.env.VERCEL_ENV?.trim() ||
    (process.env.NODE_ENV === "production" ? "production" : "development");

  const label =
    env === "production" ? "Production" : env === "preview" || env === "staging" ? "Staging" : "Dev";

  const tone =
    env === "production"
      ? "border-rose-400/40 bg-rose-500/10 text-rose-300"
      : "border-amber-400/40 bg-amber-500/10 text-amber-200";

  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] ${tone}`}>
      {label}
    </span>
  );
}
