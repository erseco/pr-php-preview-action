import { PhpCgiWorker } from './vendor/php-cgi-wasm/PhpCgiWorker.mjs';
import { appFiles } from './app-files.mjs';

const serviceWorkerUrl = new URL(self.location.href);
const prefix = serviceWorkerUrl.searchParams.get('prefix') || '/app';
const docroot = serviceWorkerUrl.searchParams.get('docroot') || '/preload/app';

const php = new PhpCgiWorker({
  prefix,
  docroot,
  locateFile: (filename) => new URL(`./vendor/php-cgi-wasm/${filename}`, serviceWorkerUrl).href,
  types: {
    avif: 'image/avif',
    css: 'text/css',
    gif: 'image/gif',
    ico: 'image/x-icon',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    js: 'application/javascript',
    json: 'application/json',
    png: 'image/png',
    svg: 'image/svg+xml',
    txt: 'text/plain',
    webp: 'image/webp',
    xml: 'application/xml'
  }
});

const hydrateApp = once(async () => {
  const binary = await php.binary;
  const directories = new Set(['/preload', '/preload/app']);

  for (const file of appFiles) {
    directories.add(file.parent);
  }

  for (const directory of Array.from(directories).sort((left, right) => left.length - right.length)) {
    if (!binary.FS.analyzePath(directory).exists) {
      binary.FS.mkdir(directory);
    }
  }

  for (const file of appFiles) {
    const response = await fetch(new URL(file.url, serviceWorkerUrl));
    if (!response.ok) {
      throw new Error(`Unable to preload ${file.url}: ${response.status}`);
    }

    const targetPath = `${file.parent}/${file.name}`;
    if (file.binary) {
      binary.FS.writeFile(targetPath, new Uint8Array(await response.arrayBuffer()));
    } else {
      binary.FS.writeFile(targetPath, await response.text(), { encoding: 'utf8' });
    }
  }
});

const request = php.request.bind(php);
php.request = async (...args) => {
  await hydrateApp();
  return request(...args);
};

self.addEventListener('install', (event) => php.handleInstallEvent(event));
self.addEventListener('activate', (event) => php.handleActivateEvent(event));
self.addEventListener('fetch', (event) => php.handleFetchEvent(event));
self.addEventListener('message', (event) => php.handleMessageEvent(event));

function once(callback) {
  let pending;
  return () => {
    if (!pending) {
      pending = callback();
    }

    return pending;
  };
}
