const util = require('util');
const path = require('path');

const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

const TerserJSPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const autoprefixer = require('autoprefixer');


module.exports = (env = {production: false}) => {
    const baseConfig = {
        entry: ['./src/scss/style.scss', './src/index.js'],
        optimization: {
            minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})],
        },
        plugins: [
            new CleanWebpackPlugin(),
            new webpack.ProvidePlugin({
                noUiSlider: 'nouislider'
            }),
            new HtmlWebpackPlugin({
                template: './index.html'
            }),
            new MiniCssExtractPlugin(),
        ],
        module: {
            rules: [
                {
                    test: /\.(sa|sc|c)ss$/,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader,
                            options: {
                                hmr: !env.production,
                            },
                        },
                        {loader: 'css-loader'},
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: () => [autoprefixer()]
                            }
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                implementation: require('sass'),
                                sassOptions: {
                                    includePaths: ['./node_modules'],
                                }
                            },
                        }
                    ],
                },
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    exclude: /(node_modules|bower_components)/,
                    query: {
                        presets: ['@babel/preset-env'],
                    },
                }
            ],
        },
        devServer: {
            watchContentBase: true,
            hot: true,
            // host: '0.0.0.0',
            // port: 8080,
            // public: 'localhost:8080',
            // allowedHosts: [
            //   '.ngrok.io'
            // ]
        }
    };

    let config;

    if (env.production) {                   // Production
        config = merge.smart(baseConfig, {
            mode: 'production',
            devtool: 'source-map'
        });
    } else {                                  // Development
        config = merge.smart(baseConfig, {
            mode: 'development',
            devtool: 'inline-source-map'
        });
    }

    console.log(util.inspect(config,
        false, // showHidden
        5,     // depth
        true   // color
    ));
    return config;
}; 
