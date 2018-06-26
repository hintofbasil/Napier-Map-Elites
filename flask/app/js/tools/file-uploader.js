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
      if (e.type === 'dragover') {
        this.dropper.classList.add('file-chooser-hover')
      } else {
        this.dropper.classList.remove('file-chooser-hover')
      }
    };

    var fileDragDrop = (e) => {
      e.stopPropagation();
      e.preventDefault();
      var reader = new FileReader();
      reader.onload = () => {
        this.file_chosen();
        this.onRead(reader.result, reader.fileName);
      };
      reader.fileName = e.dataTransfer.files[0].name;
      reader.readAsText(e.dataTransfer.files[0]);
    };

    var fileChooserChange = (e) => {
      var reader = new FileReader();
      reader.onload = (file) => {
        this.file_chosen();
        this.onRead(reader.result, reader.fileName);
      };
      reader.fileName = e.target.files[0].name;
      reader.readAsText(e.target.files[0]);
    };

    this.dropper.addEventListener('dragover', fileDragHover, false);
    this.dropper.addEventListener('dragleave', fileDragHover, false);
    this.dropper.addEventListener('drop', fileDragDrop, false);

    this.chooser.addEventListener('change', fileChooserChange, false);
  }

  file_chosen() {
    this.dropper.classList.add('file-dropper-chosen');
  }
}

module.exports = FileUploader;
