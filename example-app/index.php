<?php

$cards = [
    [
        'title' => 'Preview every pull request',
        'body' => 'This page is rendered by php-cgi-wasm inside the browser through a Service Worker.',
    ],
    [
        'title' => 'No PHP server required',
        'body' => 'GitHub Pages serves the static shell and the Wasm runtime executes PHP on demand.',
    ],
    [
        'title' => 'Useful for generic repos',
        'body' => 'Simple PHP projects can expose realistic previews without provisioning a backend.',
    ],
];
?><!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>PHP Wasm Preview Demo</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="./assets/app.css">
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <p class="kicker">Demo Application</p>
        <h1>PHP rendered inside GitHub Pages.</h1>
        <p class="lede">Current time: <?= htmlspecialchars(date('c'), ENT_QUOTES, 'UTF-8') ?></p>
        <p class="lede">PHP version: <?= htmlspecialchars(PHP_VERSION, ENT_QUOTES, 'UTF-8') ?></p>
        <a class="button" href="./info.php">Open info page</a>
      </section>

      <section class="grid">
        <?php foreach ($cards as $card): ?>
          <article class="panel">
            <h2><?= htmlspecialchars($card['title'], ENT_QUOTES, 'UTF-8') ?></h2>
            <p><?= htmlspecialchars($card['body'], ENT_QUOTES, 'UTF-8') ?></p>
          </article>
        <?php endforeach; ?>
      </section>
    </main>
  </body>
</html>
