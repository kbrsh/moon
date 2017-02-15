/*
  This is a big dummy project file to test out lots of features of gulp-include
  working together in harmony.
*/

/*
  I'm going to be crazy and import some files inline here in a list.
    //=include deep_path/b.js
    //=include deep_path/deeper_path/c.js
    //=require deep_path/b.js
    //=require deep_path/deeper_path/c.js
    //=include deep_path/b.js
    //=include deep_path/deeper_path/c.js
    //=require deep_path/b.js
    //=require deep_path/deeper_path/c.js
    #=include deep_path/b.js
    #=include deep_path/deeper_path/c.js
    #=require deep_path/b.js
    #=require deep_path/deeper_path/c.js
*/

// This is an inline comment
// Tree inclusion
//=include deep_path/**/*.js
