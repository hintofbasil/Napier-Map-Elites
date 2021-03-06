const glob = require('glob');
const path = require('path');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const devMode = process.env.NODE_ENV !== 'production'

var files = glob.sync('./js/*.js').reduce(function(result, item) {
  var name = path.basename(item);
  result['js/' + name] = item;
  return result;
}, {});

var files = glob.sync('./sass/*.scss').reduce(function(result, item) {
  var name = path.basename(item, path.extname(item));
  result['css/' + name] = item;
  return result;
}, files);

module.exports = {
  mode: 'development',
  entry: files,
  output: {
    filename: '[name]',
    path: path.resolve(__dirname, 'static')
  },

  devtool: 'source-map',

  // Sass
  module: {
    rules: [{
      test: /\.scss$/,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader',
        'sass-loader'
      ]
    },
    {
      test: /\.(eot|woff|ttf|woff2)$/,
      use: [{
        loader: 'url-loader',
        options: {
          name: '[name].[ext]'
        }
      }]
    }]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css"
    })
  ]
};
