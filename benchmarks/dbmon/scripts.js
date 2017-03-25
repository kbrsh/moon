var app = new Moon({
  el: '#app',
  data: {
    databases: []
  }
});

function run() {
  app.set('databases', ENV.generateData().toArray());
  Monitoring.renderRate.ping();
  setTimeout(run, ENV.timeout);
}

run();
