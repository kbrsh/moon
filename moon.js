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
                        update(start, end, key, model, el);
                    }
                });
                update(start, end, key, model, el);
            }
        }
    }
    
    var update = function(start, end, key, model, el) {
        var pattern = start + key + end;
        el.innerHTML = el.innerHTML.replace(new RegExp(pattern, 'g'), model[key]);
    }
    
    window.Moon = Moon;
    
    
    
})(window);