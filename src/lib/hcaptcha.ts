export async function verifyHcaptcha(token: string): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET_KEY;
  if (!secret) return false;

  const body = new URLSearchParams({ secret, response: token });
  const res = await fetch('https://api.hcaptcha.com/siteverify', {
    method: 'POST',
    body,
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.success === true;
}
