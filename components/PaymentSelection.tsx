import type { PaymentSettings } from '@/lib/payment-settings';

const labels = {
  gcash: 'GCash',
  bank: 'Bank transfer',
  cod: 'Cash on delivery',
  qr: 'QR payment',
} as const;
export default function PaymentSelection({
  settings,
  value,
  onChange,
}: {
  settings: PaymentSettings;
  value: 'gcash' | 'bank' | 'cod' | 'qr' | '';
  onChange: (value: 'gcash' | 'bank' | 'cod' | 'qr') => void;
}) {
  const methods = [
    settings.gcashEnabled && 'gcash',
    settings.bankEnabled && 'bank',
    settings.codEnabled && 'cod',
    settings.qrEnabled && 'qr',
  ].filter(Boolean) as Array<'gcash' | 'bank' | 'cod' | 'qr'>;
  const details =
    value === 'gcash'
      ? settings.gcashDetails
      : value === 'bank'
        ? settings.bankDetails
        : value === 'qr'
          ? settings.qrDetails
          : '';
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
      {(details || (value === 'qr' && settings.qrImageUrl)) && (
        <div className="payment-instructions" role="status">
          <strong>Send your payment here</strong>
          {value === 'qr' && settings.qrImageUrl && (
            <img
              className="payment-qr"
              src={settings.qrImageUrl}
              alt="Scan this QR code to pay Lightmare PH"
            />
          )}
          <p>{details}</p>
          <small>Payment is confirmed manually after your order is submitted.</small>
        </div>
      )}
      {value === 'cod' && <p className="form-note">Pay when your order is delivered.</p>}
    </fieldset>
  );
}
