// Builds the publishable package into dist-lib/:
//   JS   one ES module per source file (vite.lib.config.ts) → import { Button } from '@nui3/react/actions'
//   d.ts tsc declarations next to each module
//   CSS  src/nui3/css copied as-is: full bundle, embeddable bundle, per-group files, Tailwind entry
//   package.json with an exports map, sideEffects limited to CSS, React as peer dependency
import { execSync } from 'node:child_process'
import { cpSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'dist-lib')
const run = (cmd) => execSync(cmd, { cwd: root, stdio: 'inherit' })

run('node scripts/build-tokens.mjs')
run('npx vite build --config vite.lib.config.ts --logLevel warn')
run('npx tsc -p tsconfig.lib.json')
cpSync(join(root, 'src/nui3/css'), join(out, 'css'), { recursive: true })

const app = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const groups = ['foundation', 'actions', 'forms', 'navigation', 'surfaces', 'overlays', 'zcash', 'defi', 'trading', 'charts', 'data', 'prediction', 'content', 'payments']
// Entry chunks are emitted at the top level (actions.js); declarations mirror the source tree.
const sub = (name, file) => ({ [`./${name}`]: { types: `./${file}.d.ts`, import: `./${name}.js` } })
const exportsMap = {
  '.': { types: './index.d.ts', import: './index.js' },
  ...Object.assign({}, ...groups.map((g) => sub(g, `components/${g}/index`))),
  ...sub('icons', 'icons/index'),
  ...sub('theme', 'theme/index'),
  ...sub('i18n', 'i18n/index'),
  ...sub('utils', 'utils/index'),
  './css': './css/nui3.css',
  './css/components': './css/components.css',
  './css/tokens': './css/tokens.css',
  './css/tailwind': './css/tailwind.css',
  './css/*': './css/*',
}
const pkg = {
  name: '@nui3/react',
  version: app.version,
  type: 'module',
  sideEffects: ['**/*.css'],
  exports: exportsMap,
  peerDependencies: { react: '>=19', 'react-dom': '>=19', tailwindcss: '>=4' },
  peerDependenciesMeta: { tailwindcss: { optional: true } },
  dependencies: Object.fromEntries(
    Object.entries(app.dependencies).filter(([k]) => k !== 'react' && k !== 'react-dom'),
  ),
}
writeFileSync(join(out, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
console.log(`dist-lib: ${Object.keys(exportsMap).length} export paths`)
