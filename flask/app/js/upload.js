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
      <i id="solution-upload-toggle" class="material-icons">cloud_upload</i>
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
<span class="solutions-missing-results-text">Solutions file missing.  Please upload.</span>
`;

var CSV_PARSE_ERROR_MESSAGE_CELL_NO = "Unable to parse CSV file.  %s on line %d cell %d";
var CSV_PARSE_ERROR_MESSAGE = "Unable to parse CSV file.  %s on line %d";

function load_csv(text) {
  // Loads the CSV file.
  // Throws line number on error.
  var output = {};
  text = text.split('\n').map((x) => x.split(','));
  ['dimensions', 'normalised', 'evals'].forEach((key, i) => {
    if(!(text[i][0].toLowerCase() === key)) {
      throw sprintf(CSV_PARSE_ERROR_MESSAGE_CELL_NO, 'Invalid key', i + 1, 1);
    }
    try {
      var value = parseInt(text[0][1]);
    } catch (err) {
      throw sprintf(CSV_PARSE_ERROR_MESSAGE_CELL_NO, 'Invalid number', i + 1, 2);
    }
    if (!value) {
      throw sprintf(CSV_PARSE_ERROR_MESSAGE_CELL_NO, 'Invalid number', i + 1, 2);
    }
    output[key] = value;
  });
  let required_keys = text[3].slice(0, 2);
  if (!(required_keys[0].toLowerCase() === 'key')) {
      throw sprintf(CSV_PARSE_ERROR_MESSAGE_CELL_NO, 'Invalid header, should be "key"', 4, 1);
  }
  if (!(required_keys[1].toLowerCase() === 'dist')) {
      throw sprintf(CSV_PARSE_ERROR_MESSAGE_CELL_NO, 'Invalid header, should be "dist"', 4, 1);
  }
  output['keys'] = text[3].slice(2, 2 + output['dimensions']);
  let all_headers = text[3].slice(2, 2 + (output['dimensions'] * 2));
  if (all_headers.length != output['dimensions'] * 2) {
    throw sprintf(CSV_PARSE_ERROR_MESSAGE, 'Incorrect number of headers, should be ' + output['dimensions'] * 2 + ' -', 4);
  }
  // Min and max normalised values
  output['ranges'] = Array.from(output['keys']).map(() => [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);

  output['data'] = {}
  var dataOffset = 2 + output['keys'].length;
  var distanceRange = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
  let lines = text.slice(4).filter(line => {
    return line != "";
  });
  if (lines.length === 0) {
      throw sprintf(CSV_PARSE_ERROR_MESSAGE, 'CSV contains no data', 5);
  }
  lines.forEach((line, line_no) => {
    // Started reading from line 5;
    line_no = line_no + 5;
    let key = line[0];
    if (key.split(':').length !== output['dimensions']) {
      throw sprintf(CSV_PARSE_ERROR_MESSAGE_CELL_NO, 'Incorrect key length', line_no, 1);
    }
    if (!parseFloat(line[1])) {
      throw sprintf(CSV_PARSE_ERROR_MESSAGE_CELL_NO, 'Invalid float', line_no, 2);
    }
    var node = {
      'distance': [null, parseFloat(line[1])],
    }
    output['keys'].forEach((e, i) => {
      var normalised = parseFloat(line[i + 2]);
      if (!normalised) {
        throw sprintf(CSV_PARSE_ERROR_MESSAGE_CELL_NO, 'Invalid float', line_no, i + 3);
      }
      var actual = parseFloat(line[i + dataOffset]);
      if (!actual) {
        throw sprintf(CSV_PARSE_ERROR_MESSAGE_CELL_NO, 'Invalid float', line_no, i + dataOffset + 1);
      }
      node[e] = [
        normalised,
        actual
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
  });
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
    var title = sprintf(RESULTS_ELEMENT_BOLD, '&nbsp;');
    var summary = sprintf(RESULTS_ELEMENT, '');
    var values = data.keys.map((key) => {
      return sprintf(RESULTS_ELEMENT, '-');
    }).join('\n');
    var solution_link = data.solutions === false ?
      sprintf(RESULT_SOLUTIONS_MISSING_TEMPLATE) :
      '<span></span>';
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
  document.getElementById('solution-upload-toggle').addEventListener('click', e => {
    toggle_solution_uploader();
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
        update_results([1,1]);
        add_solution_uploader(data.hash);
        console.log('No solutions file for ' + data.hash);
      } else {
        console.error('Invalid response code (' + response.status + ') from ' + url);
      }
    });
}

function toggle_solution_uploader() {
  if (document.getElementById('solutions-upload-header').innerHTML !== '') {
    remove_solution_uploader();
  } else {
    add_solution_uploader(data.hash);
  }
}

function remove_solution_uploader() {
  ['solutions-upload-header', 'solutions-upload-container'].forEach(id => {
    document.getElementById(id).innerHTML = '';
  });
}

function add_solution_uploader(filehash) {
  document.getElementById('solutions-upload-header').innerHTML = data.solutions ? 'Update solutions file' : 'Add solutions file';
  new FileUploader('form',
    {
      containerId: 'solutions-upload-container',
      url: '/solutions/upload/' + filehash + '.zip',
      allowedFiles: '.zip',
      presend: () => {
        return new Promise((resolve, reject) => {
          let xhr = new XMLHttpRequest();

          xhr.onload = () => resolve(xhr.responseText);
          xhr.onerror = () => reject(xhr.responseText);

          xhr.addEventListener('readystatechange', e => {
            if (xhr.readyState === 4) {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.responseText);
              } else {
                reject([xhr.status, xhr.response]);
              }
            }
          });

          xhr.open('POST', '/solutions/lock/' + filehash + '.zip');
          xhr.send();
        });
      },
    }, (text, filename) => {
      remove_solution_uploader()
      document.getElementsByClassName('solutions-missing-results-text')[0].innerHTML = "";
      data.solutions = true;
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
