const { format } =  process.env
import uglify from 'rollup-plugin-uglify';

const plugins = []

if (format === 'iife') plugins.push(uglify())
export default {
  input: 'index.js',
  plugins: [...plugins],
  output: {
    file: `dist/thin-promise.${format}.js`,
    format,
    name: format === 'iife' && 'ThinPromise'
  }
}
