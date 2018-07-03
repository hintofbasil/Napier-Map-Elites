const format = require("string-template")
const uniqueString = require('unique-string');

var DEFAULT_TEMPLATE = `
  <input type="file" class="file-chooser" id="file-chooser-{uniqueId}" accept="{allowedFiles}" />
  <div class="label-wrapper">
    <label class="file-dropper" for="file-chooser-{uniqueId}" id="file-dropper-{uniqueId}">
      <div class="label-wrapper-inner">
        <img src="/static/images/download.svg" />
        <div class="file-dropper-text">Select a file or drag here</div>
        <span class="file-button">Select a file</span>
      </div>
      <progress id="file-progress-{uniqueId}" max=100 value=0 style="display:none;"></progress>
      <div class="error" id="file-error-message-{uniqueId}"></div>
    </label>
  </div>
`;

var DEFAULT_OPTIONS = {
  containerId: null,
  url: "/",
  filename: null,
  allowedFiles: "*",
}

class FileUploader {
  constructor(type, options, onSuccess, onError) {
    this.type = type;
    this.uniqueId = uniqueString();
    this.options = {...DEFAULT_OPTIONS, ...options};
    this.container = document.getElementById(this.options.containerId);
    this.onSuccess = onSuccess;
    this.onError = onError;
    this.init();
  }

  addTemplate() {
    this.container.innerHTML = format(DEFAULT_TEMPLATE, {
      uniqueId: this.uniqueId,
      allowedFiles: this.options.allowedFiles,
    });
    this.dropper = document.getElementById('file-dropper-' + this.uniqueId);
    this.chooser = document.getElementById('file-chooser-' + this.uniqueId);
    this.progress = document.getElementById('file-progress-' + this.uniqueId);
    this.errorMessage = document.getElementById('file-error-message-' + this.uniqueId);
  }

  readTemplate() {
    this.dropper = document.getElementById('file-dropper-' + this.uniqueId);
    this.chooser = document.getElementById('file-chooser-' + this.uniqueId);
    this.progress = document.getElementById('file-progress-' + this.uniqueId);
    this.errorMessage = document.getElementById('file-error-message-' + this.uniqueId);
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
        this.onSuccess(reader.result, reader.fileName);
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
        this.onSuccess(reader.result, reader.fileName);
      };
      reader.fileName = e.target.files[0].name;
      reader.readAsText(e.target.files[0]);
    };

    this.dropper.addEventListener('drop', fileDragDrop, false);

    this.chooser.addEventListener('change', fileChooserChange, false);
  }

  initFormPost() {
    var doUpload = (file) => {
      this.progress.style.display = '';
      this.progress.classList.remove('error');
      this.errorMessage.innerHTML = '';

      let xhr = new XMLHttpRequest();
      let formData = new FormData();

      xhr.upload.addEventListener('progress', e => {
        this.progress.value = (e.loaded * 100.0 / e.total) || 100;
      });

      xhr.addEventListener('readystatechange', e => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            if (this.onSuccess) {
              this.onSuccess()
            }
          } else {
            this.progress.classList.add('error');
            this.errorMessage.innerHTML = xhr.responseText;
            if (this.onError) {
              this.onError(xhr.status, xhr.responseText);
            }
          }
        }
      });

      formData.append('file', file);
      formData.append('filename', this.options.filename);

      xhr.open('POST', this.options.url, true);
      xhr.send(formData);
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
