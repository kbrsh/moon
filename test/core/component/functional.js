// describe("Functional Component", function() {
//   it("should render HTML", function() {
//     var functional = createTestElement("functional", "<functional-component></functional-component>");
//
//     Moon.extend("functional-component", {
//       functional: true,
//       render: function(m, ctx) {
//         return m("h1", {attrs: {}}, {dynamic: 1}, []);
//       }
//     });
//
//     new Moon({
//       root: "#functional"
//     });
//
//     return wait(function() {
//       expect(functional.firstChild.nodeName.toLowerCase()).to.equal("h1");
//     });
//   });
//
//   describe("Props", function() {
//     var functionalProps = createTestElement("functionalProps", "<functional-component-props someprop='{{parentMsg}}'></functional-component-props>");
//
//     Moon.extend("functional-component-props", {
//       functional: true,
//       props: ["someprop"],
//       render: function(m, ctx) {
//         return m("h1", {attrs: {}}, {dynamic: 1}, [
//           m("#text", {dynamic: 1}, ctx.data.someprop)
//         ]);
//       }
//     });
//
//     var app = new Moon({
//       root: "#functionalProps",
//       data: {
//         parentMsg: "Hello Moon!"
//       }
//     });
//
//     it("should render with props", function() {
//       return wait(function() {
//         expect(functionalProps.firstChild.innerHTML).to.equal("Hello Moon!");
//       });
//     });
//
//     it("should render when props are updated", function() {
//       app.set("parentMsg", "Changed");
//
//       return wait(function() {
//         expect(functionalProps.firstChild.innerHTML).to.equal("Changed");
//       });
//     });
//   });
//
//   describe("Insertion", function() {
//     var functionalInsertion = createTestElement("functionalInsertion", '<functional-component-insertion>Default Slot Content</functional-component-insertion>');
//
//     Moon.extend("functional-component-insertion", {
//       functional: true,
//       render: function(m, ctx) {
//         return m("div", {attrs: {}}, {dynamic: 1}, [
//           m("h1", {}, {dynamic: 1}, ctx.insert)
//           // m("h1", {attrs: {}}, {dynamic: 1}, ctx.slots.named)
//         ]);
//       }
//     });
//
//     new Moon({
//       root: "#functionalInsertion"
//     });
//
//     var h1 = null,
//       h1_2 = null;
//
//     it("should render the default insertion", function() {
//       return wait(function() {
//         h1 = functionalInsertion.firstChild.firstChild;
//         expect(h1.innerHTML).to.equal("Default Slot Content");
//       });
//     });
//
//     // it("should render a named slot", function() {
//     //   h1_2 = h1.nextSibling;
//     //   expect(h1_2.innerHTML).to.equal("<span>Named Slot Content</span>");
//     // });
//   });
// });
