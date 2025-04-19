const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background/service-worker.js',
    content: './src/content/content-analyzer.js',
    popup: './src/popup/popup.js',
    devtools: './src/devtools/devtools.js',
    panel: './src/devtools/panel.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]/[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'assets/icons/*.png', to: 'assets/icons/[name][ext]' },
        { from: 'src/popup/popup.html', to: 'popup/popup.html' },
        { from: 'src/popup/popup.css', to: 'popup/popup.css' },
        { from: 'src/devtools/devtools.html', to: 'devtools/devtools.html' },
        { from: 'src/devtools/panel.html', to: 'devtools/panel.html' },
        { from: 'src/devtools/panel.css', to: 'devtools/panel.css' }
      ]
    }),
    new HtmlWebpackPlugin({
      template: './src/popup/popup.html',
      filename: 'popup/popup.html',
      chunks: ['popup']
    }),
    new HtmlWebpackPlugin({
      template: './src/devtools/devtools.html',
      filename: 'devtools/devtools.html',
      chunks: ['devtools']
    }),
    new HtmlWebpackPlugin({
      template: './src/devtools/panel.html',
      filename: 'devtools/panel.html',
      chunks: ['panel']
    })
  ]
};
