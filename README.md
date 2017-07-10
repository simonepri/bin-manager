# NodeJS Binary Manager [![Travis CI](https://travis-ci.org/simonepri/bin-manager.svg?branch=master)](https://travis-ci.org/simone/bin-manager) [![Codecov](https://img.shields.io/codecov/c/github/simonepri/bin-manager/master.svg)](https://codecov.io/gh/simonepri/bin-manager) [![npm](https://img.shields.io/npm/dm/bin-manager.svg)](https://www.npmjs.com/package/bin-manager) [![npm version](https://img.shields.io/npm/v/bin-manager.svg)](https://www.npmjs.com/package/bin-manager)
> 🌀 Binaries available as local nodeJS dependencies

> Binary wrapper that makes your programs seamlessly available as local dependencies


## Install

```
$ npm install --save bin-manager
```


## Usage

```js
const bmanager = require('bin-manager');

const base = 'https://github.com/imagemin/gifsicle-bin/raw/master/vendor';
const bin = bmanager('bin', 'gifsicle')
  .src(base + '/macos/gifsicle', 'darwin')
  .src(base + '/linux/x64/gifsicle', 'linux', 'x64')
  .src(base + '/win/x64/gifsicle.exe', 'win32', 'x64')
  .use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

bin.run(['--version'], (err, out) => {
  if (err) {
    console.log(error);
    return;
  }
  console.log(out.stdout);
});
```

## API

### bmanager(dist, slug)

Creates a new `bmanager` instance.

##### dist

Type: `string`<br>
Default: `''`

Accepts a path where the binaries will be stored to.

##### slug

Type: `string`<br>
Default: `''`

Accepts an unique slug for the binary.<br>
The binary will be downloaded inside the path: `dist/slug`

### .src([url], [os], [arch])

Adds a source to download.
If no argument is passed the current array of sources is returned.

#### url

Type: `string`

Accepts a URL pointing to a file to download.

#### os

Type: `string`

Tie the source to a specific OS.

#### arch

Type: `string`

Tie the source to a specific arch.

### .dest(destination)

Adds a destination folder.

#### destination

Type: `string`

The path which the files will be downloaded to.

### .use([binary])

Get or set the binary path of the extracted file.

#### binary

Type: `string`

Define which file to use as the binary.
If undefined the current setted value is returned.

### .path()

Returns the full path where the binary will downloaded to.

### .bin()

Returns the full path to your binary.

### .remote()

Returns the URLs that will be downloaded for your platform.

### .load([options], callback)

Runs the search for the binary. If no binary is found it will download it
using the URL provided in `.src()`.
<br>It usese [download](https://github.com/kevva/download) under the hood.
<br>See [here](https://github.com/kevva/download#options) all available options.

#### options

Type: `Object`<br>
Default: `{extract: true}`

#### callback(err)

Type: `Function`

### .unload([options], callback)

Removes downloaded binaries, if presents.
<br>It usese [del](https://github.com/sindresorhus/del) under the hood.
<br>See [here](https://github.com/sindresorhus/del#options) all available options.

#### options

Type: `Object`<br>
Default: `{extract: true}`

#### callback(err)

Type: `Function`

### .run([arguments], [options], callback)

Runs the binary. If the binary is not loaded it will also load it.
<br>It usese [execa](https://github.com/sindresorhus/execa) under the hood.
<br>See [here](https://github.com/sindresorhus/execa#options) all available options.

#### arguments

Type: `Array`<br>
Default: `[]`

#### options

Type: `Object`<br>
Default: `{}`

#### callback(err, out)

Type: `Function`

Returns a possible error and the output object.


## Authors
* **Simone Primarosa** - [simonepri](https://github.com/simonepri)

See also the list of [contributors](https://github.com/simonepri/bin-manager/contributors) who participated in this project.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

