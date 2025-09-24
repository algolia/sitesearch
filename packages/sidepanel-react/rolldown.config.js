import { defineConfig } from 'rolldown'
import { dts } from 'rolldown-plugin-dts'
import postcss from 'rollup-plugin-postcss'

export default defineConfig([
  // ESM build with CSS extraction
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      postcss({
        extract: 'sidepanel.css',
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
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx']
    },
  },
  // DTS build (ESM output requires output.dir)
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      dts({
        tsconfig: 'tsconfig.json',
        sourcemap: true,
      }),
    ],
    external: [
      'react',
      'react-dom',
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx']
    },
  },
  // CJS build without re-extracting CSS
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      postcss({
        extract: false,
        inject: false,
        minimize: false,
      }),
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    external: [
      'react',
      'react-dom',
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
        extract: 'sidepanel.min.css',
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
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx']
    },
    treeshake: true,
  }
])

