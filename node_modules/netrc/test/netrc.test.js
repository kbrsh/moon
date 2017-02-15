/**
 * Module dependencies
 */
var netrc = require("..")
  , should = require("should")
  , fs = require("fs");

var valid = fs.readFileSync(__dirname+"/fixtures/netrc-valid", "utf-8")
  , invalid = fs.readFileSync(__dirname+"/fixtures/netrc-invalid", "utf-8")
  , validWithComment = fs.readFileSync(__dirname+"/fixtures/netrc-valid-w-comment", "utf-8");

describe("netrc", function() {

  describe("read", function() {
    it("should parse a valid file", function() {
      var machines = netrc(__dirname+"/fixtures/netrc-valid");
      should.exist(machines);
      machines.should.have.property("github.com");
      machines["github.com"].should.have.property("login");
      machines["github.com"].login.should.eql("CamShaft");
      machines["github.com"].should.have.property("password");
      machines["github.com"].password.should.eql("123");
    });

    it("should parse a valid file with comments", function() {
      var machines = netrc(__dirname+"/fixtures/netrc-valid-w-comment");
      should.exist(machines);
      machines.should.have.property("github.com");
      machines["github.com"].should.have.property("login");
      machines["github.com"].login.should.eql("CamShaft");
      machines["github.com"].should.have.property("password");
      machines["github.com"].password.should.eql("123");
    });

    it("should not parse an invalid string", function() {
      var machines = netrc(__dirname+"/fixtures/netrc-invalid");
      should.exist(machines);
      Object.keys(machines).length.should.eql(0);
    });
  });

  describe("parse", function() {
    it("should parse a valid string", function() {
      var machines = netrc.parse(valid);
      should.exist(machines);
      machines.should.have.property("github.com");
      machines["github.com"].should.have.property("login");
      machines["github.com"].login.should.eql("CamShaft");
      machines["github.com"].should.have.property("password");
      machines["github.com"].password.should.eql("123");
    });

    it("should parse a valid string (pulled from file with comments)", function() {
      var machines = netrc.parse(validWithComment);
      should.exist(machines);
      machines.should.have.property("github.com");
      machines["github.com"].should.have.property("login");
      machines["github.com"].login.should.eql("CamShaft");
      machines["github.com"].should.have.property("password");
      machines["github.com"].password.should.eql("123");
    });

    it("should not parse an invalid string", function() {
      var machines = netrc.parse(invalid);
      should.exist(machines);
      Object.keys(machines).length.should.eql(0);
    });
  });

  describe('format', function(){
   it('should generate text that parses to the original', function(){
     var machines = netrc.parse(valid);

     var text = netrc.format(machines);
     should.exist(text);
     text.should.include('machine github.com');
     text.should.include('login CamShaft');
     text.should.include('password 123');

     var parsed = netrc.parse(text);
     parsed.should.have.property('github.com');
     parsed["github.com"].should.have.property("login");
     parsed["github.com"].login.should.eql("CamShaft");
     parsed["github.com"].should.have.property("password");
     parsed["github.com"].password.should.eql("123");
   });
  });

});
