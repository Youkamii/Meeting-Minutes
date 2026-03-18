"use client";

interface DiffViewProps {
  snapshotA: Record<string, unknown>;
  snapshotB: Record<string, unknown>;
  labelA?: string;
  labelB?: string;
}

type ChangeType = "added" | "removed" | "changed" | "unchanged";

interface FieldDiff {
  key: string;
  type: ChangeType;
  valueA: unknown;
  valueB: unknown;
}

function computeDiff(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): FieldDiff[] {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const diffs: FieldDiff[] = [];

  for (const key of allKeys) {
    const inA = key in a;
    const inB = key in b;
    const valueA = a[key];
    const valueB = b[key];

    if (!inA) {
      diffs.push({ key, type: "added", valueA: undefined, valueB });
    } else if (!inB) {
      diffs.push({ key, type: "removed", valueA, valueB: undefined });
    } else if (JSON.stringify(valueA) !== JSON.stringify(valueB)) {
      diffs.push({ key, type: "changed", valueA, valueB });
    } else {
      diffs.push({ key, type: "unchanged", valueA, valueB });
    }
  }

  return diffs;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

const changeStyles: Record<ChangeType, string> = {
  added: "bg-green-50 border-green-200",
  removed: "bg-red-50 border-red-200",
  changed: "bg-yellow-50 border-yellow-200",
  unchanged: "",
};

const changeLabelStyles: Record<ChangeType, string> = {
  added: "text-green-700",
  removed: "text-red-700",
  changed: "text-yellow-700",
  unchanged: "text-[var(--muted-foreground)]",
};

export function DiffView({
  snapshotA,
  snapshotB,
  labelA = "Before",
  labelB = "After",
}: DiffViewProps) {
  const diffs = computeDiff(snapshotA, snapshotB);
  const changedDiffs = diffs.filter((d) => d.type !== "unchanged");
  const unchangedDiffs = diffs.filter((d) => d.type === "unchanged");

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
        <span className="text-green-700">+ Added</span>
        <span className="text-red-700">- Removed</span>
        <span className="text-yellow-700">~ Changed</span>
      </div>

      {changedDiffs.length === 0 && (
        <p className="text-sm text-[var(--muted-foreground)]">
          No differences found.
        </p>
      )}

      <div className="space-y-2">
        {changedDiffs.map((diff) => (
          <div
            key={diff.key}
            className={`rounded-md border p-3 ${changeStyles[diff.type]}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium ${changeLabelStyles[diff.type]}`}>
                {diff.type === "added" ? "+" : diff.type === "removed" ? "-" : "~"}
              </span>
              <span className="text-sm font-medium">{diff.key}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {diff.type !== "added" && (
                <div>
                  <span className="text-[var(--muted-foreground)]">{labelA}: </span>
                  <pre className="mt-0.5 whitespace-pre-wrap break-all">
                    {formatValue(diff.valueA)}
                  </pre>
                </div>
              )}
              {diff.type !== "removed" && (
                <div>
                  <span className="text-[var(--muted-foreground)]">{labelB}: </span>
                  <pre className="mt-0.5 whitespace-pre-wrap break-all">
                    {formatValue(diff.valueB)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {unchangedDiffs.length > 0 && changedDiffs.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-[var(--muted-foreground)]">
            {unchangedDiffs.length} unchanged field(s)
          </summary>
          <div className="mt-2 space-y-1">
            {unchangedDiffs.map((diff) => (
              <div key={diff.key} className="flex gap-2 text-xs text-[var(--muted-foreground)]">
                <span className="font-medium">{diff.key}:</span>
                <span>{formatValue(diff.valueA)}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
