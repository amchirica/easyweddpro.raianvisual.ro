import type { ReactNode } from "react";

export type AdminColumn<T> = {
  key: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

export function AdminTable<T extends { id: string }>({
  columns,
  rows,
  empty,
}: {
  columns: AdminColumn<T>[];
  rows: T[];
  empty?: ReactNode;
}) {
  if (!rows.length) {
    return <>{empty ?? <p className="px-5 py-8 text-sm text-muted-soft">Niciun rezultat.</p>}</>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th key={col.key} className={`px-5 py-3 font-medium ${col.className ?? ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/60">
              {columns.map((col) => (
                <td key={col.key} className={`px-5 py-3 ${col.className ?? ""}`}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
