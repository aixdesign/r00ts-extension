const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: {
        background: "./src/background.ts",
        "popup/script": "./src/popup/script.ts"
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                use: { loader: 'ts-loader', options: { transpileOnly: true } },
                exclude: /node_modules/,
            },
        ]
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: "src", to: ".", globOptions: { ignore: ["**/*.js", "**/*.ts"] } },
                { from: 'node_modules/maplibre-gl/dist/maplibre-gl-csp-worker.js', to: '.' },
                {
                    from: 'node_modules/maplibre-gl/dist/maplibre-gl.css',
                    to: 'popup/maplibre.css'
                }
            ]
        })
    ]
};
