class FileUploader {
  constructor(dropperId, chooserId, onRead) {
    this.dropper = document.getElementById(dropperId);
    this.chooser = document.getElementById(chooserId);
    this.onRead = onRead;
    this.init();
  }

  init() {
    var fileDragHover = (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.dropper.className = (e.type === 'dragover' ?
        'file-chooser-hover' : '');
    };

    var fileDragDrop = (e) => {
      e.stopPropagation();
      e.preventDefault();
      var reader = new FileReader();
      reader.onload = () => {
        this.onRead(reader.result);
      };
      reader.readAsText(e.dataTransfer.files[0]);
    };

    var fileChooserChange = (e) => {
      var reader = new FileReader();
      reader.onload = () => {
        this.onRead(reader.result);
      };
      reader.readAsText(e.target.files[0]);
    };

    this.dropper.addEventListener('dragover', fileDragHover, false);
    this.dropper.addEventListener('dragleave', fileDragHover, false);
    this.dropper.addEventListener('drop', fileDragDrop, false);

    this.chooser.addEventListener('change', fileChooserChange, false);
  }
}

module.exports = FileUploader;
