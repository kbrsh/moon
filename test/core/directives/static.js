// describe('Static Directive', function() {
//   var staticEl = createTestElement("static", '<h1><span m-static>{{msg}}</span><h1>');
//   var span = staticEl.firstChild.firstChild;
//
//   var app = new Moon({
//     root: "#static",
//     data: {
//       msg: "Hello Moon!"
//     }
//   });
//
//   it('should initialize with dynamic value', function() {
//     return wait(function() {
//       expect(span.innerHTML).to.equal("Hello Moon!");
//     });
//   });
//
//   it('should not update with dynamic value', function() {
//     app.set("msg", "Changed");
//     return wait(function() {
//       expect(span.innerHTML).to.equal("Hello Moon!");
//     });
//   });
//
//   it('should not be present at runtime', function() {
//     expect(span.getAttribute("m-static")).to.be['null'];
//   });
//
//   describe("Nested", function() {
//     var staticNestedEl = createTestElement("staticNested", '<h1 m-static><span m-static>{{msg}}</span><h1>');
//     var h1 = staticEl.firstChild;
//     var span = h1.firstChild;
//
//     var app = new Moon({
//       root: "#staticNested",
//       data: {
//         msg: "Hello Moon!"
//       }
//     });
//
//     it('should initialize with dynamic value', function() {
//       return wait(function() {
//         expect(span.innerHTML).to.equal("Hello Moon!");
//       });
//     });
//
//     it('should not update with dynamic value', function() {
//       app.set("msg", "Changed");
//       return wait(function() {
//         expect(span.innerHTML).to.equal("Hello Moon!");
//       });
//     });
//
//     it('should not be present at runtime', function() {
//       expect(h1.getAttribute("m-static")).to.be['null'];
//       expect(span.getAttribute("m-static")).to.be['null'];
//     });
//   });
// });
