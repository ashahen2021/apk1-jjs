// Generates /api/contact.php: the contact-form handler for Hostinger and other
// PHP hosts. It mirrors api/contact.js (same fields, limits and spam checks)
// and sends with PHP's mail(), which Hostinger supports without any password.
// The recipient comes from CONTACT_EMAIL in site.config.mjs, so the address is
// still configured in one place. On Vercel builds the file is a stub, because
// Vercel serves .php files as plain text; the Node function is used there.
import type { APIRoute } from 'astro';
import { CONTACT_EMAIL, SITE_URL } from '../../../site.config.mjs';

const php = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

export const GET: APIRoute = ({ site }) => {
  if (process.env.VERCEL) {
    return new Response('<?php http_response_code(404);\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  const host = new URL(process.env.SITE_URL || SITE_URL || site!.href).hostname.replace(/^www\./, '');
  // Hostinger delivers most reliably from a real mailbox on the site's domain.
  const sender = CONTACT_EMAIL.toLowerCase().endsWith(`@${host}`) ? CONTACT_EMAIL : `no-reply@${host}`;
  const body = `<?php
// NeoKemetAI contact form handler (generated at build time; edit src/pages/api/contact.php.ts).
$TO = ${php(CONTACT_EMAIL)};
$FROM = ${php(`NeoKemetAI <${sender}>`)}; // an existing mailbox on this domain
$LIMITS = ['name' => 100, 'email' => 200, 'subject' => 150, 'message' => 5000];
$MIN_FILL_MS = 3000;

header('Cache-Control: no-store');
$wantsJson = strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;
function reply($status, $payload) {
  global $wantsJson;
  if ($wantsJson) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
  } else {
    header('Location: /contact/?status=' . ($payload['ok'] ? 'sent' : $payload['error']), true, 303);
  }
  exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); reply(405, ['ok' => false, 'error' => 'method_not_allowed']); }

$in = $_POST;
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
  $in = json_decode(file_get_contents('php://input'), true) ?: [];
}
$get = function ($k) use ($in) { return isset($in[$k]) && is_string($in[$k]) ? trim($in[$k]) : ''; };
$d = ['name' => $get('name'), 'email' => $get('email'), 'subject' => $get('subject'), 'message' => $get('message')];

// Spam: hidden honeypot field, and a minimum time between opening and sending the form.
$ts = (float) $get('ts');
if ($get('website') !== '' || ($ts > 0 && microtime(true) * 1000 - $ts < $MIN_FILL_MS)) reply(200, ['ok' => true]);

$errors = [];
if ($d['name'] === '') $errors['name'] = 'Please enter your name.';
if ($d['email'] === '') $errors['email'] = 'Please enter your email address.';
elseif (!filter_var($d['email'], FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Please enter a valid email address.';
if ($d['subject'] === '') $errors['subject'] = 'Please enter a subject.';
if (mb_strlen($d['message']) < 10) $errors['message'] = 'Please write a message of at least 10 characters.';
foreach ($LIMITS as $k => $max) if (mb_strlen($d[$k]) > $max) $errors[$k] = "Please keep this under $max characters.";
if ($errors) reply(400, ['ok' => false, 'error' => 'invalid', 'errors' => $errors]);

$clean = function ($s) { return str_replace(["\\r", "\\n"], ' ', $s); }; // no header injection
$subject = '=?UTF-8?B?' . base64_encode('[NeoKemetAI] ' . $clean($d['subject'])) . '?=';
$headers = implode("\\r\\n", [
  'From: ' . $FROM,
  'Reply-To: ' . $clean($d['name']) . ' <' . $clean($d['email']) . '>',
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
]);
$text = 'From: ' . $d['name'] . ' <' . $d['email'] . ">\\n\\n" . $d['message'];

if (@mail($TO, $subject, $text, $headers)) reply(200, ['ok' => true]);
reply(502, ['ok' => false, 'error' => 'delivery_failed']);
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
