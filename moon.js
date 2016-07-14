(function(window) {
    
    function Moon(opts) {
        var el = document.querySelector(opts.el),
            model = opts.model,
            children = el.childNodes
            
        // one way data binding
        for (var key in model) {
            if (model.hasOwnProperty(key)) {
                el.innerHTML = el.innerHTML.replace("{{" + key + "}}", model[key]);
            }
        }   
    }
    
    
})(window);