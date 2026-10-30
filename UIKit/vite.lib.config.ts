// Library build for on-demand loading: one ES module per source file (preserveModules), one entry per group,
// no CSS in JS, React and other deps external. Bundlers tree-shake down to the components an app imports.
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export const GROUPS = ['foundation', 'actions', 'forms', 'navigation', 'surfaces', 'overlays', 'zcash', 'defi', 'trading', 'charts', 'data', 'prediction', 'content', 'payments'] as const

const entry: Record<string, string> = {
  index: 'src/nui3/index.ts',
  icons: 'src/nui3/icons/index.tsx',
  theme: 'src/nui3/theme/index.ts',
  i18n: 'src/nui3/i18n/index.ts',
  utils: 'src/nui3/utils/index.ts',
}
for (const g of GROUPS) entry[g] = `src/nui3/components/${g}/index.${g === 'foundation' ? 'tsx' : 'ts'}`

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-lib',
    emptyOutDir: true,
    copyPublicDir: false,
    minify: false,
    sourcemap: true,
    lib: { entry, formats: ['es'] },
    rolldownOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^@floating-ui\//, 'qrcode-generator'],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src/nui3',
        entryFileNames: '[name].js',
      },
    },
  },
})
