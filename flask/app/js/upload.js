var sprintf = require('sprintf-js').sprintf;

require( 'babel-polyfill' ) ;
var combinations = require('@aureooms/js-itertools/src/map/combinations.js').combinations;

var FileUploader = require('./tools/file-uploader.js');
var Heatmap = require('./heatmap/heatmap.js');

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

var RESULTS_TABLE_TEMPLATE = `
<table>
  <tr>
    <th colspan="2">%s</th>
  </tr>
  %s
</table>
`;

var RESULTS_TABLE_ROW_TEMPLATE = `
<tr>
  <td>%s</td>
  <td>%f</td>
</tr>
`;

function load_csv(text) {
  var output = {};
  text = text.split('\n').map((x) => x.split(','));
  output['dimensions'] = parseInt(text[0][1]);
  output['normalised'] = parseInt(text[1][1]);
  output['evals'] = parseInt(text[2][1]);
  output['keys'] = text[3].slice(2, 2 + output['dimensions']);
  // Min and max normalised values
  output['ranges'] = Array.from(output['keys']).map(() => [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);

  output['data'] = {}
  var dataOffset = 2 + output['keys'].length;
  var distanceRange = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (var line of text.slice(4)) {
    // Skip any invalid lines
    if (line.length <= 1) {
      console.log('Skipping line: "' + line + '"');
      continue;
    }
    var node = {
      'distance': [null, parseFloat(line[1])],
    }
    output['keys'].forEach((e, i) => {
      var normalised = parseFloat(line[i + 2]);
      node[e] = [
        normalised,
        parseFloat(line[i + dataOffset])
      ];
      // Set min and max ranges
      if (normalised < output['ranges'][i][0]) {
        output['ranges'][i][0] = normalised;
      } else if (normalised > output['ranges'][i][1]) {
        output['ranges'][i][1] = normalised;
      }
    });
    distanceRange[0] = Math.min(distanceRange[0], node['distance'][1]);
    distanceRange[1] = Math.max(distanceRange[1], node['distance'][1]);
    output['data'][line[0]] = node;
  }
  output['distanceRange'] = distanceRange;
  return output;
};

function generate_sliders(container, data, heatMaps) {
  container.empty();
  data['keys'].forEach((key, i) => {
    var range = data['ranges'][i];
    var start = Math.floor((range[1]+range[0])/2);
    var element = $(sprintf(SLIDER_TEMPLATE, key, range[0], range[1], range[1], start, range[0]));
    element.on('change', () => { slider_changed(heatMaps) } );
    container.append(element);
  });
}

function slider_changed(heatMaps) {
  var sliderContainer = $('#slider-container');
  var values = [];
  sliderContainer.children().toArray().forEach((sliderBox) => {
    var value = sliderBox.children[1].children[0].value;
    $(sliderBox).find('.slider-current').html(value);
    values.push(value);
  });
  var key = values.join(':');
  display_data(data['data'][key]);

  // Update heat maps
  for (var i=0; i<values.length; i++) {
    var k = data.keys[i];
    var v = values[i];
    for (var heatMap of heatMaps) {
      heatMap.change_highlight(k, v);
    }
  }
}

function display_data(data) {
  var container = $('#results-container');
  container.empty();
  if (!data) {
    var output = sprintf(RESULTS_TABLE_TEMPLATE, "No results found", "");
    container.append(output);
  } else {
    var rows = "";
    Object.entries(data).forEach(([key, value]) => {
      rows += sprintf(RESULTS_TABLE_ROW_TEMPLATE, key, value[1]);
    });
    var output = sprintf(RESULTS_TABLE_TEMPLATE, "Results", rows);
    container.append(output);
  }
}

function generate_heat_maps(data) {
  document.getElementById('heatmaps').innerHTML = '';
  var pairs = combinations(data.keys, 2);
  var maps = [];
  for (var pair of pairs) {
    var map = new Heatmap('heatmaps', data, pair, (e, info) => {
      console.log(info);
    });
    maps.push(map);
  }
  return maps;
}

var data;

$(document).ready(() => {
  new FileUploader('file-dropper', 'file-chooser', (text) => {
    data = load_csv(text);
    var sliderContainer = $('#slider-container');
    console.log(data);
    var heatMaps = generate_heat_maps(data);
    generate_sliders(sliderContainer, data, heatMaps);
    // Fake a slider moving to generate first set of results
    slider_changed(heatMaps);
  });
});
