var app = new Moon({
  el: '#app',
  data: {
    databases: []
  }
})

function loadSamples() {
  app.set('databases', Object.freeze(ENV.generateData().toArray()));
  Monitoring.renderRate.ping();
  setTimeout(loadSamples, ENV.timeout);
}

loadSamples()
