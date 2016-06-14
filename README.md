# pklib

![](https://img.shields.io/badge/depracated-true-ff69b4.svg)

🔨 Sack with helper functions

## Motivation

`pklib` is results of repeat the same solutions in different projects.

## Warning! ⚠️

**DEPRECATED! Please be careful when you use library form `tags` directory.**<br/>
**This are my working directory from a long time.**

## Installation

```html
<script src="src/pklib.js"></script>
```

## Usage

Module `pklib.profiler`:

```javascript
pklib.common.defer(function () {
    var filenames = ['test.js', 'example.js'];

    pklib.file.loadjs(filenames, function (file) {
        console.log('file: ' + file.src + ' loaded');
    });
});
```

## License

[The MIT License](https://piecioshka.mit-license.org/) @ 2011
