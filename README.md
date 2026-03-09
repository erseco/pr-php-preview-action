# PHP Wasm PR Preview Action

Reusable GitHub Action that builds and publishes pull request previews for generic PHP repositories with `php-cgi-wasm` and `rossjrw/pr-preview-action`.

## What it does

- Copies a PHP project into a static preview bundle.
- Boots `php-cgi-wasm` inside a Service Worker.
- Publishes the preview to GitHub Pages.
- Leaves a sticky comment on the pull request with the preview URL.
- Removes the preview when the pull request is closed.

Preview URLs follow the same shape as `rossjrw/pr-preview-action`, for example:

`https://owner.github.io/repo/pr-preview/pr-123/`

## Quick example

This repository includes [`example-app`](./example-app), a small PHP demo rendered entirely inside the browser. The workflow at [`./.github/workflows/demo-preview.yml`](./.github/workflows/demo-preview.yml) uses `uses: ./` so opening a PR against this repo will publish the demo as a real preview.

## Usage

```yaml
name: Deploy PHP PR preview

on:
  pull_request:
    types: [opened, reopened, synchronize, closed]

concurrency: preview-${{ github.ref }}

permissions:
  contents: write
  pull-requests: write

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: your-org/pr-php-preview-action@v1
        with:
          php-root: .
          document-root: public
          entrypoint: index.php
```

## Inputs

- `php-root`: project root to package. Default `.`.
- `document-root`: public document root inside `php-root`. Default `.`.
- `entrypoint`: entrypoint inside `document-root`. Default `index.php`.
- `prepare-command`: optional shell command run before packaging.
- `preview-branch`: Pages branch. Default `gh-pages`.
- `umbrella-dir`: previews namespace. Default `pr-preview`.
- `pages-base-url`: optional explicit Pages base URL.
- `pages-base-path`: subdirectory served by Pages. Default `.`.
- `comment`: leave sticky PR comment. Default `true`.
- `token`: auth token for deployment. Default `${{ github.token }}`.
- `action`: `auto`, `deploy`, `remove`, `none`. Default `auto`.

## Outputs

- `preview-url`
- `preview-url-path`
- `deployment-action`
- `dist-dir`

## Notes

- This action currently depends on GitHub Pages being configured to deploy from a branch.
- Repository Actions permissions must allow read and write access.
- Pull requests from forks are not supported by `rossjrw/pr-preview-action@v1`.
- This is a pragmatic fit for generic PHP apps, demos and tools. It does not emulate a full Linux/PHP-FPM environment.
