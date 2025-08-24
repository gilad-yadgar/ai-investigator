import path from 'path';
import webpack from 'webpack';
import 'webpack-dev-server';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const config: webpack.Configuration = {
  context: path.resolve(__dirname, 'src'),
  entry: './game.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[chunkhash].js',
    clean: true
  },
  module: {
    rules: [
      { test: /\.ts$/, include: path.resolve(__dirname, 'src'), loader: 'ts-loader' },
      { test: /\.css$/i, use: ['style-loader', 'css-loader'] }
    ]
  },
  devServer: { 
    static: path.join(__dirname, 'dist'), 
    port: 8081, 
    open: true,
    client: {
      logging: 'info',
    },
  },
  resolve: { 
    extensions: ['.ts', '.js'],
    fallback: {
      "fs": false,
      "path": false,
      "os": false,
      "crypto": false,
      "buffer": false,
      "stream": false,
      "util": false,
      "url": false,
      "querystring": false,
      "http": false,
      "https": false,
      "zlib": false,
      "net": false,
      "tls": false,
      "child_process": false
    }
  },
  plugins: [
    new CopyWebpackPlugin({ patterns: [{ from: 'assets', to: 'assets', noErrorOnMissing: true }] }),
    new HtmlWebpackPlugin({ template: path.resolve(__dirname, 'src/index.html'), title: 'Investigator Dialog' }),
    new webpack.NormalModuleReplacementPlugin(
      /^node:/,
      (resource) => {
        const mod = resource.request.replace(/^node:/, '');
        switch (mod) {
          case 'fs':
          case 'path':
          case 'os':
          case 'crypto':
          case 'buffer':
          case 'stream':
          case 'util':
          case 'url':
          case 'querystring':
          case 'http':
          case 'https':
          case 'zlib':
          case 'net':
          case 'tls':
          case 'child_process':
            resource.request = require.resolve('./empty-module.js');
            break;
          default:
            throw new Error(`Cannot resolve node: module '${mod}'`);
        }
      }
    )
  ]
};
export default config;
