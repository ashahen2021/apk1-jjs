// Generates /api/contact.php, the contact-form handler for Hostinger and other
// PHP hosts, from src/lib/contact-handler.php. The recipient and sender come
// from CONTACT_EMAIL in site.config.mjs, so the address is configured in one
// place. SMTP credentials are never part of the build: see the handler's header.
// On Vercel builds the file is a stub, because Vercel serves .php as plain
// text; the Node function in /api/contact.js is used there.
import type { APIRoute } from 'astro';
import handler from '../../lib/contact-handler.php?raw';
import { CONTACT_EMAIL, SITE_URL } from '../../../site.config.mjs';

const text = { headers: { 'Content-Type': 'text/plain; charset=utf-8' } };
const php = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

export const GET: APIRoute = ({ site }) => {
  if (process.env.VERCEL) return new Response('<?php http_response_code(404);\n', text);
  const host = new URL(process.env.SITE_URL || SITE_URL || site!.href).hostname.replace(/^www\./, '');
  // Hostinger delivers most reliably from a real mailbox on the site's domain.
  const sender = CONTACT_EMAIL.toLowerCase().endsWith(`@${host}`) ? CONTACT_EMAIL : `no-reply@${host}`;
  const body = handler.replace("'__TO__'", `'${php(CONTACT_EMAIL)}'`).replace("'__FROM__'", `'${php(`NeoKemetAI <${sender}>`)}'`);
  return new Response(body, text);
};
