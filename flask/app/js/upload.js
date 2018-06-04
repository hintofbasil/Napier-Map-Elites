var sprintf = require('sprintf-js').sprintf;

var SLIDER_TEMPLATE = `
<div class="slider-box">
  <h3>%s</h3>
  <input class="filter-slider" type="range" min=%d max=%d />
</div>
`;

function load_csv(text) {
  var output = {};
  text = text.split('\n').map((x) => x.split(','));
  output['dimensions'] = parseInt(text[0][1]);
  output['normalised'] = parseInt(text[1][1]);
  output['evals'] = parseInt(text[2][1]);
  output['keys'] = text[3].slice(2, 2 + output['dimensions']);
  // Min and max normalised values
  output['ranges'] = Array.from(output['keys']).map(() => [0, 0]);

  output['data'] = {}
  var dataOffset = 2 + output['keys'].length;
  for (var line of text.slice(4)) {
    var node = {
      'distance': parseFloat(line[1]),
    }
    output['keys'].forEach((e, i) => {
      node[e] = parseFloat(line[i + dataOffset]);
      var normalised = parseFloat(line[i + 2]);
      // Set min and max ranges
      if (normalised < output['ranges'][i][0]) {
        output['ranges'][i][0] = normalised;
      } else if (normalised > output['ranges'][i][1]) {
        output['ranges'][i][1] = normalised;
      }
    });
    output['data'][line[0]] = node;
  }
  return output;
};

function generate_sliders(container, data) {
  container.empty();
  data['keys'].forEach((key, i) => {
    var range = data['ranges'][i];
    var element = sprintf(SLIDER_TEMPLATE, key, range[0], range[1]);
    container.append(element);
  });
}

var data;

$(document).ready(() => {
  $('#file-chooser').on('change', (e) => {
    var reader = new FileReader();
    reader.onload = () => {
      data = load_csv(reader.result);
      var sliderContainer = $('#slider-container');
      generate_sliders(sliderContainer, data);
      console.log(data);
    };
    reader.readAsText(e.target.files[0]);
  });
});
