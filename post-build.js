const replace = require('replace-in-file');

// Due to bug between how the service worker is handled in Safari for fetch and firebase
// https://github.com/angular/angular/issues/23244
const options = {
  files: './public/ngsw-worker.js',
  from: `onFetch(event) {`,
  to: `onFetch(event) {
        const isGoogleApis = event.request.url.indexOf('googleapis') !== -1;
        if (isGoogleApis) { return; }`,
};

replace(options)
  .then(() => {
    console.log('ngsw-worker.js Updated');
  })
  .catch(error => {
    console.error('Error occurred:', error);
  });
