// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyCSX5FpQc9UN3BvzfDHsN8PPYjcMfvnilk',
    authDomain: 'toread-today-staging.firebaseapp.com',
    databaseURL: 'https://toread-today-staging.firebaseio.com',
    projectId: 'toread-today-staging',
    storageBucket: 'toread-today-staging.appspot.com',
    messagingSenderId: '95014496389',
    appId: '1:95014496389:web:b2e97188906c31fe1c61ec',
    measurementId: 'G-GCZBEB8R3J'
  },
  sentry: '',
  apiPath: 'https://toread-today-staging.web.app/api/',
  frontendUrl: 'http://localhost:4200/'
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
