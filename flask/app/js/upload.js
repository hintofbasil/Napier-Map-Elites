var sprintf = require('sprintf-js').sprintf;
var md5sum = require('md5');

require( 'babel-polyfill' ) ;
var combinations = require('@aureooms/js-itertools/src/map/combinations.js').combinations;

var FileUploader = require('./tools/file-uploader.js');
var Heatmap = require('./heatmap/heatmap.js');
var ParallelCoordinates = require('./tools/parallel-coordinates.js');

var DETAILS_TEMPLATE = `
<div id="details">
  <div class="details-evals">Evaluations: %d</div>
  <div class="details-filename">%s</div>
  <div class="reset-container">
    <div class="whole column" id="heatmaps-dropdown-container">
      <div id="heatmaps-dropdown-container" class="dropdown-container">
        <select id="heatmaps-dropdown">
          <option value="average">Average</option>
          <option value="best">Best</option>
        </select>
      </div>
    <img id="pc-refresh" src="/static/images/refresh.svg" />
  </div>
</div>
`;

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
  <div class="results-div-row">
    %s
  </div>
</div>
`;

var RESULTS_ELEMENT = '<span>%s</span>';
var RESULTS_ELEMENT_BOLD = '<span class="bold">%s</span>';

var RESULTS_LINK_TEMPLATE = `
<a href="/solution/%s/%s" target="_blank">
  View details
  <i class="material-icons">open_in_new</i>
</a>
`;

var RESULT_SOLUTIONS_MISSING_TEMPLATE = `
Solutions file missing.  Please upload.
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
    var solution_link = data.solutions ?
      '<span></span>' :
      sprintf(RESULT_SOLUTIONS_MISSING_TEMPLATE);
    var output = sprintf(RESULTS_TEMPLATE, title, solution_link, summary, headers, values);
    container.append(output);
  } else if (count > 1) {
    var title = sprintf(RESULTS_ELEMENT_BOLD, 'Too many results found');
    var summary = sprintf(RESULTS_ELEMENT, '');
    var values = data.keys.map((key) => {
      return sprintf(RESULTS_ELEMENT, '-');
    }).join('\n');
    var solution_link = data.solutions ?
      '<span></span>' :
      sprintf(RESULT_SOLUTIONS_MISSING_TEMPLATE);
    var output = sprintf(RESULTS_TEMPLATE, title, solution_link, summary, headers, values);
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
    var key = Object.values(element).map((v) => {
      return v[0];
    }).filter((v) => {
      return v !== null;
    }).join("_");
    var solution_link = data.solutions ?
      sprintf(RESULTS_LINK_TEMPLATE, data.hash, key) :
      sprintf(RESULT_SOLUTIONS_MISSING_TEMPLATE);
    var output = sprintf(RESULTS_TEMPLATE, title, solution_link, summary, headers, values);
    container.append(output);
  }
}

function generate_heat_maps(data) {
  document.getElementById('heatmaps').innerHTML = '';
  var pairs = combinations(data.keys, 2);
  var maps = [];
  for (var pair of pairs) {
    var map = new Heatmap('heatmaps', data, pair, 'average', (e, info) => {
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

function generate_display(data, filename, heatmaps) {
  var container = document.getElementById('details-container');
  container.innerHTML = sprintf(DETAILS_TEMPLATE, data.evals, filename);
  var heatmapsDropdown = document.getElementById('heatmaps-dropdown');
  heatmapsDropdown.addEventListener('change', (e) => {
    for (var heatmap of heatmaps) {
      heatmap.change_colouring_method(e.target.value);
    }
  });
}

function load_solution_details(text) {
  data.hash = md5sum(text);
  var url = sprintf('/solution/%s', data.hash);
  fetch(url)
  .then(
    response => {
      if (response.status === 200) {
        data.solutions = true;
        console.log('Found solutions file for ' + data.hash);
      } else if (response.status === 404) {
        data.solutions = false;
        add_solution_uploader(data.hash);
        console.log('No solutions file for ' + data.hash);
      } else {
        console.error('Invalid response code (' + response.status + ') from ' + url);
      }
    });
}

function add_solution_uploader(filehash) {
  new FileUploader('form',
    {
      containerId: 'solutions-upload-container',
      url: '/solutions/upload',
      filename: filehash + '.zip',
      allowedFiles: '.zip',
    }, (text, filename) => {
    console.log(text, filename);
  });
}

var data;
var heatmaps;

$(document).ready(() => {
  new FileUploader('local',
    {
      containerId: 'csv-upload-container',
      allowedFiles: '.csv',
    }, (text, filename) => {
    data = load_csv(text);
    var sliderContainer = $('#slider-container');
    load_solution_details(text);
    console.log(data);
    heatmaps = generate_heat_maps(data);
    generate_display(data, filename, heatmaps);
    var parallelCoordinates = new ParallelCoordinates('#parcoords', 'pc-refresh', data, on_result_found);
    // Create results table.  Any input with length > 1 results in too many
    // results message
    update_results([1,1]);
  });
});
