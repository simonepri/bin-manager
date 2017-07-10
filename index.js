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
   * @param {String} [bin]
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
   * @param {Object}   [opts]
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
   * @param {Object}   [opts]
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
   * @param {Array}    [argv]
   * @param {Object}   [opts]
   * @param {Function} callback
   * @api public
   */

  function run(argv, opts, callback) {
    const args = [].slice.call(arguments);

    callback = args.pop();
    if (args.length === 2) {
      opts = args.pop() || {};
      argv = args.pop() || [];
    } else if (typeof args[0] === 'object' && !Array.isArray(args[0])) {
      opts = args.pop() || {};
    } else if (Array.isArray(args[0])) {
      argv = args.pop() || [];
    } else {
      argv = [argv] || [];
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
   * @param {Object}   [opts]
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
