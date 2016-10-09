"use strict";
const Koa = require('koa');
const Mvc_1 = require("../koa-mvc-server/Mvc");
const mount = require('koa-mount');
const zlib = require('zlib');
const file_reload_1 = require('../file-reload/file-reload');
const path = require('path');
const serveStatic = require('koa-static');
const compress = require('koa-compress');
var manifest;
file_reload_1.fileReload(path.resolve(__dirname, '../../../webpack-assets.json'), content => manifest = JSON.parse(content));
var serveStaticOptions = {
    maxAge: 30,
    buffer: true
};
serveStaticOptions = null;
const app = new Koa();
app.use(compress({
    flush: zlib.Z_SYNC_FLUSH
}));
app.use((ctx, next) => {
    return next().then(() => {
        //ctx.set('Cache-Control', 'max-age=10');
    });
    // ctx.set('Cache-Control', 'no-cache');
});
app.use(serveStatic('.www', serveStaticOptions));
const jspm = new Koa();
jspm.use(serveStatic('jspm_packages', serveStaticOptions));
app.use(mount('/jspm_packages', jspm));
var mvc = new Mvc_1.Mvc();
mvc.registerAreas(__dirname, ['/admin', '/home'], {
    views: {
        extension: 'pug',
        engine: 'pug',
        templateOptions: {
            basedir: '.dist/scripts/server/app',
            meta: {
                manifest: manifest,
            },
            render: {
                scriptSource: bundle => manifest[bundle]['js'],
                styleSource: bundle => manifest[bundle]['css'],
                script: bundle => `<script src="${manifest[bundle]['js']}" />`
            }
        }
    }
});
app.use(mvc.routes());
app.use(compress({
    flush: zlib.Z_SYNC_FLUSH
}));
app.listen(3010);

//# sourceMappingURL=app.js.map
