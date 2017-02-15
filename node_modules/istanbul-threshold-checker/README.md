# Istanbul threshold checker
Checks an instanbul coverage report against thresholds

## Usage

Install with npm

    npm install istanbul-threshold-checker

Use by feeding a coverge report from istanbul:

    var collector = new require('istanbul').Collector();
    collector.add(coverageJsonObject);
    var coverage = collector.getFinalCoverage();

    var checker = require('istanbul-threshold-checker');
    var results = checker.checkFailures(thresholds, coverage);


## Thresholds

Thresholds can be specified in a variety of formats. Each threshold value can be specified as:

- A positive number - checks coverage meets this value as a percentage
- A negative number - checks there are no more coverage gaps than this number
- Any falsey value - skips checking this threshold

Thresholds can be checked across all files or against each file using `global` and `each` keys respectively:

    var thresholds = {
        global: {
            statements: 100,
            branches: 90,
            lines: 70,
            functions: -10
        },
        each: {
            statements: 0,
            branches: -20,
            lines: 60,
            functions: 100
        }
    };

You can exclude `global` or `each` if you only want to check global or per file coverage.

Each set of thresholds can also be a single value, which checks that value across all metrics:

    var thresholds = {
        global: 80,
        each: -10
    };


## Results

The checker returns results in the following format:

    [{
        type: 'lines',
        global: { failed: false, value: 90 },
        each: { failed: true, failures: ['/file/test.js'] }
    }, {
        type: 'statements',
        global: { failed: true, value: 50 },
        each: { failed: true, failures: ['/file/test2.js'] }
    }, {
        type: 'functions',
        global: { failed: true, value: -10 },
        each: { failed: true, failures: ['/file/test2.js'] }
    }, {
        type: 'branches',
        global: { failed: true, value: 66.67 },
        each: { failed: false, failures: [] }
    }]
