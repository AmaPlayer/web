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
  devServer: {
    // Fix WebSocket connection issues
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
    },
    // Suppress WebSocket errors in console
    onListening: function (devServer) {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }
    },
  },
};
