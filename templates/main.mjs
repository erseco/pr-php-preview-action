const bootstrap = __BOOTSTRAP_JSON__;
const status = document.querySelector('#status');

await boot().catch((error) => {
  console.error(error);
  status.textContent = error instanceof Error ? error.message : String(error);
});

async function boot() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('This browser does not support Service Workers.');
  }

  status.textContent = 'Starting the PHP CGI service worker.';

  const previewRoot = new URL('.', window.location.href);
  const workerUrl = new URL(bootstrap.workerPath, previewRoot);
  workerUrl.searchParams.set('prefix', joinUrlPath(previewRoot.pathname, 'app'));
  workerUrl.searchParams.set('docroot', bootstrap.docroot);

  const registration = await navigator.serviceWorker.register(workerUrl, {
    type: 'module',
    scope: previewRoot.pathname
  });
  await navigator.serviceWorker.ready;
  await waitForController();

  if (!registration.active && !registration.waiting && !registration.installing) {
    throw new Error('The PHP worker did not become active.');
  }

  status.textContent = 'Launching the PHP application.';
  window.location.replace(new URL(bootstrap.entrypointUrl.replace(/^\/+/, ''), previewRoot).href);
}

function joinUrlPath(...parts) {
  return parts
    .join('/')
    .replace(/\/{2,}/g, '/')
    .replace(/\/$/, '');
}

async function waitForController(timeoutMs = 10000) {
  if (navigator.serviceWorker.controller) {
    return;
  }

  await new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      navigator.serviceWorker.removeEventListener('controllerchange', onChange);
      reject(new Error('The PHP worker did not take control of the page in time.'));
    }, timeoutMs);

    function onChange() {
      if (!navigator.serviceWorker.controller) {
        return;
      }

      window.clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener('controllerchange', onChange);
      resolve();
    }

    navigator.serviceWorker.addEventListener('controllerchange', onChange);
  });
}
