const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const Dotenv = require('dotenv-webpack');

module.exports = (env) => {
    const browserConfig = require(`./webpack.${env.browser}.js`);
    const production_env = {
        plugins: [
            new Dotenv({
                path: '.env.prod'
            })
        ]
    };
    return merge(common, production_env, browserConfig, {
        mode: "production",
        devtool: "source-map"
    });
}
