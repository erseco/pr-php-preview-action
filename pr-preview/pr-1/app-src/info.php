<?php

$details = [
    'Server API' => php_sapi_name(),
    'Loaded extensions' => implode(', ', array_slice(get_loaded_extensions(), 0, 12)),
    'Working directory' => getcwd(),
];
?><!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>PHP Wasm Preview Info</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="./assets/app.css">
  </head>
  <body>
    <main class="page narrow">
      <p class="kicker">Runtime details</p>
      <h1>Preview diagnostics</h1>
      <dl class="facts">
        <?php foreach ($details as $label => $value): ?>
          <div>
            <dt><?= htmlspecialchars($label, ENT_QUOTES, 'UTF-8') ?></dt>
            <dd><?= htmlspecialchars($value, ENT_QUOTES, 'UTF-8') ?></dd>
          </div>
        <?php endforeach; ?>
      </dl>
      <a class="button" href="./index.php">Back to the demo</a>
    </main>
  </body>
</html>
