export function AdminErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
      {message}
    </div>
  );
}
