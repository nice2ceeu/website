import type { PaymentSettings } from '@/lib/payment-settings';

const labels = { gcash: 'GCash', bank: 'Bank transfer', cod: 'Cash on delivery' } as const;
export default function PaymentSelection({
  settings,
  value,
  onChange,
}: {
  settings: PaymentSettings;
  value: 'gcash' | 'bank' | 'cod' | '';
  onChange: (value: 'gcash' | 'bank' | 'cod') => void;
}) {
  const methods = [
    settings.gcashEnabled && 'gcash',
    settings.bankEnabled && 'bank',
    settings.codEnabled && 'cod',
  ].filter(Boolean) as Array<'gcash' | 'bank' | 'cod'>;
  const details =
    value === 'gcash' ? settings.gcashDetails : value === 'bank' ? settings.bankDetails : '';
  return (
    <fieldset className="full payment-selection">
      <legend>Payment method</legend>
      <div className="payment-options">
        {methods.map((method) => (
          <label className="checkbox" key={method}>
            <input
              required
              type="radio"
              name="paymentMethod"
              value={method}
              checked={value === method}
              onChange={() => onChange(method)}
            />
            <span>{labels[method]}</span>
          </label>
        ))}
      </div>
      {details && (
        <div className="payment-instructions" role="status">
          <strong>Send your payment here</strong>
          <p>{details}</p>
          <small>Payment is confirmed manually after your order is submitted.</small>
        </div>
      )}
      {value === 'cod' && <p className="form-note">Pay when your order is delivered.</p>}
    </fieldset>
  );
}
