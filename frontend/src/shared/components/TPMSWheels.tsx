import { BarFormatter } from "../utils/format";

function pressureClass(v?: number) {
  if (v == null) return "text-gray-400";

  // Dangerously low
  if (v < 2.6) return "text-red-600 dark:text-red-400";

  // Low, but not catastrophic
  if (v < 2.8) return "text-orange-600 dark:text-orange-400";

  // Slightly below ideal
  if (v < 2.9) return "text-amber-600 dark:text-amber-400";

  // Ideal zone
  if (v <= 3.0) return "text-green-600 dark:text-green-400";

  // Slightly above
  if (v <= 3.1) return "text-teal-600 dark:text-teal-400";

  // Noticeably high
  if (v <= 3.3) return "text-yellow-600 dark:text-yellow-400";

  // Dangerously high
  return "text-red-600 dark:text-red-400";
}

function Wheel({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div
        className={`flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600`}
      >
        <div className="leading-none flex flex-col gap-0.5 items-center">
          <BarFormatter
            value={value}
            renderValue={(parts) => (
              <div className={`text-xs font-semibold ${pressureClass(value)}`}>{parts}</div>
            )}
            renderUnit={(parts) => (
              <div className="text-[8px] text-gray-500 dark:text-gray-400">{parts}</div>
            )}
          />
        </div>
      </div>
    </div>
  );
}

export function TPMSWheels({
  fl,
  fr,
  rl,
  rr,
}: {
  fl?: number;
  fr?: number;
  rl?: number;
  rr?: number;
}) {
  return (
    <div className="grid grid-cols-2 place-items-center gap-3">
      <Wheel label="FL" value={fl} />
      <Wheel label="FR" value={fr} />
      <Wheel label="RL" value={rl} />
      <Wheel label="RR" value={rr} />
    </div>
  );
}
