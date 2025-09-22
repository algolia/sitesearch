import { defineConfig } from 'rolldown'
import postcss from 'rollup-plugin-postcss'

export default defineConfig([
  // ES Module build with CSS extraction
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
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
    external: [
      'react',
      'react-dom',
      'algoliasearch',
      'algoliasearch/lite',
      'react-instantsearch',
      '@ai-sdk/react',
      'ai',
      'marked'
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx']
    },
  },
  // CommonJS build with CSS extraction
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      postcss({
        extract: false, // Don't extract again, rely on ESM build
        inject: false,  // Don't inject CSS into JS
        minimize: false,
      }),
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    external: [
      'react',
      'react-dom',
      'algoliasearch',
      'algoliasearch/lite',
      'react-instantsearch',
      '@ai-sdk/react',
      'ai',
      'marked'
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx']
    },
  },
  // Minified CSS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.min.js',
      format: 'esm',
      sourcemap: true,
      minify: true,
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
    external: [
      'react',
      'react-dom',
      'algoliasearch',
      'algoliasearch/lite',
      'react-instantsearch',
      '@ai-sdk/react',
      'ai',
      'marked'
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx']
    },
    treeshake: true,
  }
])