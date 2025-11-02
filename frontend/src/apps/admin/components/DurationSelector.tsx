import { useEffect, useState } from "react";
import { Trans, useLingui } from "@lingui/react/macro";

function useTime() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return time;
}

type Props = {
  etaMin?: number;
  onDurationChange: (days: number, hours: number, minutes: number) => void;
};

type SelectionType = "preset" | "custom" | "eta";

export function DurationSelector({ etaMin, onDurationChange }: Props) {
  const { t, i18n } = useLingui();

  const [ttlHours, setTtlHours] = useState<number>(() =>
    etaMin && etaMin > 0 ? Math.floor(etaMin / 60) : 4
  );
  const [ttlMinutes, setTtlMinutes] = useState<number>(() => {
    if (!etaMin || etaMin <= 0) return 0;
    const minutes = etaMin % 60;
    const hours = Math.floor(etaMin / 60);
    return hours === 0 && minutes === 0 ? 1 : minutes;
  });
  const [ttlDays, setTtlDays] = useState<number>(0);
  const [customTimeUnit, setCustomTimeUnit] = useState<"minutes" | "hours" | "days">("hours");
  const [customTimeValue, setCustomTimeValue] = useState<number>(() =>
    etaMin && etaMin > 0 ? Math.floor(etaMin / 60) : 4
  );
  const [selectionType, setSelectionType] = useState<SelectionType>("preset");
  const time = useTime();

  const presetsMin = [15, 30, 60, 120, 240, 480];

  // Calculate total minutes from TTL values
  const totalMinutes = (ttlDays || 0) * 24 * 60 + (ttlHours || 0) * 60 + (ttlMinutes || 0);

  // Format expiration time
  const computedExpiresAt = new Date(time.getTime() + totalMinutes * 60 * 1000).toISOString();

  // Notify parent component of duration changes
  useEffect(() => {
    onDurationChange(ttlDays, ttlHours, ttlMinutes);
  }, [ttlDays, ttlHours, ttlMinutes, onDurationChange]);

  function setTTLFromMinutes(total: number) {
    if (!Number.isFinite(total) || total <= 0) {
      setTtlDays(0);
      setTtlHours(0);
      setTtlMinutes(0);
      setCustomTimeValue(0);
      setSelectionType("preset");
      return;
    }
    const days = Math.floor(total / (24 * 60));
    const remainingMinutes = total % (24 * 60);
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    setTtlDays(days);
    setTtlHours(hours);
    setTtlMinutes(minutes);

    // Update custom time value to match the most appropriate unit
    if (days > 0) {
      setCustomTimeUnit("days");
      setCustomTimeValue(days);
    } else if (hours > 0) {
      setCustomTimeUnit("hours");
      setCustomTimeValue(hours);
    } else {
      setCustomTimeUnit("minutes");
      setCustomTimeValue(minutes);
    }

    setSelectionType("preset");
  }

  function useETA() {
    if (etaMin && etaMin > 0) {
      const adjusted = Math.round(etaMin * 1.05);
      setTTLFromMinutes(Math.max(1, adjusted));
      setSelectionType("eta");
    }
  }

  function handleCustomTimeUnitChange(unit: "minutes" | "hours" | "days") {
    setCustomTimeUnit(unit);
    setSelectionType("custom");
    setCustomTimeValue(0);
  }

  function handleCustomTimeValueChange(value: string) {
    const numValue = parseInt(value) || 0;
    setCustomTimeValue(numValue);
    setSelectionType("custom");

    // Update TTL values based on the selected unit
    if (customTimeUnit === "days") {
      setTtlDays(numValue);
      setTtlHours(0);
      setTtlMinutes(0);
    } else if (customTimeUnit === "hours") {
      setTtlDays(0);
      setTtlHours(numValue);
      setTtlMinutes(0);
    } else {
      setTtlDays(0);
      setTtlHours(0);
      setTtlMinutes(numValue);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row gap-2">
        <span className="text-xs text-gray-600 dark:text-gray-400 self-center">
          <Trans>Duration:</Trans>
        </span>
        <div className="flex flex-wrap gap-2">
          {presetsMin.map((m) => {
            const isActive =
              selectionType === "preset" &&
              (ttlDays || 0) * 24 * 60 + (ttlHours || 0) * 60 + (ttlMinutes || 0) === m;
            return (
              <button
                key={m}
                type="button"
                className={`${
                  isActive
                    ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                } rounded-md border px-2 py-1 text-xs`}
                onClick={() => setTTLFromMinutes(m)}
              >
                {m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`}
              </button>
            );
          })}
          <button
            type="button"
            className={`${
              selectionType === "custom"
                ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            } rounded-md border px-2 py-1 text-xs`}
            onClick={() => {
              setSelectionType("custom");
            }}
          >
            <Trans>Custom</Trans>
          </button>
          <button
            type="button"
            className={`${
              selectionType === "eta"
                ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            } rounded-md border px-2 py-1 text-xs disabled:opacity-50`}
            onClick={useETA}
            disabled={!etaMin || etaMin <= 0}
            title={!etaMin || etaMin <= 0 ? t`No ETA available` : t`Use ETA`}
          >
            <Trans>Use ETA</Trans>
          </button>
        </div>
      </div>

      {selectionType === "custom" && (
        <div className="flex flex-row gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400 self-center">
            <Trans>Custom:</Trans>
          </span>
          <div className="flex flex-row gap-2">
            <div className="flex flex-row items-center gap-1">
              <div className="flex flex-row">
                <button
                  type="button"
                  onClick={() =>
                    handleCustomTimeValueChange(Math.max(0, customTimeValue - 1).toString())
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-l border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
                  disabled={customTimeValue <= 0}
                >
                  <span className="text-sm font-medium">−</span>
                </button>
                <input
                  type="text"
                  value={customTimeValue}
                  onChange={(e) => handleCustomTimeValueChange(e.target.value)}
                  className="h-8 w-12 border-y border-gray-200 px-2 text-center text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => handleCustomTimeValueChange((customTimeValue + 1).toString())}
                  className="flex h-8 w-8 items-center justify-center rounded-r border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <span className="text-sm font-medium">+</span>
                </button>
              </div>
              <select
                value={customTimeUnit}
                onChange={(e) =>
                  handleCustomTimeUnitChange(e.target.value as "minutes" | "hours" | "days")
                }
                className="rounded border border-gray-200 px-2 py-1 h-8 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="minutes">
                  <Trans>Minutes</Trans>
                </option>
                <option value="hours">
                  <Trans>Hours</Trans>
                </option>
                <option value="days">
                  <Trans>Days</Trans>
                </option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-600 dark:text-gray-400">
        <Trans>
          Expires at: {i18n.date(computedExpiresAt, { dateStyle: "short", timeStyle: "medium" })} (
          {ttlDays > 0 ? `${ttlDays}d ` : ""}
          {ttlHours}h {ttlMinutes}m from now)
        </Trans>
      </div>
    </div>
  );
}
