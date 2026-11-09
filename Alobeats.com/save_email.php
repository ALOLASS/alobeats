<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond($httpStatus, $status, $message)
{
    http_response_code($httpStatus);
    echo json_encode(
        ['status' => $status, 'message' => $message],
        JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, 'error', 'Please submit the subscription form.');
}

$email = isset($_POST['email']) && is_string($_POST['email'])
    ? trim($_POST['email'])
    : '';

if ($email === '' || strlen($email) > 254) {
    respond(400, 'error', 'Please provide a valid email address.');
}

$validatedEmail = filter_var($email, FILTER_VALIDATE_EMAIL);
if ($validatedEmail === false) {
    respond(400, 'error', 'Please provide a valid email address.');
}

$trackTitle = isset($_POST['track_title']) && is_string($_POST['track_title'])
    ? trim($_POST['track_title'])
    : '';
$trackFile = isset($_POST['track_file']) && is_string($_POST['track_file'])
    ? trim($_POST['track_file'])
    : '';

if (($trackTitle === '') !== ($trackFile === '')) {
    respond(400, 'error', 'Please provide both the beat title and file.');
}

$subscriberData = [
    'email' => $validatedEmail,
    'subscribed_at' => gmdate('c')
];

if ($trackTitle !== '') {
    if (strlen($trackTitle) > 200 || preg_match('/[\r\n\x00-\x1F\x7F]/', $trackTitle)) {
        respond(400, 'error', 'Please provide a valid beat title.');
    }

    if (
        strlen($trackFile) > 255 ||
        basename($trackFile) !== $trackFile ||
        !preg_match('/\A[a-zA-Z0-9][a-zA-Z0-9._ -]*\.mp3\z/i', $trackFile) ||
        !is_file(__DIR__ . DIRECTORY_SEPARATOR . $trackFile)
    ) {
        respond(400, 'error', 'The selected beat file is unavailable.');
    }

    $subscriberData['track_title'] = $trackTitle;
    $subscriberData['track_file'] = $trackFile;
}

$subscriber = json_encode(
    $subscriberData,
    JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
);

if ($subscriber === false) {
    respond(500, 'error', 'Subscription could not be saved. Please try again later.');
}

$filePath = __DIR__ . DIRECTORY_SEPARATOR . 'subscribers.txt';
$previousUmask = umask(0077);
$file = @fopen($filePath, 'ab');
umask($previousUmask);

if ($file === false) {
    error_log('Newsletter subscription storage could not be opened.');
    respond(500, 'error', 'Subscription could not be saved. Please try again later.');
}

$writeSucceeded = false;
if (flock($file, LOCK_EX)) {
    $line = $subscriber . PHP_EOL;
    $length = strlen($line);
    $written = 0;

    while ($written < $length) {
        $bytes = fwrite($file, substr($line, $written));
        if ($bytes === false || $bytes === 0) {
            break;
        }
        $written += $bytes;
    }

    $writeSucceeded = $written === $length && fflush($file);
    flock($file, LOCK_UN);
}

fclose($file);
if (!@chmod($filePath, 0600)) {
    error_log('Newsletter subscription storage permissions could not be restricted.');
}

if (!$writeSucceeded) {
    error_log('Newsletter subscription could not be written to storage.');
    respond(500, 'error', 'Subscription could not be saved. Please try again later.');
}

respond(200, 'success', "You're in! Check your inbox soon.");
