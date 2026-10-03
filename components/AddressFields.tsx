import { useEffect, useState } from 'react';
import type { Location } from '@/lib/locations';
import { suggestedPostalCode } from '@/lib/postal-codes';
import type { CheckoutDetails } from '@/lib/checkout-details';

function AddressSelect({
  level,
  parent = '',
  name,
  label,
  value,
  onChange,
}: {
  level: string;
  parent?: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [items, setItems] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const enabled = level === 'provinces' || !!parent;
  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setItems([]);
    fetch(`/api/locations?level=${level}&parent=${parent}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load options.');
        return response.json();
      })
      .then(setItems)
      .catch(() => {
        if (!controller.signal.aborted) setError('Could not load options.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [level, parent, enabled, retry]);
  return (
    <label>
      {label}
      <select
        name={name}
        required
        value={value}
        disabled={!enabled || loading || !!error}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">
          {loading && enabled ? 'Loading…' : `Select ${label.toLowerCase()}`}
        </option>
        {items.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert">
          {error}{' '}
          <button type="button" onClick={() => setRetry(retry + 1)}>
            Retry
          </button>
        </span>
      )}
    </label>
  );
}

export default function AddressFields({
  initialDetails,
}: {
  initialDetails?: CheckoutDetails | null;
}) {
  const [province, setProvince] = useState(initialDetails?.provinceCode || '');
  const [city, setCity] = useState(initialDetails?.cityCode || '');
  const [barangay, setBarangay] = useState(initialDetails?.barangayCode || '');
  const [postalCode, setPostalCode] = useState(initialDetails?.postalCode || '');
  const [postalEdited, setPostalEdited] = useState(!!initialDetails?.postalCode);
  return (
    <>
      <AddressSelect
        level="provinces"
        name="provinceCode"
        label="Province / Metro Manila"
        value={province}
        onChange={(value) => {
          setProvince(value);
          setPostalCode('');
          setPostalEdited(false);
          setCity('');
          setBarangay('');
        }}
      />
      <AddressSelect
        key={`city-${province}`}
        level="cities"
        parent={province}
        name="cityCode"
        label="City / municipality"
        value={city}
        onChange={(value) => {
          setCity(value);
          setPostalCode(suggestedPostalCode(value));
          setPostalEdited(false);
          setBarangay('');
        }}
      />
      <AddressSelect
        key={`barangay-${city}`}
        level="barangays"
        parent={city}
        name="barangayCode"
        label="Barangay"
        value={barangay}
        onChange={setBarangay}
      />
      <label>
        Postal code
        <input
          required
          name="postalCode"
          autoComplete="postal-code"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          value={postalCode}
          onChange={(event) => {
            setPostalCode(event.target.value);
            setPostalEdited(true);
          }}
          aria-describedby="postal-code-help"
        />
        <small id="postal-code-help" aria-live="polite">
          {!city
            ? 'Select your city first, or enter your ZIP code.'
            : !postalEdited && suggestedPostalCode(city)
              ? 'Suggested for your city. Check and edit if needed.'
              : 'Enter the ZIP code for your delivery address.'}
        </small>
      </label>
      <label className="full">
        House / unit number, street, subdivision
        <input
          required
          name="address"
          defaultValue={initialDetails?.address || ''}
          autoComplete="street-address"
          minLength={5}
          maxLength={350}
        />
      </label>
    </>
  );
}
