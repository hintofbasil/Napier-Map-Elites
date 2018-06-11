class ParallelCoordinates {

  constructor(elementId, data) {
    this.data = data;
    var graph = ParCoords()(elementId)
      .data(this.get_data())
      .dimensions(this.get_dimensions())
      .render()
      .createAxes();
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
