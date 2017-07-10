import fs from 'fs';
import path from 'path';
import nock from 'nock';
import pify from 'pify';
import rimraf from 'rimraf';
import test from 'ava';
import tempfile from 'tempfile';
import binManager from './';

const fsP = pify(fs);
const rimrafP = pify(rimraf);
const fixture = path.join.bind(path, __dirname, 'fixtures');

test.beforeEach(() => {
  nock('http://foo.com')
    .get('/gifsicle.tar.gz')
    .replyWithFile(200, fixture('gifsicle-' + process.platform + '.tar.gz'))
    .get('/gifsicle-darwin.tar.gz')
    .replyWithFile(200, fixture('gifsicle-darwin.tar.gz'))
    .get('/gifsicle-win32.tar.gz')
    .replyWithFile(200, fixture('gifsicle-win32.tar.gz'))
    .get('/test.js')
    .replyWithFile(200, __filename);
});

test('expose a constructor', t => {
  t.is(typeof binManager, 'function');
});

test('source should be empty', t => {
  const bin = binManager();
  const src = bin.src();
  t.is(src.length, 0);
});

test('add a source', t => {
  const bin = binManager()
    .src('http://foo.com/bar.tar.gz');
  const src = bin.src();
  t.is(src.length, 1);
  t.is(src[0].uri, 'http://foo.com/bar.tar.gz');
});

test('add multiple sources', t => {
  const bin = binManager()
    .src('http://foo.com/bar.tar.gz')
    .src('http://foo.com/gifsicle-darwin.tar.gz');
  const src = bin.src();
  t.is(src.length, 2);
  t.is(src[0].uri, 'http://foo.com/bar.tar.gz');
  t.is(src[1].uri, 'http://foo.com/gifsicle-darwin.tar.gz');
});

test('add a source to a specific os', t => {
  const bin = binManager()
    .src('http://foo.com', process.platform);
  const src = bin.src();
  t.is(src[0].os, process.platform);
});

test('binary file should be empty', t => {
  const bin = binManager();
  const use = bin.use();
  t.is(use, '');
});

test('set the binary file', t => {
  const bin = binManager()
    .use('foo');
  const use = bin.use();
  t.is(use, 'foo');
});

test('binary folder path should be the root', t => {
  const bin = binManager();
  const bfpath = bin.path();
  t.is(bfpath, '.');
});

test('set the binary folder path', t => {
  const bin = binManager(path.join(__dirname, 'tmp'), 'bar');
  const bfpath = bin.path();
  t.is(bfpath, path.join(__dirname, 'tmp', 'bar'));
});

test('binary path should be the root', t => {
  const bin = binManager();
  const bpath = bin.bin();
  t.is(bpath, '.');
});

test('set the binary path witouth dest', t => {
  const bin = binManager('', 'bar')
    .use('foo');
  const bpath = bin.bin();
  t.is(bpath, path.join('bar', 'foo'));
});

test('set the binary path witouth slug', t => {
  const bin = binManager('tmp')
    .use('foo');
  const bpath = bin.bin();
  t.is(bpath, path.join('tmp', 'foo'));
});

test('set the binary path', t => {
  const bin = binManager('tmp', 'bar')
    .use('foo');
  const bpath = bin.bin();
  t.is(bpath, path.join('tmp', 'bar', 'foo'));
});

test('get the paths to download to a specific os', t => {
  const bin = binManager()
    .src('http://foo.com', process.platform)
    .src('http://magic.com', 'unircorn')
    .src('http://bar.com', process.platform);
  const remote = bin.remote();
  t.is(remote.length, 2);
  t.is(remote[0].uri, 'http://foo.com');
  t.is(remote[0].arch, undefined);
  t.is(remote[1].uri, 'http://bar.com');
  t.is(remote[1].arch, undefined);
});

test('error if no binary is setted', async t => {
  const bin = binManager(tempfile(), 'test');

  const error = await t.throws(pify(bin.load)());
  t.is(error.message, 'No binary path setted. Call use(path).');
});

test('error if no source is provided', async t => {
  const bin = binManager(tempfile(), 'test')
    .use('something');

  const error = await t.throws(pify(bin.load)());
  t.is(error.message, 'No binary found matching your system. It\'s probably not supported.');
});

test('error if no binary is found', async t => {
  const bin = binManager(tempfile(), 'test')
    .src('http://foo.com/test.js', 'unicorn')
    .use('test.js');

  const error = await t.throws(pify(bin.load)());
  t.is(error.message, 'No binary found matching your system. It\'s probably not supported.');
});

test('download single file', async t => {
  const bin = binManager(tempfile(), 'test')
    .src('http://foo.com/gifsicle.tar.gz', process.platform)
    .use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

  await pify(bin.load)();
  const files = await fsP.readdirSync(bin.path());

  t.is(files.length, 1);
  t.is(files[0], process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

  await rimrafP(bin.path());
});

test('download single file, then try to load it', async t => {
  const bin = binManager(tempfile(), 'test')
    .src('http://foo.com/gifsicle.tar.gz', process.platform)
    .use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

  await pify(bin.load)();
  await pify(bin.load)();
  const files = await fsP.readdirSync(bin.path());

  t.is(files.length, 1);
  t.is(files[0], process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

  await rimrafP(bin.path());
});

test('unload single file', async t => {
  const bin = binManager(tempfile(), 'test')
    .src('http://foo.com/gifsicle.tar.gz', process.platform)
    .use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

  await pify(bin.load)();
  const files = await fsP.readdirSync(bin.path());

  t.is(files.length, 1);
  t.is(files[0], process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

  await pify(bin.unload)({force: true});
  const error = await t.throws(() => {
    fsP.readdirSync(bin.path());
  });
  t.is(error.code, 'ENOENT');
});

test('run single file no flags as array', async t => {
  const bin = binManager(tempfile(), 'test')
    .src('http://foo.com/gifsicle.tar.gz', process.platform)
    .use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

  const out = await pify(bin.run)('--version');
  t.is(out.code, 0);

  await rimrafP(bin.path());
});

test('run single file', async t => {
  const bin = binManager(tempfile(), 'test')
    .src('http://foo.com/gifsicle.tar.gz', process.platform)
    .use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

  const out = await pify(bin.run)(['--version']);
  t.is(out.code, 0);

  await rimrafP(bin.path());
});
