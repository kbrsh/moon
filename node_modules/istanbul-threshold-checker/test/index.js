var _ = require('lodash');
var assert = require('assert');
var checker = require('../index');
var istanbul = require('istanbul');
var sinon = require('sinon');

describe('checkThreshold', function() {
    it('checks percentage threshold passes', function() {
        var coverage = { total: 125, covered: 75, skipped: 0, pct: 60 };
        assert.deepEqual(checker.checkThreshold(60, coverage), { failed: false, value: 60 });
    });

    it('checks percentage threshold fails', function() {
        var coverage = { total: 125, covered: 75, skipped: 0, pct: 60 };
        assert.deepEqual(checker.checkThreshold(80, coverage), { failed: true, value: 60 });
    });

    it('checks gap threshold passes', function() {
        var coverage = { total: 50, covered: 40, skipped: 0, pct: 80 };
        assert.deepEqual(checker.checkThreshold(-10, coverage), { failed: false, value: -10 });
    });

    it('checks gap threshold fails', function() {
        var coverage = { total: 50, covered: 40, skipped: 0, pct: 80 };
        assert.deepEqual(checker.checkThreshold(-5, coverage), { failed: true, value: -10 });
    });

    it('skips thresholds which are false', function() {
        var coverage = { total: 50, covered: 40, skipped: 0, pct: 80 };
        var expected = { failed: false, skipped: true };
        assert.deepEqual(checker.checkThreshold(null, coverage), expected);
        assert.deepEqual(checker.checkThreshold(undefined, coverage), expected);
        assert.deepEqual(checker.checkThreshold(false, coverage), expected);
        assert.deepEqual(checker.checkThreshold(0, coverage), expected);
    });
});

describe('checkThresholds', function() {
    it('checks all thresholds', function() {
        var thresholds = { lines: -20, statements: 60, functions: -50, branches: 66 };
        var coverage = {
            lines: { total: 100, covered: 90, skipped: 0, pct: 90 },
            statements: { total: 120, covered: 60, skipped: 0, pct: 50 },
            functions: { total: 80, covered: 20, skipped: 0, pct: 25 },
            branches: { total: 90, covered: 60, skipped: 0, pct: 66.67 }
        };

        assert.deepEqual(checker.checkThresholds(thresholds, coverage), [
            { value: -10, failed: false },
            { value: 50, failed: true },
            { value: -60, failed: true },
            { value: 66.67, failed: false }
        ]);
    });

    it('checks all thresholds in the same order, regardless of the coverage object', function() {
        var thresholds = { lines: -20, statements: 60, functions: -50, branches: 66 };
        var coverage = {
            statements: { total: 120, covered: 60, skipped: 0, pct: 50 },
            functions: { total: 80, covered: 20, skipped: 0, pct: 25 },
            lines: { total: 100, covered: 90, skipped: 0, pct: 90 },
            branches: { total: 90, covered: 60, skipped: 0, pct: 66.67 }
        };

        assert.deepEqual(checker.checkThresholds(thresholds, coverage), [
            { value: -10, failed: false },
            { value: 50, failed: true },
            { value: -60, failed: true },
            { value: 66.67, failed: false }
        ]);
    });

    it('checks thresholds using a single value', function() {
        var thresholds = 60;
        var coverage = {
            lines: { total: 100, covered: 90, skipped: 0, pct: 90 },
            statements: { total: 120, covered: 60, skipped: 0, pct: 50 },
            functions: { total: 80, covered: 20, skipped: 0, pct: 25 },
            branches: { total: 90, covered: 60, skipped: 0, pct: 66.67 }
        };

        assert.deepEqual(checker.checkThresholds(thresholds, coverage), [
            { value: 90, failed: false },
            { value: 50, failed: true },
            { value: 25, failed: true },
            { value: 66.67, failed: false }
        ]);
    });
});

describe('checkFailures', function() {
    beforeEach(function() {
        this.env = sinon.sandbox.create();
        this.env.stub(istanbul.utils, 'summarizeCoverage').returns({
            lines: { total: 100, covered: 90, skipped: 0, pct: 90 },
            statements: { total: 120, covered: 60, skipped: 0, pct: 50 },
            functions: { total: 80, covered: 20, skipped: 0, pct: 25 },
            branches: { total: 90, covered: 60, skipped: 0, pct: 66.67 }
        });

        this.env.stub(istanbul.utils, 'summarizeFileCoverage')
            .onCall(0).returns({
                lines: { total: 100, covered: 80, skipped: 0, pct: 80 },
                statements: { total: 120, covered: 120, skipped: 0, pct: 100 },
                functions: { total: 80, covered: 80, skipped: 0, pct: 100 },
                branches: { total: 90, covered: 90, skipped: 0, pct: 100 }
            })
            .onCall(1).returns({
                lines: { total: 100, covered: 90, skipped: 0, pct: 90 },
                statements: { total: 120, covered: 60, skipped: 0, pct: 50 },
                functions: { total: 80, covered: 20, skipped: 0, pct: 25 },
                branches: { total: 90, covered: 90, skipped: 0, pct: 100 }
            });

        this.coverage = {
            '/file/test.js': {},
            '/file/test2.js': {}
        };
    });

    afterEach(function() {
        this.env.restore();
    })

    it('checks global and per file thresholds', function() {
        var thresholds = {
            global: { lines: 90, statements: 100, functions: 100, branches: 100 },
            each: { lines: 100, statements: 100, functions: 100, branches: 100 }
        };

        assert.deepEqual(checker.checkFailures(thresholds, this.coverage), [
            {
                type: 'lines',
                global: { failed: false, value: 90 },
                each: { failed: true, failures: ['/file/test.js', '/file/test2.js'] }
            }, {
                type: 'statements',
                global: { failed: true, value: 50 },
                each: { failed: true, failures: ['/file/test2.js'] }
            }, {
                type: 'functions',
                global: { failed: true, value: 25 },
                each: { failed: true, failures: ['/file/test2.js'] }
            }, {
                type: 'branches',
                global: { failed: true, value: 66.67 },
                each: { failed: false, failures: [] }
            }
        ]);
    });

    it('checks simple thresholds', function() {
        var thresholds = {
            each: 90,
            global: 80
        };

        assert.deepEqual(checker.checkFailures(thresholds, this.coverage), [
            {
                type: 'lines',
                global: { failed: false, value: 90 },
                each: { failed: true, failures: ['/file/test.js'] }
            }, {
                type: 'statements',
                global: { failed: true, value: 50 },
                each: { failed: true, failures: ['/file/test2.js'] }
            }, {
                type: 'functions',
                global: { failed: true, value: 25 },
                each: { failed: true, failures: ['/file/test2.js'] }
            }, {
                type: 'branches',
                global: { failed: true, value: 66.67 },
                each: { failed: false, failures: [] }
            }
        ]);
    });

    it('checks only global thresholds', function() {
        var thresholds = {
            global: { lines: 90, statements: 100, functions: 100, branches: 100 }
        };

        assert.deepEqual(checker.checkFailures(thresholds, this.coverage), [
            { type: 'lines', global: { failed: false, value: 90 } },
            { type: 'statements', global: { failed: true, value: 50 } },
            { type: 'functions', global: { failed: true, value: 25 } },
            { type: 'branches', global: { failed: true, value: 66.67 } }
        ]);
    });

    it('checks only per file thresholds', function() {
        var thresholds = {
            each: { lines: 90, statements: 100, functions: 100, branches: 100 }
        };

        assert.deepEqual(checker.checkFailures(thresholds, this.coverage), [
            { type: 'lines', each: { failed: true, failures: ['/file/test.js'] } },
            { type: 'statements', each: { failed: true, failures: ['/file/test2.js'] } },
            { type: 'functions', each: { failed: true, failures: ['/file/test2.js'] } },
            { type: 'branches', each: { failed: false, failures: [] } }
        ]);
    });
});
