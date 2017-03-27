var app = new Moon({
  el: '#app',
  data: {
    databases: []
  }
});

perfMonitor.startFPSMonitor()
perfMonitor.startMemMonitor()
perfMonitor.initProfiler("render")

function run() {
  app.set('databases', ENV.generateData().toArray());
  perfMonitor.startProfile("render")
  Moon.nextTick(function() {
    perfMonitor.endProfile("render")
  });
  setTimeout(run, ENV.timeout);
}

run();
