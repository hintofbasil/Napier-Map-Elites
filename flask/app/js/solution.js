var Leaflet = require('leaflet');
var sprintf = require('sprintf-js').sprintf;

let KML = require('.././node_modules/leaflet-plugins/layer/vector/KML.js');

function add_kml(solution_hash, solution_key, filename, map) {
  var url = sprintf('/solution_kmls/%s/%s/%s', solution_hash, solution_key, filename);

  var kml = new Leaflet.KML(url, {async: true});

  kml.on('loaded', e => {
    var bounds = map.bounded ?
      e.target.getBounds().extend(map.getBounds()) :
      e.target.getBounds();
    map.bounded = true;
    map.fitBounds(bounds);
  });

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
