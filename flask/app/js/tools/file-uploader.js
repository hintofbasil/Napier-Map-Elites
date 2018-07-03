const format = require("string-template")
const uniqueString = require('unique-string');

var DEFAULT_TEMPLATE = `
  <input type="file" class="file-chooser" id="file-chooser-{uniqueId}" />
  <div class="label-wrapper">
    <label class="file-dropper" for="file-chooser-{uniqueId}" id="file-dropper-{uniqueId}">
      <div class="label-wrapper-inner">
        <img src="/static/images/download.svg" />
        <div class="file-dropper-text">Select a file or drag here</div>
        <span class="file-button">Select a file</span>
      </div>
    </label>
  </div>
`;

class FileUploader {
  constructor(type, containerId, onRead) {
    this.type = type;
    this.uniqueId = uniqueString();
    this.container = document.getElementById(containerId);
    this.onRead = onRead;
    this.init();
  }

  addTemplate() {
    this.container.innerHTML = format(DEFAULT_TEMPLATE, {
      uniqueId: this.uniqueId,
    });
    this.dropper = document.getElementById('file-dropper-' + this.uniqueId);
    this.chooser = document.getElementById('file-chooser-' + this.uniqueId);
  }

  readTemplate() {
    this.dropper = document.getElementById('file-dropper-' + this.uniqueId);
    this.chooser = document.getElementById('file-chooser-' + this.uniqueId);
  }

  init() {
    // If empty then populate
    if (this.container.children.length === 0) {
      this.addTemplate();
    } else {
      this.readTemplate();
    }

    if (this.type === 'local') {
      this.initLocal();
    } else {
      throw 'Unknown FileUploader type: ' + this.type;
    }
  }

  initLocal() {
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
