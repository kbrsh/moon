var app = new Moon({
  root: "#app",
  data: {
    databases: []
  }
});

perfMonitor.startFPSMonitor();
perfMonitor.startMemMonitor();
perfMonitor.initProfiler("render");

var run = function() {
  perfMonitor.startProfile("render");
  app.set("databases", ENV.generateData().toArray());
  perfMonitor.endProfile("render");
  renderRate.ping();
  setTimeout(run, ENV.timeout);
}

run();
