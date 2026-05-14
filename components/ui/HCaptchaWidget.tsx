'use client';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface HCaptchaWidgetProps {
  sitekey: string;
  onVerify: (token: string) => void;
  onExpire: () => void;
  resetKey?: number;
}

export default function HCaptchaWidget({ sitekey, onVerify, onExpire, resetKey }: HCaptchaWidgetProps) {
  return (
    <HCaptcha
      key={resetKey}
      sitekey={sitekey}
      onVerify={onVerify}
      onExpire={onExpire}
      theme="dark"
    />
  );
}
