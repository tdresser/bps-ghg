# TODO
- Update spreadsheet.
- Make Row a class.
- Set board if you select school.
- Clear school if you change board.
- Filter schools by board.

# Setup
Need to update gridjs package.js.
Add this, and remove it from where it currently is.
```js
"exports": {
    ".": {
      "types": "./dist/index.d.ts",
```

To serve more like ghpages:
```sh
cd docs
ln -s . bps-ghg
python3 -m http.server --directory .

```

Why the gzip file extension instead of gz?
TODO: check if this matters.
https://stackoverflow.com/questions/76691769/how-to-use-decompressionstream-to-decompress-a-gzip-file-using-javascript-in-bro
