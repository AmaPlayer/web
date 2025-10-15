module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Remove CSS minimizer to identify the problematic CSS
      webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter(
        (plugin) => plugin.constructor.name !== 'CssMinimizerPlugin'
      );

      return webpackConfig;
    },
  },
};
