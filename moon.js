(function(window) {
    
    function Moon(opts) {
        var el = document.querySelector(opts.el),
            model = opts.model,
            start = opts.start || "{{",
            end = opts.end || "}}";
            
            
        // one way data binding
        for (var key in model) {
            if (model.hasOwnProperty(key)) {
                var obj = {};
                Object.defineProperty(obj, key, {
                    get: function() {
                        return model[key];
                    },
                    set: function(val) {
                        model[key] = val;
                        update(start, end, key, model[key], el);
                    }
                });
                update(start, end, key, model[key], el);
            }
        }
        
        // two way data binding
        for (var i = 0; i < el.children.length; i++) {
            var child = el.children[i];
            if (child.hasAttribute('m-model')) {
                var modelVal = child.value;
                var modelName = child.getAttribute("m-model");
                this.modal[modelName] = modelVal;
                
                child.addEventListener(['keyup', 'blur'], function(e) {
                    var name = e.target.getAttribute("m-model");
                    if (name) {
                        if (e.target.value != model[name]) {
                            this.model[name] = e.target.value;
                        }
                    }
                });
            }
        }
    }
    
    var update = function(start, end, key, replace, el) {
        var pattern = start + key + end;
        el.innerHTML = el.innerHTML.replace(new RegExp(pattern, 'g'), replace);
    }
    
    window.Moon = Moon;
    
    
})(window);