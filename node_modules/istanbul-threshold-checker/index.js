var _ = require('lodash');
var utils = require('istanbul').utils;

var TYPES = ['lines', 'statements', 'functions', 'branches'];

var checker = module.exports = {
    checkThreshold: function(threshold, summary) {
        var result = { failed: false };

        // Check for no threshold
        if (!threshold) {
            result.skipped = true;
            return result;
        }

        // Check percentage threshold
        if (threshold > 0) {
            result.value = summary.pct;
            result.failed = result.value < threshold;
        }
        // Check gap threshold
        else {
            result.value = summary.covered - summary.total;
            result.failed = result.value < threshold;
        }

        return result;
    },

    checkThresholds: function(thresholds, summary) {
        return TYPES.map(function(type) {
            // If the threshold is a number use it, otherwise lookup the threshold type
            var threshold = typeof thresholds === 'number' ? thresholds : thresholds && thresholds[type];
            return checker.checkThreshold(threshold, summary[type]);
        });
    },

    checkFailures: function(thresholds, coverage) {
        var summary = TYPES.map(function(type) {
            return { type: type };
        });

        // If there are global thresholds check overall coverage
        if (thresholds.global) {
            var global = checker.checkThresholds(thresholds.global, utils.summarizeCoverage(coverage));
            // Inject into summary
            summary.map(function(metric, i) {
                metric.global = global[i];
            });
        }

        // If there are individual thresholds check coverage per file
        if (thresholds.each) {
            var failures = { statements: [], branches: [], lines: [], functions: [] };
            _.each(coverage, function(fileCoverage, filename) {
                // Check failures for a file
                var each = checker.checkThresholds(
                    thresholds.each,
                    utils.summarizeFileCoverage(fileCoverage)
                );
                _.map(each, function(item, i) {
                    if (item.failed) failures[TYPES[i]].push(filename);
                });
            });

            // Inject into summary
            summary.map(function(metric) {
                metric.each = {
                    failed: failures[metric.type].length > 0,
                    failures: failures[metric.type]
                };
            });
        }

        return summary;
    }
};
