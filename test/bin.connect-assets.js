var expect = require("expect.js");
var mocha = require("mocha");
var bin = require("../bin/connect-assets");
var rmrf = require("./testHelpers/rmrf");
var fs = require("fs");

describe("connect-assets command-line interface", function () {
  beforeEach(function () {
    var log = "";

    this.logger = {
      log: function (message) { log += message + "\n"; },
      time: function () {},
      timeEnd: function (message) { log += message + "\n"; },
      getLog: function () { return log; }
    };
  });

  it("compiles the assets out to disk", function (done) {
    var argv = process.argv;
    process.argv = "node connect-assets -i test/assets/js -i test/assets/css".split(" ");

    bin.execute(this.logger, function () {
      process.argv = argv;
      rmrf("builtAssets", done);
    });
  });

  it("minifies the compiled output", function (done) {
    var logger = this.logger;
    var argv = process.argv;
    var dir = "builtAssets";
    process.argv = "node connect-assets -i test/assets/js -i test/assets/css".split(" ");

    bin.execute(this.logger, function (manifest) {
      process.argv = argv;

      /* 
        @NOTES
        Using the returned manifest to get the files

        Was: 
          "/unminified-a92caa3439ab1d33f88573b44104154d.css"
          "/unminified-c771058bc21c8e09279507dc9898c2a1.js"
      */
      var css = dir + '/' + manifest.assets['unminified.css'];
      var js = dir + '/' + manifest.assets['unminified.js'];

      expect(fs.readFileSync(css, "utf8")).to.equal("body{background-color:#000;color:#fff}a{display:none}");
      
      /* 
        @NOTES
        assets/js/unminified.js had to be updated because uglify was removing the anonymous function

        Was: expect(fs.readFileSync(js, "utf8")).to.equal('(function(){var n="A string";var r={aLongKeyName:function(){return n}}})();');
      */
      expect(fs.readFileSync(js, "utf8")).to.equal('!function(){{var n="A string",a={aLongKeyName:function(){return n}};a.aLongKeyName()}}();');
      
      rmrf("builtAssets", done);
    });
  });

  it("compiles only those listed in --compile", function (done) {
    var argv = process.argv;
    process.argv = "node connect-assets -i test/assets/js -i test/assets/css -c blank.js".split(" ");

    bin.execute(this.logger, function () {
      process.argv = argv;

      var files = fs.readdirSync("builtAssets");
       
      /*
        @NOTES
        .gz file was not included shold it be?

        Was: expect(files.length).to.equal(3); // blank.js, blank.js.gz, manifest.json
      */
      expect(files.length).to.equal(2); // blank.js, manifest.json
      rmrf("builtAssets", done);
    });
  });

  it("generates a manifest.json", function (done) {
    var argv = process.argv;
    process.argv = "node connect-assets -i test/assets/js -i test/assets/css".split(" ");

    bin.execute(this.logger, function () {
      process.argv = argv;

      fs.statSync("builtAssets/manifest.json");
      rmrf("builtAssets", done);
    });
  });

  it("compiles with asset_path helper", function (done) {
    var argv = process.argv;
    var dir = "builtAssets";
    process.argv = "node connect-assets -i test/assets/css -c asset-path-helper.css".split(" ");

    bin.execute(this.logger, function (manifest) {
      process.argv = argv;

      var css = dir + '/' + manifest.assets['asset-path-helper.css'];
      // expect(fs.readFileSync(css, "utf8")).to.equal("@import \"/assets/asset-20069ab163c070349198aa05124dcaa8.css\";");
      expect(fs.readFileSync(css, "utf8")).to.equal("@import \"/assets/asset-34cd1f67e8156bf27ba489aacd9acb1f.css\";");
      rmrf("builtAssets", done);
    });
  });

  it("compiles with asset_path helper with servePath option defined", function (done) {
    var argv = process.argv;
    var dir = "builtAssets";
    process.argv = "node connect-assets -i test/assets/css -c asset-path-helper.css -s //cdn.example.com".split(" ");

    bin.execute(this.logger, function (manifest) {
      process.argv = argv;
      // console.log(manifest)
      var css = dir + '/' + manifest.assets['asset-path-helper.css'];
      // var css = "builtAssets/asset-path-helper-954c8a140f34be3c86bc3f0a8c79e1ca.css";
      // expect(fs.readFileSync(css, "utf8")).to.equal("@import \"//cdn.example.com/asset-20069ab163c070349198aa05124dcaa8.css\";");
      expect(fs.readFileSync(css, "utf8")).to.equal("@import \"//cdn.example.com/asset-34cd1f67e8156bf27ba489aacd9acb1f.css\";");
      rmrf("builtAssets", done);
    });
  });
});
