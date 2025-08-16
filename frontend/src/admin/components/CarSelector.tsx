import { Trans } from "@lingui/react/macro";
type Props = {
  carIds: number[];
  value?: number;
  onChange: (id?: number) => void;
};

export function CarSelector({ carIds, value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-700 dark:text-gray-300">
        <Trans>Car</Trans>
      </label>
      <select
        className="rounded-md border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v ? Number(v) : undefined);
        }}
      >
        {carIds.length === 0 && (
          <option value="">
            <Trans>No cars</Trans>
          </option>
        )}
        {carIds.map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
    </div>
  );
}
