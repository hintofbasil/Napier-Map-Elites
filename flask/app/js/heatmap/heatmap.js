class Heatmap {
  constructor(elementId, data, keys, myKeys, callback) {
    this.container = document.getElementById(elementId);
    this.data = data;
    this.keys = keys;
    this.myKeys = myKeys;
    this.callback = callback;
    this.create_map();
  }

  create_map() {
    var base = document.createElement("div");
    var table = document.createElement("table");
    table.className = "heatmap-table";
    base.appendChild(table);
    var dimensions = this.get_map_dimensions();
    var values = this.get_map_values();
    for (var i=0; i<=(dimensions[3] - dimensions[1]); i++) {
      var row = document.createElement("tr");
      for (var j=0; j<=(dimensions[2] - dimensions[0]); j++) {
        var cell = document.createElement("td");
        cell.className = values[i][j] === true ? "heat-map-found" : "heat-map-not-found";
        row.appendChild(cell);
      }
      table.appendChild(row);
    }
    this.container.appendChild(base);
  }

  get_map_values() {
    var dimensions = this.get_map_dimensions();
    var values = this.create_matrix(
      dimensions[2] - dimensions[0],
      dimensions[3] - dimensions[1]
    );
    for (var key in this.data.data) {
      var entry = this.data.data[key];
      var x = entry[this.myKeys[0]][0];
      var y = entry[this.myKeys[1]][0];
      // Align with start of array
      x = x - dimensions[0];
      y = y - dimensions[1];
      // Invert y axis
      y = (dimensions[3] - dimensions[1]) - y;
      values[y][x] = true;
    }
    return values;
  }

  // Taken from https://stackoverflow.com/a/966938
  create_matrix(length) {
    var arr = new Array(length || 0),
      i = length;

    if (arguments.length > 1) {
      var args = Array.prototype.slice.call(arguments, 1);
      while(i--) arr[length-1 - i] = this.create_matrix.apply(this, args);
    }

    return arr;
  }

  get_map_dimensions() {
    if (!this.dimentions) {
      var keyIds = this.get_key_ids();
      this.dimensions = [
        this.data.ranges[keyIds[0]][0],
        this.data.ranges[keyIds[1]][0],
        this.data.ranges[keyIds[0]][1],
        this.data.ranges[keyIds[1]][1],
      ];
    }
    return this.dimensions;
  }

  get_key_ids() {
    var ids = [];
    for (var key of this.myKeys) {
      ids.push(this.keys.indexOf(key));
    }
    return ids;
  }
}

module.exports = Heatmap;
