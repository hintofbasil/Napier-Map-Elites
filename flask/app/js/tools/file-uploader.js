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

var DEFAULT_OPTIONS = {
  containerId: null,
  url: "/",
  filename: null,

}

class FileUploader {
  constructor(type, options, onRead) {
    this.type = type;
    this.uniqueId = uniqueString();
    this.options = {...DEFAULT_OPTIONS, ...options};
    this.container = document.getElementById(this.options.containerId);
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

    // Enable hover highlighting
    var fileDragHover = (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.type === 'dragover') {
        this.dropper.classList.add('file-chooser-hover')
      } else {
        this.dropper.classList.remove('file-chooser-hover')
      }
    };
    this.dropper.addEventListener('dragover', fileDragHover, false);
    this.dropper.addEventListener('dragleave', fileDragHover, false);

    if (this.type === 'local') {
      this.initLocal();
    } else if (this.type === 'form') {
      this.initFormPost();
    } else {
      throw 'Unknown FileUploader type: ' + this.type;
    }
  }

  initLocal() {
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
      e.stopPropagation();
      e.preventDefault();

      var reader = new FileReader();
      reader.onload = (file) => {
        this.file_chosen();
        this.onRead(reader.result, reader.fileName);
      };
      reader.fileName = e.target.files[0].name;
      reader.readAsText(e.target.files[0]);
    };

    this.dropper.addEventListener('drop', fileDragDrop, false);

    this.chooser.addEventListener('change', fileChooserChange, false);
  }

  initFormPost() {
    var doUpload = (file) => {
      let formData = new FormData();

      formData.append('file', file);
      formData.append('filename', this.options.filename);

      fetch(this.options.url, {
        method: 'POST',
        body: formData
      })
      .then(e => {
        console.log("SUCCESS", e);
        e.text().then(f => { console.log(f); });
      })
      .catch(e => {
        console.log("ERR", e);
      });
    };

    var fileDragDrop = (e) => {
      e.stopPropagation();
      e.preventDefault();

      var files = e.dataTransfer.files;
      doUpload(files[0]);
    };

    var fileChooserChange = (e) => {
      e.stopPropagation();
      e.preventDefault();

      var files = e.target.files;
      doUpload(files[0]);
    };

    this.dropper.addEventListener('drop', fileDragDrop, false);

    this.chooser.addEventListener('change', fileChooserChange, false);
  }

  file_chosen() {
    this.dropper.classList.add('file-dropper-chosen');
  }
}

module.exports = FileUploader;
