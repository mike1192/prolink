export function toCSV<T extends Record<string, any>>(rows: T[], columns?: (keyof T)[]): string {
  if (!rows.length) return "";
  const cols = (columns ?? (Object.keys(rows[0]) as (keyof T)[])) as string[];
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = Array.isArray(v) ? v.join("|") : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.join(",");
  const body = rows.map((r) => cols.map((c) => escape((r as any)[c])).join(",")).join("\n");
  return `${header}\n${body}`;
}

export function downloadCSV(filename: string, csv: string) {
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportRowsAsCSV<T extends Record<string, any>>(
  filename: string,
  rows: T[],
  columns?: (keyof T)[],
) {
  downloadCSV(filename, toCSV(rows, columns));
}
