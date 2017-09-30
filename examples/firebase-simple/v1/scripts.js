/* Get your own firebase apiKey here: https://firebase.google.com */
firebase.initializeApp({
  apiKey: 'AIzaSyDG6Wvi41EkXB88M2tZTR3WOWEj4PvTtOI',
  authDomain: 'moon-firebase-chat.firebaseapp.com',
  databaseURL: 'https://moon-firebase-chat.firebaseio.com',
  projectId: 'moon-firebase-chat',
  storageBucket: '',
  messagingSenderId: '527682524924'
})

var fbDb = firebase.database();

/* This is using Moon.js v1 development version */
var app = new Moon({
  root: '#app',
  data: {
    messages: [],
    msg: ''
  },
  methods: {
    addMessage: function(msg) {
      var that = this;

      // add message to firebase
      if(msg.length !== 0 && msg.trim() !== '') {
        fbDb.ref('messages').push(msg).then(function() {
          that.set('msg', '');
        })
      }
    },
    getMessages: function() {
      var that = this,
          msgs = [];

      // get the last 15 messages from firebase
      fbDb.ref('messages').limitToLast(15).once('value').then(function(snapshot) {
        snapshot.forEach(function(snapshot) {
          msgs.push(snapshot.val());
        })
      }).then(function() {
        that.set('messages', msgs);
      })
    },
    updateMessage: function(e) {
      if(e.keyCode == 13) {
        var msg = e.target.value;
        this.methods.addMessage(msg);
      }
    }
  },
  template: `<div class="content">
              <ul>
                <li m-for="message in messages">{{message}}</li>
              </ul>
              <div class="bottom">
                <input type="text" placeholder="What's your message" m-bind="msg" m-on:keydown="updateMessage" />
                <button m-on:click="addMessage(msg)">Add</button>
              </div>
            </div>`,
  hooks: {
    init: function() {
      var that = this;
      this.methods.getMessages(); // Get messages on load

      // if new message, call function getMessages
      fbDb.ref('messages').on('child_added', function(snapshot) {
        that.methods.getMessages();
      });
    }
  }
})