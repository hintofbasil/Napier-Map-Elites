var Leaflet = require('leaflet');

document.addEventListener('DOMContentLoaded', () => {
  var map = Leaflet.map('map').setView([51.505, -0.09], 13);

   Leaflet.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 18
 }).addTo(map);
});
