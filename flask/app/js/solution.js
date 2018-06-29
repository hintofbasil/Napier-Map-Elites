var Leaflet = require('leaflet');
var sprintf = require('sprintf-js').sprintf;

let KML = require('.././node_modules/leaflet-plugins/layer/vector/KML.js');

var BUTTON_HTML = `
  <div>%s</div>
`;

var details = {};

function add_kml_button(containerId, filename, map, color) {
  var container = document.getElementById(containerId);
  var button = document.createElement('div');
  button.setAttribute('data-enabled', 1);
  button.style['color'] = color;

  var text = document.createElement('span');
  text.innerHTML = filename;
  button.appendChild(text);

  var icon = document.createElement('img');
  icon.style['background-color'] = color;
  button.appendChild(icon);

  var inserted = false;
  for (var child of container.children) {
    if (filename < child.children[0].innerHTML) {
      container.insertBefore(button, child);
      inserted = true;
      break;
    }
  }
  if (!inserted) {
    container.append(button);
  }
  details[filename]['button'] = button;
  button.addEventListener('click', e => {
    if (button.getAttribute('data-enabled') == 1) {
      button.setAttribute('data-enabled', 0);
      hide_kml(filename, map);
    } else {
      button.setAttribute('data-enabled', 1);
      show_kml(filename, map);
    }
  });
}

function hide_kml(filename, map) {
  var kml = details[filename]['kml'];
  map.removeLayer(kml);
}

function show_kml(filename, map) {
  var kml = details[filename]['kml'];
  map.addLayer(kml);
}

function add_kml(solution_hash, solution_key, filename, map) {
  var url = sprintf('/solution_kmls/%s/%s/%s', solution_hash, solution_key, filename);

  var kml = new Leaflet.KML(url, {async: true});

  kml.on('loaded', e => {
    var bounds = map.bounded ?
      e.target.getBounds().extend(map.getBounds()) :
      e.target.getBounds();
    map.bounded = true;
    map.fitBounds(bounds);

    var color = function(){
      for (var obj of Object.values(e.target._layers)) {
        if (obj.options && obj.options.color) {
          return obj.options.color;
        }
      }
      return "#3388ff";
    }();

    // Add button to DOM
    add_kml_button('map-toggles-container',
      filename,
      map,
      color);
  });

  details[filename]['kml'] = kml;
  map.addLayer(kml);
}

function fetch_kml_list(solution_hash, solution_key, map) {

  fetch(sprintf('/solution_kmls/%s/%s', solution_hash, solution_key))
  .then(
    response => {
      if (response.status !== 200) {
        console.error('Error response from ' + response.url + '  Reponse code ' + response.status);
        return;
      }
      response.json().then(data => {
        for (var filename of data) {
          details[filename] = {};
          add_kml(solution_hash,
            solution_key,
            filename,
            map);
        }
      });
    });

}

document.addEventListener('DOMContentLoaded', () => {
  var map = Leaflet.map('map').setView([51.505, -0.09], 13);

   Leaflet.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 18
 }).addTo(map);

  var solution_hash = document.querySelector('[data-solution-hash]').getAttribute('data-solution-hash');
  var solution_key = document.querySelector('[data-solution-key]').getAttribute('data-solution-key');

  fetch_kml_list(solution_hash, solution_key, map);
});
