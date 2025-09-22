import { defineConfig } from 'rolldown'
import postcss from 'rollup-plugin-postcss'

export default defineConfig([
  // Main UMD bundle for CDN usage
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      entryFileNames: 'sitesearch.js',
      format: 'umd',
      name: 'SiteSearch',
      sourcemap: true,
    },
    plugins: [
      postcss({
        extract: 'sitesearch.css',
        minimize: false,
        sourceMap: true,
      }),
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    external: [], // Bundle everything for CDN usage
    resolve: {
      alias: {
        'react': 'preact/compat',
        'react-dom': 'preact/compat',
      },
    },
  },
  // Minified version
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      entryFileNames: 'sitesearch.min.js',
      format: 'umd',
      name: 'SiteSearch',
      sourcemap: true,
      minify: true, // Rolldown has built-in minification
    },
    plugins: [
      postcss({
        extract: 'sitesearch.min.css',
        minimize: true,
        sourceMap: true,
      }),
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    external: [],
    treeshake: true,
    resolve: {
      alias: {
        'react': 'preact/compat',
        'react-dom': 'preact/compat',
      },
    },
  },
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      entryFileNames: 'sitesearch.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      postcss({
        extract: false, // Don't extract CSS for ESM build
        inject: true,   // Inject CSS into JS for module users
      }),
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    external: [],
    resolve: {
      alias: {
        'react': 'preact/compat',
        'react-dom': 'preact/compat',
      },
    },
  },
]);