'use strict';
const fs = require('fs');
const join = require('path').join;
const lazyReq = require('lazy-req')(require);

const del = lazyReq('del');
const download = lazyReq('download');
const osFilterObj = lazyReq('os-filter-obj');
const execa = lazyReq('execa');

/**
 * Initialize the manager
 *
 * @param {String} destFolder
 * @param {String} slugName
 * @api public
 */
function binManager(destFolder, slugName) {
  const _src = [];
  const _dest = destFolder || '';
  const _slug = slugName || '';
  let _bin = '';

  /**
   * Get or set files to download
   *
   * @param {String} src
   * @param {String} os
   * @param {String} arch
   * @api public
   */

  function src(uri, os, arch) {
    if (arguments.length === 0) {
      return _src;
    }

    _src.push({
      uri,
      os,
      arch
    });

    return this;
  }

  /**
   * Get or set the binary
   *
   * @param {String} bin
   * @api public
   */

  function use(bin) {
    if (arguments.length === 0) {
      return _bin;
    }

    _bin = bin;
    return this;
  }

  /**
   * Get path to the binary folder
   *
   * @api public
   */

  function path() {
    return join(_dest, _slug);
  }

  /**
   * Get path to the binary
   *
   * @api public
   */

  function bin() {
    return join(_dest, _slug, _bin);
  }

  /**
   * Get paths to the remote binaries
   *
   * @api public
   */

  function remote() {
    return osFilterObj()(src());
  }

  /**
   * Load existing files or download them
   *
   * @param {Function} callback
   * @api public
   */

  function load(opts, callback) {
    if (!_bin) {
      callback(new Error('No binary path setted. Call use(path).'));
      return;
    }
    fs.stat(bin(), err => {
      if (err && err.code === 'ENOENT') {
        fetch(opts, callback);
        return;
      }

      if (err) {
        callback(err);
        return;
      }

      callback();
    });
  }

  /**
   * Delete existing files
   *
   * @param {Function} callback
   * @api public
   */

  function unload(opts, callback) {
    del()(path(), opts).then(() => {
      callback();
    }).catch(err => {
      callback(err);
    });
  }

  /**
   * Run the binray
   *
   * @param {Function} callback
   * @api public
   */

  function run(argv, opts, callback) {
    if (!Array.isArray(argv)) {
      opts = argv;
      callback = opts;
      argv = [];
    }
    if (typeof opts !== 'object') {
      callback = opts;
      opts = {};
    }
    load(err => {
      if (err) {
        callback(err);
        return;
      }
      execa()(bin(), argv, opts).then(result => {
        callback(null, result);
      }).catch(err => {
        callback(err);
      });
    });
  }

  /**
   * Download files
   *
   * @param {Function} callback
   * @api pivate
   */

  function fetch(opts, callback) {
    const files = remote();

    if (files.length === 0) {
      callback(new Error('No binary found matching your system. It\'s probably not supported.'));
      return;
    }
    opts = opts || {extract: true};

    const bfpath = path();

    Promise.all(
      files.map(f => download()(f.uri, bfpath, opts))
    ).then(data => {
      callback(null, data);
    }).catch(err => {
      callback(err);
    });
  }

  return {
    src,
    use,
    path,
    bin,
    remote,
    load,
    unload,
    run
  };
}

module.exports = binManager;
