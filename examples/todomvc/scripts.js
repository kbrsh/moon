var KEY = 'todos-moon';

// Storage for getting data from local storage
var storage = {
  fetch: function() {
    // Fetch data from localStorage
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  },
  save: function(todos) {
    // Save todos to localStorage
    localStorage.setItem(KEY, JSON.stringify(todos));
  }
}

// Setup some filters that can filter a list of todos
var filters = {
  all: function(todos) {
    return todos;
  },
  completed: function(todos) {
    var filtered = [];

    for(var i = 0; i < todos.length; i++) {
      var todo = todos[i];
      if(todo.completed === true) {
        filtered.push(todo);
      }
    }

    return filtered;
  },
  active: function(todos) {
    var filtered = [];

    for(var i = 0; i < todos.length; i++) {
      var todo = todos[i];
      if(todo.completed === false) {
        filtered.push(todo);
      }
    }

    return filtered;
  }
}

// Register Custom `esc` Keycode Modifier
Moon.config.keyCodes({
  esc: 27
});

// A custom directive used to focus an element
Moon.directive("focus", function(el, val, vdom) {
  if(val) {
    el.focus();
  }
});

// Setup moon
var app = new Moon({
  el: ".todoapp",
  data: {
    newTodo: '',
    editedTodo: null,
    cachedEdit: null,
    filter: 'all',
    todos: storage.fetch()
  },
  methods: {
    addTodo: function() {
      // Add a new todo
      var todos = this.get("todos");
      var newTodo = this.get("newTodo");

      if(newTodo.length !== 0 && newTodo.trim() !== "") {
        todos.push({
          id: todos.length,
          content: newTodo,
          completed: false
        });

        this.set('todos', todos);
      }

      this.set("newTodo", "");
    },
    removeTodo: function(index) {
      // Remove a todo at a certain index
      var todos = this.get('todos');
      todos.splice(index, 1);
      this.set('todos', todos);
    },
    editTodo: function(todo) {
      // Setup the `edited todo`
      this.set('cachedEdit', todo.content);
      this.set('editedTodo', todo);
    },
    updateTodo: function(index) {
      // Update a certain todo by index
      this.set('editedTodo', null);
      this.set('cachedEdit', null);
    },
    discardEdit: function(index) {
      // Discard the edited todo
      var todos = this.get('todos');
      todos[index].content = this.get('cachedEdit');
      this.set('editedTodo', null);
      this.set('cachedEdit', null);
      this.set('todos', todos);
    },
    removeCompleted: function() {
      // Remove all completed todos
      var todos = this.get('todos');

      var i = todos.length;
      while(i-- !== 0) {
        if(todos[i].completed === true) {
          todos.splice(i, 1);
        }
      }

      this.set('todos', todos);
    },
    pluralize: function(num) {
      return num === 1 ? 'item' : 'items'
    }
  },
  computed: {
    remaining: {
      get: function() {
        // Get the length of all active todos
        return filters.active(this.get('todos')).length;
      }
    },
    filtered: {
      get: function() {
        // Returns todos by using the current filter
        return filters[this.get('filter')](this.get('todos'));
      },
      set: function() {
        this.set('todos', this.get('todos'));
      }
    },
    done: {
      get: function() {
        // Returns true if none are remaining
        return this.get('remaining') === 0;
      },
      set: function(val) {
        // Marks all todos as completed or not completed
        var todos = this.get('todos');
        for(var i = 0; i < todos.length; i++) {
          todos[i].completed = val;
        }
        this.set('todos', todos);
      }
    }
  }
});

// Listen for hashchange to update the current filter
window.addEventListener("hashchange", function() {
  app.set('filter', window.location.hash.slice(2));
});

// Save todos to storage before user leaves
window.addEventListener("beforeunload", function() {
  storage.save(app.get('todos'));
});
