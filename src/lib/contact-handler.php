<?php
// NeoKemetAI contact-form handler for Hostinger and other PHP hosts.
// Source: src/lib/contact-handler.php. The build writes it to /api/contact.php and
// fills in __TO__ and __FROM__ from CONTACT_EMAIL in site.config.mjs.
//
// Sending: if an SMTP settings file exists OUTSIDE public_html, mail goes through
// the mailbox over SMTP (recommended on Hostinger). Otherwise PHP mail() is tried.
// Settings file: <folder that contains public_html>/neokemetai-smtp.php, e.g.
//   <?php return ['host' => 'smtp.hostinger.com', 'port' => 465,
//                 'user' => 'info@your-domain', 'pass' => 'mailbox password'];
// It is never uploaded with the site and never stored in the repository.

$TO = '__TO__';
$FROM = '__FROM__';
$LIMITS = ['name' => 100, 'email' => 200, 'subject' => 150, 'message' => 5000];
$MIN_FILL_MS = 3000;
$SMTP_FILE = dirname(__DIR__, 2) . '/neokemetai-smtp.php';

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

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  header('Allow: POST');
  reply(405, ['ok' => false, 'error' => 'method_not_allowed']);
}

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

$clean = function ($s) { return str_replace(["\r", "\n"], ' ', $s); }; // no header injection
$subject = '=?UTF-8?B?' . base64_encode('[NeoKemetAI] ' . $clean($d['subject'])) . '?=';
$replyTo = '=?UTF-8?B?' . base64_encode($clean($d['name'])) . '?= <' . $clean($d['email']) . '>';
$text = 'From: ' . $d['name'] . ' <' . $d['email'] . ">\n\n" . $d['message'];

/** Minimal SMTP client (implicit TLS, AUTH LOGIN). Returns true or an error string. */
function smtp_send($cfg, $from, $to, $headers, $body) {
  $host = $cfg['host'] ?? 'smtp.hostinger.com';
  $port = (int) ($cfg['port'] ?? 465);
  $fp = @stream_socket_client("ssl://$host:$port", $errno, $errstr, 15);
  if (!$fp) return "connect: $errstr";
  stream_set_timeout($fp, 15);
  $read = function () use ($fp) {
    $out = '';
    while (($line = fgets($fp, 515)) !== false) { $out .= $line; if (strlen($line) < 4 || $line[3] === ' ') break; }
    return $out;
  };
  $cmd = function ($c, $ok) use ($fp, $read) {
    if ($c !== null) fwrite($fp, $c . "\r\n");
    $r = $read();
    return in_array((int) substr($r, 0, 3), (array) $ok, true) ? true : trim($r);
  };
  $fromAddr = preg_replace('/^.*<([^>]+)>.*$/', '$1', $from);
  $local = $_SERVER['SERVER_NAME'] ?? 'localhost';
  $body = preg_replace('/^\./m', '..', str_replace(["\r\n", "\r"], "\n", $body));
  $data = $headers . "\r\nTo: <$to>\r\n\r\n" . str_replace("\n", "\r\n", $body) . "\r\n.";
  $steps = [
    [null, 220], ["EHLO $local", 250], ['AUTH LOGIN', 334],
    [base64_encode($cfg['user']), 334], [base64_encode($cfg['pass']), 235],
    ["MAIL FROM:<$fromAddr>", 250], ["RCPT TO:<$to>", [250, 251]], ['DATA', 354], [$data, 250],
  ];
  foreach ($steps as $i => [$c, $ok]) {
    $r = $cmd($c, $ok);
    if ($r !== true) { fclose($fp); return 'step ' . $i . ': ' . ($i === 4 ? 'authentication failed' : $r); }
  }
  $cmd('QUIT', 221);
  fclose($fp);
  return true;
}

$smtp = is_file($SMTP_FILE) ? include $SMTP_FILE : null;
$from = $FROM;
if (is_array($smtp) && !empty($smtp['user'])) $from = 'NeoKemetAI <' . $smtp['user'] . '>';
$headers = implode("\r\n", [
  'From: ' . $from,
  'Reply-To: ' . $replyTo,
  'Subject: ' . $subject,
  'Date: ' . date('r'),
  'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . ($_SERVER['SERVER_NAME'] ?? 'localhost') . '>',
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'Content-Transfer-Encoding: 8bit',
]);

if (is_array($smtp) && !empty($smtp['user']) && !empty($smtp['pass'])) {
  $r = smtp_send($smtp, $from, $TO, $headers, $text);
  if ($r === true) reply(200, ['ok' => true]);
  error_log('NeoKemetAI contact: SMTP failed: ' . $r);
  reply(502, ['ok' => false, 'error' => 'delivery_failed']);
}

// No SMTP settings: fall back to PHP mail(). The Subject goes in its own argument.
$mailHeaders = preg_replace('/^Subject: .*\r\n/m', '', $headers);
$fromAddr = preg_replace('/^.*<([^>]+)>.*$/', '$1', $from);
if (@mail($TO, $subject, $text, $mailHeaders, '-f' . $fromAddr)) reply(200, ['ok' => true]);
error_log('NeoKemetAI contact: mail() failed; add the SMTP settings file ' . $SMTP_FILE);
reply(502, ['ok' => false, 'error' => 'delivery_failed']);
