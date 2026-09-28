// Vercel Function: POST /api/contact
//
// Receives the contact form, validates it, filters obvious spam and forwards the
// message by email through Resend's HTTP API (https://resend.com). No secret is
// stored in the repository: delivery is enabled by setting RESEND_API_KEY in the
// Vercel project's environment variables. Without it, the function answers 503
// and the page asks the visitor to try again later.
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY   required to send mail
//   CONTACT_EMAIL    optional; overrides CONTACT_EMAIL in /site.config.mjs
//   CONTACT_FROM     optional; verified sender, e.g. "NeoKemetAI <contact@your-domain>"
//                    (defaults to Resend's test sender, which only delivers to
//                    the Resend account owner's own address)

import { CONTACT_EMAIL } from '../site.config.mjs';

export const LIMITS = { name: 100, email: 200, subject: 150, message: 5000 };
const MIN_FILL_MS = 3000; // faster than this is almost certainly a bot
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Validate a submission. Returns { data } or { errors } keyed by field. */
export function validate(body, now = Date.now()) {
  const get = (k) => (typeof body?.[k] === 'string' ? body[k].trim() : '');
  const data = { name: get('name'), email: get('email'), subject: get('subject'), message: get('message') };
  const errors = {};
  if (!data.name) errors.name = 'Please enter your name.';
  if (!data.email) errors.email = 'Please enter your email address.';
  else if (!EMAIL_RE.test(data.email)) errors.email = 'Please enter a valid email address.';
  if (!data.subject) errors.subject = 'Please enter a subject.';
  if (data.message.length < 10) errors.message = 'Please write a message of at least 10 characters.';
  for (const [k, max] of Object.entries(LIMITS)) {
    if (data[k].length > max) errors[k] = `Please keep this under ${max} characters.`;
  }
  // Spam checks: a hidden honeypot field that people never fill, and a minimum fill time.
  const spam = get('website') !== '' || (Number(get('ts')) > 0 && now - Number(get('ts')) < MIN_FILL_MS);
  return { data, errors, spam };
}

const escape = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

async function send({ name, email, subject, message }, env = process.env) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM || 'NeoKemetAI contact form <onboarding@resend.dev>',
      to: [env.CONTACT_EMAIL || CONTACT_EMAIL],
      reply_to: email,
      subject: `[NeoKemetAI] ${subject.replace(/[\r\n]+/g, ' ')}`,
      text: `From: ${name} <${email}>\n\n${message}`,
      html: `<p><strong>From:</strong> ${escape(name)} &lt;${escape(email)}&gt;</p><p style="white-space:pre-wrap">${escape(message)}</p>`,
    }),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  // JSON from the page script; urlencoded when the page is used without JavaScript.
  const wantsJson = (req.headers.accept || '').includes('application/json');
  const reply = (status, payload) =>
    wantsJson ? res.status(status).json(payload) : res.redirect(303, `/contact/?status=${payload.ok ? 'sent' : payload.error}`);

  const { data, errors, spam } = validate(req.body || {});
  if (spam) return reply(200, { ok: true }); // pretend success; don't teach bots
  if (Object.keys(errors).length) return reply(400, { ok: false, error: 'invalid', errors });
  if (!process.env.RESEND_API_KEY) return reply(503, { ok: false, error: 'not_configured' });

  try {
    await send(data);
    return reply(200, { ok: true });
  } catch (err) {
    console.error('contact: delivery failed', err);
    return reply(502, { ok: false, error: 'delivery_failed' });
  }
}
