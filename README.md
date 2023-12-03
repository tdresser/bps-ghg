# TODO
- Fix pagination.
- Figure out the right unique ID per school.
- Graph things.
- Try Paquet

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
