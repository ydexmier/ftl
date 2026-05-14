const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: ["default-src 'self'", "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.hcaptcha.com https://*.hcaptcha.com", "style-src 'self' 'unsafe-inline' https://*.hcaptcha.com", "img-src 'self' data: blob: https://cards.lorcast.io https://*.hcaptcha.com", "font-src 'self'", "connect-src 'self' https://*.hcaptcha.com", "frame-src https://*.hcaptcha.com", "frame-ancestors 'none'"].join('; ') },
];

module.exports = {
  reactStrictMode: true,
  images: { domains: ['cards.lorcast.io'] },
  async headers() { return [{ source: '/(.*)', headers: securityHeaders }]; },
};
