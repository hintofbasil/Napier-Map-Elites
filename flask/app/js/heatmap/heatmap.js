class Heatmap {
  constructor(elementId, data, myKeys, callback) {
    this.container = document.getElementById(elementId);
    this.toHighlight = [0, 0];
    this.data = data;
    this.keys = data.keys;
    this.myKeys = myKeys;
    this.range = data.distanceRange;
    this.callback = callback;
    this.create_map();
    this.add_label();
  }

  add_label() {
    var label = document.createElement("div");
    label.className = "heatmap-label";
    label.innerHTML = this.myKeys[1] + ":" + this.myKeys[0];
    this.base.appendChild(label);
  }

  create_map() {
    var base = document.createElement("div");
    base.className = "heatmap-container";
    var table = document.createElement("table");
    table.className = "heatmap-table";
    base.appendChild(table);
    var dimensions = this.get_map_dimensions();
    var values = this.get_map_values();
    for (var i=0; i<=(dimensions[3] - dimensions[1]); i++) {
      var row = document.createElement("tr");
      for (var j=0; j<=(dimensions[2] - dimensions[0]); j++) {
        var cell = document.createElement("td");
        var entries = values[i][j];
        cell.className = entries.length > 0 ? "heat-map-found" : "heat-map-not-found";
        cell.style.background = entries.length > 0 ? this.get_cell_color(entries) : "";
        cell.entries = entries;
        cell.addEventListener('click', (e) => {
          this.callback(e, e.target.entries);
        });
        row.appendChild(cell);
      }
      table.appendChild(row);
    }
    this.container.appendChild(base);
    this.base = base;
  }

  get_map_values() {
    var dimensions = this.get_map_dimensions();
    // Plus one to make it inclusive
    var values = this.create_matrix(
      dimensions[3] - dimensions[1] + 1,
      dimensions[2] - dimensions[0] + 1,
      0
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
      values[y][x].push(entry);
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

  change_highlight(elements) {
    var table = this.base.children[0];
    for (var row of table.children) {
      for (var element of row.children) {
        element['data-in-selection'] = false;
      }
    }
    for (var element of elements) {
      var lowerX = this.data.ranges[this.data.keys.indexOf(this.myKeys[0])][0];
      var lowerY = this.data.ranges[this.data.keys.indexOf(this.myKeys[1])][0];
      var upperY = this.data.ranges[this.data.keys.indexOf(this.myKeys[1])][1];
      var x = element[this.myKeys[0]][0] - lowerX;
      var y = (upperY - lowerY) - (element[this.myKeys[1]][0] - lowerY);
      table.children[y].children[x]['data-in-selection'] = true;
    }
    for (var j=0; j<table.children.length; j++) {
      var row = table.children[j];
      for (var i=0; i<row.children.length; i++) {
        var cell = row.children[i];
        if (cell['data-in-selection']) {
          cell.style.opacity = "1";
        } else {
          cell.style.opacity = "0.3";
        }
      }
    }
  }

  get_cell_color(entries) {
    var shortest = entries.reduce((a, b) => {
      return a.distance[1] < b.distance[1] ? a : b;
    });
    var r = this.range[1] - this.range[0];
    var percent = (shortest.distance[1] - this.range[0]) / r;
    return this.get_color(percent);
  }

  // Taken from https://stackoverflow.com/a/17268489
  get_color(value){
    //value from 0 to 1
    var hue=((1-value)*120).toString(10);
    return ["hsl(",hue,",100%,50%)"].join("");
  }
}

module.exports = Heatmap;
