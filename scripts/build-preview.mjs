import fs from 'node:fs';
import path from 'node:path';

const args = parseArgs(process.argv.slice(2));

const actionRoot = path.resolve(process.env.ACTION_ROOT || process.cwd());
const phpRoot = path.resolve(args['php-root'] || '.');
const documentRootInput = sanitizeRelative(args['document-root'] || '.');
const entrypoint = sanitizeRelative(args.entrypoint || 'index.php');
const outputDir = path.resolve(args['output-dir'] || './dist');

if (!fs.existsSync(phpRoot) || !fs.statSync(phpRoot).isDirectory()) {
  throw new Error(`PHP root does not exist or is not a directory: ${phpRoot}`);
}

const documentRootFs = path.resolve(phpRoot, documentRootInput);
if (!documentRootFs.startsWith(phpRoot)) {
  throw new Error(`Document root escapes the PHP root: ${documentRootInput}`);
}

if (!fs.existsSync(documentRootFs) || !fs.statSync(documentRootFs).isDirectory()) {
  throw new Error(`Document root does not exist or is not a directory: ${documentRootInput}`);
}

const entrypointFs = path.resolve(documentRootFs, entrypoint);
if (!entrypointFs.startsWith(documentRootFs) || !fs.existsSync(entrypointFs)) {
  throw new Error(`Entrypoint does not exist inside the document root: ${entrypoint}`);
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, '.nojekyll'), '');

copyTemplate(actionRoot, outputDir, 'index.html');
copyTemplate(actionRoot, outputDir, 'styles.css');

const bootstrap = {
  docroot: toPosixPath(path.posix.join('/preload/app', documentRootInput === '.' ? '' : documentRootInput)),
  entrypointUrl: toPosixPath(path.posix.join('/app', entrypoint)),
  workerPath: './cgi-worker.mjs',
};

const mainTemplate = readTemplate(actionRoot, 'main.mjs');
fs.writeFileSync(
  path.join(outputDir, 'main.mjs'),
  mainTemplate.replace('__BOOTSTRAP_JSON__', JSON.stringify(bootstrap, null, 2))
);

const workerTemplate = readTemplate(actionRoot, 'cgi-worker.mjs');
fs.writeFileSync(path.join(outputDir, 'cgi-worker.mjs'), workerTemplate);

const appSourceDir = path.join(outputDir, 'app-src');
copyDirectory(phpRoot, appSourceDir);

const manifest = buildManifest(appSourceDir);
fs.writeFileSync(path.join(outputDir, 'app-manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(
  path.join(outputDir, 'app-files.mjs'),
  `export const appFiles = ${JSON.stringify(buildWorkerFiles(manifest.files), null, 2)};\n`
);

const vendorDir = path.join(outputDir, 'vendor', 'php-cgi-wasm');
fs.mkdirSync(vendorDir, { recursive: true });
copyRuntime(actionRoot, vendorDir);

process.stdout.write(`Built preview bundle at ${outputDir}\n`);

function copyTemplate(actionRootDir, outputRoot, fileName) {
  fs.copyFileSync(
    path.join(actionRootDir, 'templates', fileName),
    path.join(outputRoot, fileName)
  );
}

function readTemplate(actionRootDir, fileName) {
  return fs.readFileSync(path.join(actionRootDir, 'templates', fileName), 'utf8');
}

function copyRuntime(actionRootDir, vendorRoot) {
  const runtimeRoot = path.join(actionRootDir, 'node_modules', 'php-cgi-wasm');
  for (const item of fs.readdirSync(runtimeRoot, { withFileTypes: true })) {
    if (!item.isFile()) {
      continue;
    }

    const source = path.join(runtimeRoot, item.name);
    fs.copyFileSync(source, path.join(vendorRoot, item.name));
  }
}

function buildManifest(rootDir) {
  const entries = [];
  walk(rootDir, (absolutePath) => {
    const relativePath = toPosixPath(path.relative(rootDir, absolutePath));
    const text = isProbablyTextFile(relativePath);
    entries.push({
      path: relativePath,
      binary: !text,
    });
  });

  return {
    generatedAt: new Date().toISOString(),
    files: entries.sort((a, b) => a.path.localeCompare(b.path)),
  };
}

function buildWorkerFiles(files) {
  return files.map((file) => {
    const pathParts = file.path.split('/');
    const name = pathParts.pop();
    const parentSegments = pathParts.length ? `/${pathParts.join('/')}` : '';

    return {
      parent: `/preload/app${parentSegments}`,
      name,
      url: `./app-src/${file.path}`,
      binary: file.binary,
    };
  });
}

function walk(currentPath, onFile) {
  const items = fs.readdirSync(currentPath, { withFileTypes: true });
  for (const item of items) {
    const absolutePath = path.join(currentPath, item.name);
    if (item.name === '.git') {
      continue;
    }

    if (item.isDirectory()) {
      walk(absolutePath, onFile);
      continue;
    }

    if (item.isFile()) {
      onFile(absolutePath);
    }
  }
}

function copyDirectory(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const item of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (item.name === '.git') {
      continue;
    }

    const sourcePath = path.join(sourceDir, item.name);
    const targetPath = path.join(targetDir, item.name);

    if (item.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    if (item.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function isProbablyTextFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return [
    '',
    '.css',
    '.csv',
    '.env',
    '.htaccess',
    '.html',
    '.ini',
    '.js',
    '.json',
    '.map',
    '.md',
    '.mjs',
    '.php',
    '.phtml',
    '.sql',
    '.svg',
    '.txt',
    '.xml',
    '.yaml',
    '.yml',
  ].includes(extension);
}

function sanitizeRelative(value) {
  const normalized = toPosixPath(path.posix.normalize(value || '.')).replace(/^\/+/, '');
  if (!normalized || normalized === '.') {
    return '.';
  }

  if (normalized === '..' || normalized.startsWith('../')) {
    throw new Error(`Path cannot escape the project root: ${value}`);
  }

  return normalized;
}

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      continue;
    }

    parsed[arg.slice(2)] = argv[index + 1];
    index += 1;
  }

  return parsed;
}
