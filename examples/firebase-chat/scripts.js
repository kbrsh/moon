/* Get your own firebase apiKey here: https://firebase.google.com */
firebase.initializeApp({
  apiKey: "AIzaSyDG6Wvi41EkXB88M2tZTR3WOWEj4PvTtOI",
  authDomain: "moon-firebase-chat.firebaseapp.com",
  databaseURL: "https://moon-firebase-chat.firebaseio.com",
  projectId: "moon-firebase-chat",
  storageBucket: "",
  messagingSenderId: "527682524924"
});

var fbDb = firebase.database();

var app = new Moon({
  el: "#app",
  data: {
    messages: [],
    newMessage: ""
  },
  methods: {
    addMessage: function() {
      var that = this;
      var newMessage = this.get("newMessage");

      // Add message to firebase
      if(newMessage.length !== 0 && newMessage.trim() !== "") {
        fbDb.ref("messages").push(newMessage).then(function() {
          that.callMethod("getMessages", []);
          that.set("newMessage", "");
        });
      }
    },
    getMessages: function() {
      var that = this;
      var msgs = [];

      // Get the last 15 messages from firebase
      fbDb.ref("messages").limitToLast(15).once("value").then(function(snapshot) {
        snapshot.forEach(function(snapshot) {
          msgs.push(snapshot.val());
        });
      }).then(function() {
        that.set("messages", msgs);
      })
    }
  },
  hooks: {
    mounted: function() {
      var that = this;
      this.callMethod("getMessages", []);

      // If new message, call function getMessages
      fbDb.ref("messages").on("child_added", function(snapshot) {
        that.callMethod("getMessages", [])
      });
    }
  }
})
