docsearch({
  apiKey: '7710c47b3b47d4ee65253d66582eccb1',
  indexName: 'moonjs',
  inputSelector: '#search',
  debug: false
});

var app = new Moon({
  el: '#app',
  data: {
    msg: 'Hello Moon!'
  }
});
