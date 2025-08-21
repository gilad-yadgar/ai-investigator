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
  devServer: { static: path.join(__dirname, 'dist'), port: 8081, open: true },
  resolve: { extensions: ['.ts', '.js'] },
  plugins: [
    new CopyWebpackPlugin({ patterns: [{ from: 'assets', to: 'assets', noErrorOnMissing: true }] }),
    new HtmlWebpackPlugin({ template: path.resolve(__dirname, 'src/index.html'), title: 'Investigator Dialog' })
  ]
};
export default config;
