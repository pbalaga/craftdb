const Metalsmith = require('metalsmith');
const handlebars = require('handlebars');
const inplace = require('metalsmith-in-place');
const markdown = require('metalsmith-markdown');
const layouts = require('metalsmith-layouts');
const asciidoc = require('./lib/plugins/asciidoc'); // require('metalsmith-asciidoc');
const serve = require('metalsmith-serve');
const gaze = require('gaze');
const metalsmithWebpack = require('metalsmith-webpack');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BowerWebpackPlugin = require('bower-webpack-plugin');
//require("font-awesome-webpack");
const path = require('path');

const http = require('http');
const finalhandler = require('finalhandler');
const serveStatic = require('serve-static');
const extend = require('extend');

var setupWatcher = () =>
    gaze(['docs/**/*.*', 'layouts/**/*.*', 'assets/**/*.*'], function (err, watcher) {
        watcher.on('all', function (event, filepath) {
            console.log(`File ${filepath} changed. Triggering events.`)
            build();
        });
    });

var setupServer = (options) => {
    var options = extend({
        directory: './build',
        port: 8080
    }, options);

    var serve = serveStatic(options.directory);

    console.log('Starting static server');

    var server = http.createServer(function (req, res) {
        var done = finalhandler(req, res);
        serve(req, res, done);
    });

    server.listen(options.port);
    console.log('Server listening on port ' + options.port);
};

var build = (options) => {
    console.log('Build started');

    options = extend({
        buildDestination: './build',
        callback: ()=> {
        }
    });

    Metalsmith(__dirname)
        .source('./docs')
        .destination(options.buildDestination)
        .use(asciidoc())
        .use(layouts({engine: 'jade', default: 'main.jade'}))
        .use(metalsmithWebpack({
            context: path.join(__dirname, 'assets'),
            entry: {
                //'style-default': './stylesheets/default.css',
                'style-loader': './scripts/style-loader.js'
            },
            output: {
                path: path.resolve(__dirname, options.buildDestination, 'scripts'),
                filename: '[name].js',
                publicPath: '/assets/'
            },
            module: {
                loaders: [
                    {test: /\.css$/, loader: 'style-loader!css-loader'},
                    //Regex provided by cchamberlain - see below link:
                    //https://github.com/webpack/less-loader/issues/53
                    { test: /\.(eot|woff|woff2|ttf|svg|png|jpe?g|gif)(\?\S*)?$/
                        , loader: 'url?limit=100000&name=[name].[ext]'
                    }

                ]
            },
            resolve: {
                //https://github.com/webpack/webpack/issues/472
                //http://www.unknownerror.org/opensource/webpack/webpack/q/stackoverflow/23305599/webpack-provideplugin-vs-externals
                root: ['node_modules', 'bower_components']
            },
            externals: {
                //http://www.unknownerror.org/opensource/webpack/webpack/q/stackoverflow/23305599/webpack-provideplugin-vs-externals
                //fontawesome: 'fontawesome'
            },
            plugins: [
                //new BowerWebpackPlugin()
                new webpack.ResolverPlugin(
                    new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])
                )
                // new CopyWebpackPlugin([
                //     {from: './**/*.css'}
                // ], {copyUnmodified: true})
            ]
        }))
        .build(err => {
            if (err) console.log(err);
            else {
                console.log('Build complete!');
                options.callback();
            }
        });
};

var config = {
    buildDestination: './build'
};

build(config);
setupServer({directory: config.buildDestination});
setupWatcher();


