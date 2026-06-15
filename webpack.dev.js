const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const Dotenv = require('dotenv-webpack');

module.exports = (env) => {
    const browserConfig = require(`./webpack.${env.browser}.js`);
    const dev_env = {
        plugins: [
            new Dotenv({
                path: '.env'
            })
        ]
    };
    return merge(common, dev_env, browserConfig, {
        mode: "development",
        devtool: "cheap-module-source-map"
    });
}
