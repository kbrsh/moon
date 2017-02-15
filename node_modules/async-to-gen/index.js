var babylon = require('babylon');
var MagicString = require('magic-string');

/**
 * Given a string JavaScript source which contains async functions, return a
 * MagicString which has transformed generators.
 *
 * MagicString has two important functions that can be called: .toString() and
 * .generateMap() which returns a source map, as well as these properties:
 *
 *   - .isEdited: true when any functions were transformed.
 *   - .containsAsync: true when any async functions were transformed.
 *   - .containsAsyncGen: true when any async generator functions were transformed.
 *
 * Options:
 *
 *   - fastSkip: (default: true) returns the source directly if it doesn't find
 *               the word "async" in the source.
 *   - includeHelper: (default: true) includes the __async function in the file.
 */
module.exports = asyncToGen;
function asyncToGen(source, options) {
  // Options
  var fastSkip = !(options && options.fastSkip === false);
  var includeHelper = !(options && options.includeHelper === false);

  // Create editor
  var editor = new MagicString(source);
  editor.isEdited = false;
  editor.containsAsync = false;
  editor.containsAsyncGen = false;
  editor.containsForAwaitOf = false;

  // Cheap trick for files that don't actually contain async functions
  if (fastSkip && source.indexOf('async') === -1) {
    return editor;
  }

  // Babylon is one of the sources of truth for async syntax. This parse
  // configuration is intended to be as permissive as possible.
  var ast = babylon.parse(source, {
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    allowSuperOutsideMethod: true,
    sourceType: 'module',
    plugins: [ '*', 'jsx', 'flow' ],
  });

  ast.shouldIncludeHelper = includeHelper;


  visit(ast, editor, asyncToGenVisitor);

  editor.isEdited = Boolean(
    ast.containsAsync ||
    ast.containsAsyncGen ||
    ast.containsForAwaitOf
  );
  editor.containsAsync = Boolean(ast.containsAsync);
  editor.containsAsyncGen = Boolean(ast.containsAsyncGen);
  editor.containsForAwaitOf = Boolean(ast.containsForAwaitOf);

  return editor;
}

/**
 * A method which the Jest testing library looks for to process source code.
 */
module.exports.process = function process(source) {
  return String(asyncToGen(source));
}

/**
 * A helper function which accepts a generator function and returns a Promise
 * based on invoking the generator and resolving yielded Promises.
 *
 * Automatically included at the end of files containing async functions,
 * but also exported from this module for other uses. See ./async-node for an
 * example of another usage.
 */
var asyncHelper =
  'function __async(g){' +
    'return new Promise(function(s,j){' +
      'function c(a,x){' +
        'try{' +
          'var r=g[x?"throw":"next"](a)' +
        '}catch(e){' +
          'j(e);'+
          'return' +
        '}' +
        'r.done?' +
          's(r.value):' +
          'Promise.resolve(r.value).then(c,d)' +
      '}' +
      'function d(e){' +
        'c(e,1)' +
      '}' +
      'c()' +
    '})' +
  '}';

module.exports.asyncHelper = asyncHelper;

/**
 * A helper function which accepts a generator function and returns an
 * Async Iterable based on invoking the generating and resolving an iteration
 * of Promises.
 *
 * Automatically included at the end of files containing async generator
 * functions, but also exported from this module for other uses.
 * See ./async-node for an example of another usage.
 */
var asyncGenHelper =
  'function __asyncGen(g){' +
    'var q=[],' +
        'T=["next","throw","return"],' +
        'I={};' +
    'for(var i=0;i<3;i++){' +
      'I[T[i]]=a.bind(0,i)' +
    '}' +
    'I[Symbol?' +
      'Symbol.asyncIterator||(Symbol.asyncIterator=Symbol()):' +
      '"@@asyncIterator"]=function (){' +
      'return this' +
    '};' +
    'function a(t,v){' +
      'return new Promise(function(s,j){' +
        'q.push([s,j,v,t]);' +
        'q.length===1&&c(v,t)' +
      '})' +
    '}' +
    'function c(v,t){' +
      'try{' +
        'var r=g[T[t|0]](v),' +
            'w=r.value&&r.value.__await;' +
        'w?' +
          'Promise.resolve(w).then(c,d):' +
          'n(r,0)' +
      '}catch(e){' +
        'n(e,1)' +
      '}' +
    '}' +
    'function d(e){' +
      'c(e,1)' +
    '}' +
    'function n(r,s){' +
      'q.shift()[s](r);' +
      'q.length&&c(q[0][2],q[0][3])' +
    '}' +
    'return I' +
  '}';

module.exports.asyncGenHelper = asyncGenHelper;

/**
 * A helper function which provides an async iterator from an async iterable.
 *
 * Automatically included at the end of files containing for-await-of loops, but
 * also exported from this module for other uses.
 * See ./async-node for an example of another usage.
 */
var asyncIteratorHelper =
  'function __asyncIterator(o){' +
    'var i=o[Symbol&&Symbol.asyncIterator||"@@asyncIterator"]||' +
      'o[Symbol&&Symbol.iterator||"@@iterator"];' +
    'if(!i)throw new TypeError("Object is not AsyncIterable.");' +
    'return i.call(o)' +
  '}';

module.exports.asyncIteratorHelper = asyncIteratorHelper;

// A collection of methods for each AST type names which contain async functions to
// be transformed.
var asyncToGenVisitor = {
  AwaitExpression: {
    leave: leaveAwait
  },
  ArrowFunctionExpression: {
    enter: enterArrowFunction,
    leave: leaveArrowFunction
  },
  FunctionDeclaration: {
    enter: enterFunction,
    leave: leaveFunction
  },
  FunctionExpression: {
    enter: enterFunction,
    leave: leaveFunction
  },
  ObjectMethod: {
    enter: enterFunction,
    leave: leaveFunction
  },
  ClassMethod: {
    enter: enterFunction,
    leave: leaveFunction
  },
  Program: {
    enter: function (editor, node, ast) {
      ast.scope = [ node ];
    },
    leave: function (editor, node, ast) {
      if (ast.shouldIncludeHelper) {
        if (ast.containsAsync) {
          editor.append('\n' + asyncHelper + '\n');
        }
        if (ast.containsAsyncGen) {
          editor.append('\n' + asyncGenHelper + '\n');
        }
        if (ast.containsForAwaitOf) {
          editor.append('\n' + asyncIteratorHelper + '\n');
        }
      }
    }
  },
  ThisExpression: {
    enter: function (editor, node, ast) {
      var envRecord = currentScope(ast);
      if (envRecord.async) {
        envRecord.referencesThis = true;
      }
    }
  },
  Identifier: {
    enter: function (editor, node, ast) {
      if (node.name === 'arguments') {
        var envRecord = currentScope(ast);
        if (envRecord.async) {
          envRecord.referencesArgs = true;
          editor.overwrite(node.start, node.end, 'argument$');
        }
      }
    }
  },
  MemberExpression: {
    leave: leaveMemberExpression
  },
  AssignmentExpression: {
    leave: leaveAssignmentExpression
  },
  ForAwaitStatement: {
    leave: leaveForAwait
  }
};

function leaveAwait(editor, node, ast, stack) {
  var start;
  var end;

  // An YieldExpression can only exist where AssignmentExpression is
  // allowed, otherwise it is wrapped in a ParenthesizedExpression.
  var parentType = stack.parent.type;

  if (parentType === 'LogicalExpression' ||
      parentType === 'BinaryExpression' ||
      parentType === 'UnaryExpression' ||
      parentType === 'ConditionalExpression' && node === stack.parent.test) {
    start = '(yield';
    end = ')';
  } else {
    start = 'yield';
    end = '';
  }

  var envRecord = currentScope(ast);
  if (envRecord.generator) {
    start += '{__await:';
    end += '}';
  } else if (node.loc.start.line !== node.argument.loc.start.line) {
    // unlike await, yield must not be followed by a new line
    start += '(';
    end += ')';
  }

  editor.overwrite(node.start, node.start + 5, start);
  if (end) {
    editor.appendLeft(node.end, end);
  }
}

function enterFunction(editor, node, ast) {
  ast.scope.push(node);
}

function leaveFunction(editor, node, ast) {
  ast.scope.pop();
  if (node.async) {
    if (node.generator) {
      ast.containsAsyncGen = true;
    } else {
      ast.containsAsync = true;
    }

    var idx = findTokenIndex(ast.tokens, node.start);
    while (ast.tokens[idx].value !== 'async') {
      idx++;
    }
    editor.remove(ast.tokens[idx].start, ast.tokens[idx + 1].start);

    if (node.generator) {
      while (ast.tokens[idx].value !== '*') {
        idx++;
      }
      editor.overwrite(ast.tokens[idx].start, ast.tokens[idx + 1].start, ' ');
    }

    var wrapping = createAsyncWrapping(node);
    editor.appendLeft(node.body.start + 1, 'return ' + wrapping[0]);
    editor.prependRight(node.body.end - 1, wrapping[1]);
  }
}

function enterArrowFunction(editor, node, ast) {
  if (node.async) {
    ast.scope.push(node);
  }
}

function leaveArrowFunction(editor, node, ast) {
  if (node.async) {
    if (node.generator) {
      ast.containsAsyncGen = true;
    } else {
      ast.containsAsync = true;
    }

    ast.scope.pop();
    var envRecord = currentScope(ast);
    envRecord.referencesThis |= node.referencesThis;
    envRecord.referencesArgs |= node.referencesArgs;
    envRecord.referencesSuper |= node.referencesSuper;
    envRecord.referencesSuperEq |= node.referencesSuperEq;

    var wrapping = createAsyncWrapping(node);

    var idx = findTokenIndex(ast.tokens, node.start);
    while (ast.tokens[idx].value !== 'async') {
      idx++;
    }
    editor.remove(ast.tokens[idx].start, ast.tokens[idx + 1].start);

    if (node.body.type === 'BlockStatement') {
      editor.overwrite(node.body.start, node.body.start + 1, wrapping[0]);
      editor.overwrite(node.body.end - 1, node.body.end, wrapping[1]);
    } else {
      var idx = findTokenIndex(ast.tokens, node.body.start) - 1;
      while (ast.tokens[idx].type.label !== '=>') {
        idx--;
      }
      editor.appendLeft(ast.tokens[idx].end, wrapping[0]);
      editor.prependRight(node.body.start, 'return ');
      editor.appendLeft(node.body.end, wrapping[1]);
    }
  }
}

function createAsyncWrapping(node) {
  var argNames = [];
  var argValues = [];

  if (node.referencesThis) {
    argValues.push('this');
  }

  if (node.referencesArgs) {
    argNames.push('argument$');
    argValues.push('arguments');
  }

  if (node.type !== 'ArrowFunctionExpression') {
    if (node.referencesSuper) {
      argNames.push('$uper');
      argValues.push('p=>super[p]');
    }

    if (node.referencesSuperEq) {
      argNames.push('$uperEq');
      argValues.push('(p,v)=>(super[p]=v)');
    }
  }

  var helperName = node.generator ? '__asyncGen' : '__async';

  return [
    helperName + '(function*(' + argNames.join(',') + '){',
    (node.referencesThis ? '}.call(' : '}(') + argValues.join(',') + '))'
  ];
}

function leaveMemberExpression(editor, node, ast, stack) {
  // Only transform super member expressions.
  if (node.object.type !== 'Super') return;

  var contextNode = stack.parent;

  // Do not transform delete unary or left-hand-side expressions.
  if (
    contextNode.operator === 'delete' ||
    contextNode.type === 'AssignmentExpression' && contextNode.left === node
  ) return;

  // Only within transformed async function scopes.
  var envRecord = currentScope(ast);
  if (!envRecord.async) return;

  envRecord.referencesSuper = true;

  convertSuperMember(editor, node, ast);

  editor.overwrite(node.object.start, node.object.end, '$uper(');
  editor.appendLeft(node.end, ')');

  // Ensure super.prop() use the current this binding.
  if (contextNode.type === 'CallExpression') {
    envRecord.referencesThis = true;
    var idx = findTokenIndex(ast.tokens, node.end);
    while (ast.tokens[idx].type.label !== '(') {
      idx++;
    }
    editor.overwrite(ast.tokens[idx].start, ast.tokens[idx].end, contextNode.arguments.length ? '.call(this,' : '.call(this');
  }
}

function leaveAssignmentExpression(editor, node, ast, stack) {
  // Only transform super assignment expressions.
  var left = node.left;
  if (left.type !== 'MemberExpression' || left.object.type !== 'Super') return;

  // Only within transformed async function scopes.
  var envRecord = currentScope(ast);
  if (!envRecord.async) return;

  envRecord.referencesSuperEq = true;

  convertSuperMember(editor, left, ast);

  editor.overwrite(left.object.start, left.object.end, '$uperEq(');
  editor.appendLeft(node.end, ')')

  var idx = findTokenIndex(ast.tokens, left.end);
  while (ast.tokens[idx].type.label !== '=') {
    idx++;
  }
  editor.overwrite(ast.tokens[idx].start, ast.tokens[idx].end, ',');
}

function convertSuperMember(editor, node, ast) {
  var idx = findTokenIndex(ast.tokens, node.object.end);
  while (ast.tokens[idx].type.label !== (node.computed ? '[' : '.')) {
    idx++;
  }
  editor.remove(ast.tokens[idx].start, ast.tokens[idx].end);
  if (node.computed) {
    editor.remove(node.end - 1, node.end);
  } else {
    editor.prependRight(node.property.start, '"');
    editor.appendLeft(node.property.end, '"');
  }
}

function leaveForAwait(editor, node, ast) {
  ast.containsForAwaitOf = true;

  // Remove 'await'
  var envRecord = currentScope(ast);
  var idx = findTokenIndex(ast.tokens, node.start) + 1;
  while (ast.tokens[idx].value !== 'await') {
    idx++;
  }
  editor.remove(ast.tokens[idx].start, ast.tokens[idx + 1].start);

  // Remove 'of'
  idx = findTokenIndex(ast.tokens, node.right.start) - 1;
  while (ast.tokens[idx].value !== 'of') {
    idx--;
  }
  editor.remove(ast.tokens[idx].start, ast.tokens[idx + 1].start);

  // Convert for-await-of to typical for loop that operates on the async iterable
  // interface and properly closes iterators on completion.
  var iter = '$i' + (ast.scope.length - 1);
  var step = '$s' + (ast.scope.length - 1);
  var error = '$e' + (ast.scope.length - 1);
  var left = step + '=null,' + iter + '=__asyncIterator(';
  var right = ');' + step + '=' + toYield(iter + '.next()', ast) + ',!' + step + '.done;';
  var head = 'var ' + iter + ',' + step + ',' + error + ';try{';
  var tail =
    '}catch(e){' +
      error + '=e' +
    '}finally{' +
      'try{' +
        '!' + step + '.done&&' + iter + '.return&&(' + toYield(iter + '.return()', ast) + ')' +
      '}finally{' +
        'if(' + error + ')throw ' + error +
      '}' +
    '}';

  editor.prependRight(node.start, head);
  editor.move(node.left.start, node.left.end, node.body.start + 1);
  editor.appendLeft(node.left.end, '=' + step + '.value;');
  editor.appendLeft(node.left.start, left);
  editor.prependRight(node.right.end, right);
  editor.appendLeft(node.end, tail);
}

function toYield(expr, ast) {
  var envRecord = currentScope(ast);
  return envRecord.generator ? 'yield{__await:' + expr + '}' : 'yield ' + expr;
}

function currentScope(ast) {
  return ast.scope[ast.scope.length - 1];
}

// Given the AST output of babylon parse, walk through in a depth-first order,
// calling methods on the given visitor, providing editor as the first argument.
function visit(ast, editor, visitor) {
  var stack;
  var parent = ast;
  var keys = ['program'];
  var index = -1;

  do {
    index++;
    if (stack && index === keys.length) {
      parent = stack.parent;
      keys = stack.keys;
      index = stack.index;
      var node = parent[keys[index]];
      if (node.type) {
        var visitFn = visitor[node.type] && visitor[node.type].leave;
        visitFn && visitFn(editor, node, ast, stack);
      }
      stack = stack.prev;
    } else {
      var node = parent[keys[index]];
      if (node && typeof node === 'object' && (node.type || node.length)) {
        stack = { parent: parent, keys: keys, index: index, prev: stack };
        parent = node;
        keys = Object.keys(node);
        index = -1;
        if (node.type) {
          var visitFn = visitor[node.type] && visitor[node.type].enter;
          visitFn && visitFn(editor, node, ast, stack);
        }
      }
    }
  } while (stack);
}

// Given an array of sorted tokens, find the index of the token which contains
// the given offset. Uses binary search for O(log N) performance.
function findTokenIndex(tokens, offset) {
  var min = 0;
  var max = tokens.length - 1;

  while (min <= max) {
    var ptr = (min + max) / 2 | 0;
    var token = tokens[ptr];
    if (token.end <= offset) {
      min = ptr + 1;
    } else if (token.start > offset) {
      max = ptr - 1;
    } else {
      return ptr;
    }
  }

  return ptr;
}
