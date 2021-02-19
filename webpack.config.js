const path = require('path');
const process = require('process');

const mode = process.env["VOS_DEV"] ? 'development' : 'production'

module.exports = {
  entry: './web-resources/index.ts',
  mode,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: [/node_modules/],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.css'],
  },
  output: {
    filename: 'vos.js',
    path: path.resolve(__dirname, 'docs/web-resources'),
  },
};