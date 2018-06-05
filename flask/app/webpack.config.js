const glob = require('glob');
const path = require('path');

var files = glob.sync('./js/*.js').reduce(function(result, item) {
  var name = path.basename(item, path.extname(item));
  result[name] = item;
  return result;
}, {});

module.exports = {
  mode: 'development',
  entry: files,
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'static/js')
  }
};
