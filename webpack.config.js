const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'inline-source-map', // Enable source mapping for debugging
  resolve: {
    extensions: ['.ts', '.js'], // Resolve these extensions
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html' // Path to your HTML file
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'), // Serve files from dist directory
    },
    open: true, // Automatically open the browser
    hot: true, // Enable hot module replacement
    port: 8080, // Default port for dev server
  }
};
