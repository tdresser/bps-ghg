export default () => {
  return {
    root: '.',
    build: {
        outDir: 'docs'
    },
    base: '/sb-dataviz',
    assetsInclude: ['**/*.csv.gzip'],
  };
};