var sprintf = require('sprintf-js').sprintf;

var SLIDER_TEMPLATE = `
<div class="slider-box">
  <h3>%s</h3>
  <div>
    <input class="filter-slider" type="range" min=%d max=%d orient=vertical />
    <span class="slider-max">%d</span>
    <span class="slider-current">%d</span>
    <span class="slider-min">%d</span>
  </div>
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
    var start = Math.floor((range[1]+range[0])/2);
    var element = $(sprintf(SLIDER_TEMPLATE, key, range[0], range[1], range[1], start, range[0]));
    element.on('change', slider_changed);
    container.append(element);
  });
}

function slider_changed() {
  var sliderContainer = $('#slider-container');
  var values = [];
  sliderContainer.children().toArray().forEach((sliderBox) => {
    var value = sliderBox.children[1].children[0].value;
    $(sliderBox).find('.slider-current').html(value);
    values.push(value);
  });
  var key = values.join(':');
  display_data(data['data'][key]);
}

function display_data(data) {
  var container = $('#results-container');
  container.empty();
  if (!data) {
    var output = "<h3>No results found</h3>";
    container.append(output);
  } else {
    var output = "<h3>Results</h3>";
    Object.entries(data).forEach(([key, value]) => {
      output += sprintf("\n<p>%s: %f</p>", key, value);
    });
    container.append(output);
  }
}

var data;

$(document).ready(() => {
  $('#file-chooser').on('change', (e) => {
    var reader = new FileReader();
    reader.onload = () => {
      data = load_csv(reader.result);
      var sliderContainer = $('#slider-container');
      generate_sliders(sliderContainer, data);
      // Fake a slider moving to generate first set of results
      slider_changed();
    };
    reader.readAsText(e.target.files[0]);
  });
});