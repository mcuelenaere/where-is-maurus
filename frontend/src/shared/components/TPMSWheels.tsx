export function TPMSWheels({
  fl,
  fr,
  rl,
  rr,
  unit = "bar",
}: {
  fl?: number;
  fr?: number;
  rl?: number;
  rr?: number;
  unit?: string;
}) {
  function pressureClass(v?: number) {
    if (v == null) return "text-gray-400";
    if (v < 2.1) return "text-red-600 dark:text-red-400";
    if (v < 2.3) return "text-yellow-600 dark:text-yellow-400";
    if (v > 2.8) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  }

  function Wheel({ label, value }: { label: string; value?: number }) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </div>
        <div
          className={`flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 ${pressureClass(
            value
          )}`}
        >
          <span className="leading-none">
            <span className="text-xs font-semibold">{value != null ? value.toFixed(2) : "—"}</span>
          </span>
          <span className="mt-0.5 text-[8px] text-gray-500 dark:text-gray-400">{unit}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 place-items-center gap-3">
      <Wheel label="FL" value={fl} />
      <Wheel label="FR" value={fr} />
      <Wheel label="RL" value={rl} />
      <Wheel label="RR" value={rr} />
    </div>
  );
}
