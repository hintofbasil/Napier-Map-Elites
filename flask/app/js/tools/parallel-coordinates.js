class ParallelCoordinates {

  constructor(elementId, data, onFiltered) {
    this.data = data;
    this.onFiltered = onFiltered;
    var graph = ParCoords()(elementId)
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
