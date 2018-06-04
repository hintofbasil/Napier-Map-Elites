
function load_csv(text) {
  var output = {};
  text = text.split('\n').map((x) => x.split(','));
  output['dimensions'] = parseInt(text[0][1]);
  output['normalised'] = parseInt(text[1][1]);
  output['evals'] = parseInt(text[2][1]);
  output['keys'] = text[3].slice(2, 2 + output['dimensions']);
  output['data'] = {}
  var dataOffset = 2 + output['keys'].length;
  for (var line of text.slice(4)) {
    var node = {
      'distance': parseFloat(line[1]),
    }
    output['keys'].forEach((e, i) => {
      node[e] = parseFloat(line[i + dataOffset]);
    });
    output['data'][line[0]] = node;
  }
  console.log(output['data']['18:1:23:19:4']);
  return output;
};

var data;

$(document).ready(() => {
  $('#file-chooser').on('change', (e) => {
    var reader = new FileReader();
    reader.onload = () => {
      data = load_csv(reader.result);
      console.log(data);
    };
    reader.readAsText(e.target.files[0]);
  });
});
