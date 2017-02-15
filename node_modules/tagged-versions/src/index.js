/**
 * Query git for semantic version tag.
 *
 * @typedef {{tag: string, version: string, hash: string, date: Date}} Commit
 */

'use strict';

const semver = require('semver');
const childProcess = require('child-process-promise');

const tagRegex = /tag:\s*([^,)]+)/g;
const commitDetailsRegex = /^(.+);(.+);(.+)$/;

/**
 * Run shell command and resolve with stdout content
 *
 * @param  {string} command Shell command
 * @return {Promise<string,Error>}
 */
function runCommand(command) {
  return childProcess.exec(command)
    .then(result => result.stdout);
}

/**
 * Get all tags with a semantic version name out of a list of Refs
 *
 * @param  {string} refs List of refs
 * @return {Arrays<Commit>}
 */
function getSemanticCommits(refs) {
  const tagNames = [];
  let match = [];

  // Finding successive matches
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec#Finding_successive_matches
  while (match) {
    match = tagRegex.exec(refs);

    if (match) {
      tagNames.push(match[1]);
    }
  }

  return tagNames.map(name => ({
    tag: name,
    version: semver.valid(name),
    hash: null,
    date: null,
  })).filter(
    tag => tag.version != null
  );
}

function isString(v) {
  return typeof v === 'string';
}

/**
 * Parse commit into an array of tag object.
 *
 * @param  {string} line Line to parse
 * @return {Array<Commit>}
 */
function parseLine(line) {
  const match = commitDetailsRegex.exec(line);

  if (!match || match.length < 4) {
    return [];
  }

  const tags = getSemanticCommits(match[1]);
  const hash = match[2].trim();
  const date = new Date(match[3].trim());

  return tags.map(tag => Object.assign(tag, { hash, date }));
}

/**
 * Merge the arrays of elements into one array.
 *
 * @param  {Array<Array<any>>} arrays The list of array to merge
 * @return {Array<any>}
 */
function flatten(tags) {
  return Array.prototype.concat.apply([], tags);
}

/**
 * Filter tags with range.
 *
 * Skip filtering if the range is not set.
 *
 * @param  {Array<Commit>} tags  List of tags
 * @param  {string}     range Semantic range to filter with.
 * @return {Array<Commit>}
 */
function filterByRange(tags, range) {
  if (!range) {
    return tags;
  }

  return tags.filter(tag => semver.satisfies(tag.version, range));
}

/**
 * Compare tag by version.
 *
 * @param  {Commit} a First tag
 * @param  {Commit} b Second tag
 * @return {number}
 */
function compareCommit(a, b) {
  return semver.rcompare(a.version, b.version);
}

/**
 * Get list of tag with a  semantic version name.
 *
 * @param  {object|string} options       Options map or range string
 * @param  {string}        options.range Semantic range to filter tag with
 * @param  {string}        options.rev   Revision range to filter tag with
 * @return {Promise<Array<Commit>,Error>}
 */
function getList(options) {
  const range = isString(options) ? options : (options && options.range);
  const rev = options && options.rev;
  const fmt = '--pretty="%d;%H;%ci" --decorate=short';
  const cmd = rev ? `git log --simplify-by-decoration ${fmt} ${rev}` : `git log --no-walk --tags ${fmt}`;

  return runCommand(cmd).then((output) => {
    const lines = output.split('\n');
    const tags = flatten(lines.map(parseLine));

    return filterByRange(tags, range).sort(compareCommit);
  });
}

/**
 * Get most recent tag.
 *
 * @param  {object|string} options       Options map or range string
 * @param  {string}        options.range Semantic range to filter tag with
 * @param  {string}        options.rev   Revision range to filter tag with
 * @return {Promise<Commit,Error>}
 */
function getLastVersion(options) {
  return getList(options)
    .then(list => list[0]);
}

module.exports = {
  getList,
  getLastVersion,
};
