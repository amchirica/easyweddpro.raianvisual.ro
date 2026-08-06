import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AdminFilterField = {
  name: string;
  label: string;
  type?: "text" | "search" | "date" | "select";
  defaultValue?: string;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
};

export function AdminFilters({
  action,
  fields,
}: {
  action?: string;
  fields: AdminFilterField[];
}) {
  return (
    <form method="get" action={action} className="surface-card flex flex-wrap items-end gap-3 p-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <Label htmlFor={`filter-${field.name}`}>{field.label}</Label>
          {field.type === "select" ? (
            <select
              id={`filter-${field.name}`}
              name={field.name}
              defaultValue={field.defaultValue ?? ""}
              className="flex h-9 min-w-[140px] rounded-lg border border-border bg-background px-3 text-sm"
            >
              {(field.options ?? []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id={`filter-${field.name}`}
              name={field.name}
              type={field.type === "date" ? "date" : "search"}
              defaultValue={field.defaultValue ?? ""}
              placeholder={field.placeholder}
              className="h-9 w-44"
            />
          )}
        </div>
      ))}
      <Button type="submit" size="sm">
        Filtrează
      </Button>
    </form>
  );
}
