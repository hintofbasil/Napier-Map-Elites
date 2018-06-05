module.exports = {
  make_dropper: (element, callback) => {
    element.addEventListener('dragover', function(e) {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }, false);

    element.addEventListener('drop', function(e) {
      e.stopPropagation();
      e.preventDefault();
      callback(e.dataTransfer.files[0]);
    }, false);
  }
}
