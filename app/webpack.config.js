const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    library: 'app',
    filename: 'index.js',
    path: path.resolve(__dirname, '../public/assets/js/app'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
          test: /\.wgsl$/,
          use: {
              loader: "ts-shader-loader"
          }
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  devtool: 'source-map',
  devServer: {
    static: '../public',
    compress: true,
    port: 9000,
  },
};