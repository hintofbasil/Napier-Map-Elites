require('d3-scale');

class ParallelCoordinates {

  constructor(elementId, data, onFiltered) {

    var scale = d3.scaleLinear()
        .domain([data.distanceRange[1], data.distanceRange[0]])
        .range([0,1]);

    var color = d => {
      //var value = 0.4;
      var key = d.join(':');
      var distance = this.data.data[key].distance[1];
      var value = scale(distance);

      //value from 0 to 1
      var hue=((1-value)*120).toString(10);
      return ["hsl(",hue,",100%,50%)"].join("");
    }

    this.data = data;
    this.onFiltered = onFiltered;
    var graph = ParCoords()(elementId)
      .color(color)
      .data(this.get_data())
      .dimensions(this.get_dimensions())
      .render()
      .shadows()
      .createAxes()
      .brushMode('1D-points');
    graph.on('brush', (filtered) => {
      var elements = filtered.map((l) => { return this.data.data[l.join(':')]; } );
      this.onFiltered(elements);
    });
  }

  get_data() {
    return Object.values(this.data.data).map((element) => {
      return this.data.keys.map((key) => {
        return element[key][0];
      });
    });
  }

  get_dimensions() {
    return this.data.keys.reduce((obj, key, index) => {
      obj[index] = {
        'title': key,
      };
      return obj;
    }, {});
  }

}

module.exports = ParallelCoordinates;
