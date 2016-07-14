(function(window) {
    
    function Moon(opts) {
        var el = document.querySelector(opts.el),
            model = opts.model,
            children = el.childNodes,
            start = opts.start || "{{",
            end = opts.end || "}}";
            
        // one way data binding
        for (var key in model) {
            if (model.hasOwnProperty(key)) {
                var pattern = start + key + end;
                el.innerHTML = el.innerHTML.replace(new RegExp(pattern, 'g'), model[key]);
            }
        }
    }
    
    
})(window);