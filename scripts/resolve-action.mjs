import { appendFileSync } from 'node:fs';

const inputAction = process.env.INPUT_ACTION || 'auto';
const eventName = process.env.GITHUB_EVENT_NAME || '';
const eventAction = process.env.GITHUB_EVENT_ACTION || '';

const autoAction = (() => {
  if (eventName !== 'pull_request') {
    return 'none';
  }

  if (['opened', 'reopened', 'synchronize'].includes(eventAction)) {
    return 'deploy';
  }

  if (eventAction === 'closed') {
    return 'remove';
  }

  return 'none';
})();

const resolvedAction = inputAction === 'auto' ? autoAction : inputAction;
const shouldBuild = resolvedAction === 'deploy';

if (!process.env.GITHUB_OUTPUT) {
  throw new Error('GITHUB_OUTPUT is required');
}

const lines = [
  `resolved-action=${resolvedAction}`,
  `should-build=${shouldBuild}`,
].join('\n');

process.stdout.write(`${lines}\n`);
appendFileSync(process.env.GITHUB_OUTPUT, `${lines}\n`);
