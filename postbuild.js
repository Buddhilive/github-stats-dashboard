const fs = require('fs-extra');

fs.copy('build/client/browser', 'dist', { overwrite: false, recursive: true }, (err) => {
  if (err) {
    return console.error(err);
  }
});

