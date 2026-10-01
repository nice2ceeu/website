import dataset from '../data/addresses/philippines.json';
export type Location = { code: string; name: string };
const cities = dataset.cities as Record<string, Location[]>;
const barangays = dataset.barangays as Record<string, Location[]>;
export async function locations(level: string, parent = ''): Promise<Location[]> {
  if (
    !['provinces', 'cities', 'barangays'].includes(level) ||
    (level !== 'provinces' && !/^\d{9}$/.test(parent))
  )
    throw new Error('Invalid location query');
  const items =
    level === 'provinces'
      ? dataset.provinces
      : level === 'cities'
        ? cities[parent]
        : barangays[parent];
  return (items || []).map((item) => ({ ...item }));
}

export async function resolveAddress(input: {
  provinceCode?: unknown;
  cityCode?: unknown;
  barangayCode?: unknown;
  address?: unknown;
}) {
  const { provinceCode, cityCode, barangayCode } = input;
  if (
    ![provinceCode, cityCode, barangayCode].every(
      (code) => typeof code === 'string' && /^\d{9}$/.test(code),
    )
  )
    throw new Error('Choose your province, city and barangay.');
  const province = (await locations('provinces')).find((item) => item.code === provinceCode);
  if (!province) throw new Error('Invalid province');
  const city = (await locations('cities', province.code)).find((item) => item.code === cityCode);
  if (!city) throw new Error('Invalid city for province');
  const barangay = (await locations('barangays', city.code)).find(
    (item) => item.code === barangayCode,
  );
  if (!barangay) throw new Error('Invalid barangay for city');
  if (
    typeof input.address !== 'string' ||
    input.address.trim().length < 5 ||
    input.address.length > 350
  )
    throw new Error('Enter your house number and street.');
  return {
    address: `${input.address.trim()}, ${barangay.name}`,
    city: `${city.name}, ${province.name}`,
  };
}
