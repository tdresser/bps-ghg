export default () => {
  return {
    root: '.',
    build: {
        outDir: 'docs'
    },
    base: '/bps-ghg',
    assetsInclude: ['**/*.csv.gz'],
  };
};