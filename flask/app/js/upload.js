var sprintf = require('sprintf-js').sprintf;

require( 'babel-polyfill' ) ;
var combinations = require('@aureooms/js-itertools/src/map/combinations.js').combinations;

var FileUploader = require('./tools/file-uploader.js');
var Heatmap = require('./heatmap/heatmap.js');
var ParallelCoordinates = require('./tools/parallel-coordinates.js');

var RESULTS_TEMPLATE = `
<div class="results-div">
  <div class="results-div-row">
    %s
  </div>
  <div class="results-div-row">
    %s
  </div>
  <div class="results-div-row">
    %s
  </div>
  <div class="results-div-row">
    %s
  </div>
</div>
`;

var RESULTS_ELEMENT = '<span>%s</span>';
var RESULTS_ELEMENT_BOLD = '<span class="bold">%s</span>';

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

function update_results(results) {
  var count = results.length;
  var container = $('#results-container');
  var headers = data.keys.map((key) => {
    return sprintf(RESULTS_ELEMENT_BOLD, key);
  }).join('\n');
  container.empty();
  if (count == 0) {
    var title = sprintf(RESULTS_ELEMENT_BOLD, 'No results found');
    var summary = sprintf(RESULTS_ELEMENT, '');
    var values = data.keys.map((key) => {
      return sprintf(RESULTS_ELEMENT, '-');
    }).join('\n');
    var output = sprintf(RESULTS_TEMPLATE, title, summary, headers, values);
    container.append(output);
  } else if (count > 1) {
    var title = sprintf(RESULTS_ELEMENT_BOLD, 'Too many results found');
    var summary = sprintf(RESULTS_ELEMENT, '');
    var values = data.keys.map((key) => {
      return sprintf(RESULTS_ELEMENT, '-');
    }).join('\n');
    var output = sprintf(RESULTS_TEMPLATE, title, summary, headers, values);
    container.append(output);
  } else {
    var element = results[0];
    console.log('Found result: ', element);
    var title = sprintf(RESULTS_ELEMENT_BOLD, 'Result found');
    var summary = sprintf(RESULTS_ELEMENT,
      sprintf('%s%f',
        sprintf(RESULTS_ELEMENT_BOLD, 'Distance:   '),
        element['distance'][1])
    );
    var values = data.keys.map((key) => {
      return sprintf(RESULTS_ELEMENT, element[key][1]);
    }).join('\n');
    var output = sprintf(RESULTS_TEMPLATE, title, summary, headers, values);
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

function update_heatmaps(elements) {
  for (var heatmap of heatmaps) {
    heatmap.change_highlight(elements);
  }
}

function on_result_found(elements) {
  update_results(elements);
  update_heatmaps(elements);
}

var data;
var heatmaps;

$(document).ready(() => {
  new FileUploader('file-dropper', 'file-chooser', (text) => {
    data = load_csv(text);
    var sliderContainer = $('#slider-container');
    console.log(data);
    heatmaps = generate_heat_maps(data);
    //generate_sliders(sliderContainer, data, heatMaps);
    var parallelCoordinates = new ParallelCoordinates('#parcoords', data, on_result_found);
    // Fake a slider moving to generate first set of results
    //slider_changed(heatMaps);
  });
});
