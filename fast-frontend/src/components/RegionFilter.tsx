import type { RegionalCode } from '../shared/types';

interface RegionFilterProps {
  value: RegionalCode | '';
  onChange: (value: RegionalCode | '') => void;
}

export default function RegionFilter({ value, onChange }: RegionFilterProps) {
  const regions: RegionalCode[] = ['APAC', 'EMEA', 'AMER'];

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="region-filter" className="text-sm font-medium text-gray-700">
        Region:
      </label>
      <select
        id="region-filter"
        value={value}
        onChange={(e) => onChange(e.target.value as RegionalCode | '')}
        className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
      >
        <option value="">All Regions</option>
        {regions.map((region) => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </select>
    </div>
  );
}
