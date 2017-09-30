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

/* This is using Moon.js v0.11 */
var app = new Moon({
  el: '#app',
  data: {
    messages: [],
    newMessage: ''
  },
  methods: {
    addMessage: function(msg) {
      var that = this,
          newMessage = this.get('newMessage')

      // add message to firebase
      if(newMessage.length !== 0 && newMessage.trim() !== '') {
        fbDb.ref('messages').push(newMessage).then(function() {
          that.callMethod('getMessages', [])
          that.set('newMessage', '')
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
    }
  },
  template: `<div class="content">
              <ul>
                <li m-for="message in messages">{{message}}</li>
              </ul>
              <div class="bottom">
                <input type="text" placeholder="What's your message" m-model="newMessage" m-on:keyup.enter="addMessage" />
                <button m-on:click="addMessage(newMessage)">Add</button>
              </div>
            </div>`,
  hooks: {
    mounted: function() {
      var that = this;
      this.callMethod('getMessages', [])

      // if new message, call function getMessages
      fbDb.ref('messages').on('child_added', function(snapshot) {
        that.callMethod('getMessages', [])
      });
    }
  }
})