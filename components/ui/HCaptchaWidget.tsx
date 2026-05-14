'use client';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface HCaptchaWidgetProps {
  sitekey: string;
  onVerify: (token: string) => void;
  onExpire: () => void;
  resetKey?: number;
}

// Fallback sur la clé de test officielle hCaptcha si la variable d'env n'est pas injectée
const TEST_SITEKEY = '10000000-ffff-ffff-ffff-000000000001';

export default function HCaptchaWidget({ sitekey, onVerify, onExpire, resetKey }: HCaptchaWidgetProps) {
  const resolvedKey = sitekey || TEST_SITEKEY;

  return (
    <HCaptcha
      key={resetKey}
      sitekey={resolvedKey}
      onVerify={onVerify}
      onExpire={onExpire}
      onError={(err) => console.error('[hCaptcha]', err)}
      theme="dark"
    />
  );
}
