import dataset from '../data/addresses/postal-codes.json';
export function suggestedPostalCode(cityCode: string): string {
  return (dataset.cities as Record<string, string>)[cityCode] || '';
}
