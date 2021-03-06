'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _templateObject = _taggedTemplateLiteral(['Cmd: \'', '\' with args \'', '\' failed to deliver \n                           promise - errors appeared on the way successfully.\n                           Error: ', ''], ['Cmd: \'', '\' with args \'', '\' failed to deliver \n                           promise - errors appeared on the way successfully.\n                           Error: ', '']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

require('babel-polyfill'); // required for using Promises

var suppressEpipe = require('epipebomb');
var childProcess = require('child_process');
var onDeath = require('death')();
var dedent = require('dedent');

exports.default = runProcessSequence;


var runningProcess;

function runProcess(cmd, args, doneCallback) {
    var child = runningProcess = childProcess.spawn(cmd, args);

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    child.on('exit', function (code) {
        console.log('Process \'' + cmd + '\' exited with code ' + code + '.');
        runningProcess = undefined;

        doneCallback();
    });
}

function runProcessSequence(tasks) {

    var promise = Promise.resolve();

    tasks.forEach(function (task) {

        //if (!isExiting) {
        promise = promise.then(function (result) {
            return new Promise(function (resolve, reject) {
                console.log('Running cmd: \'' + task.cmd + '\' with args \'' + task.args + '\'');
                runProcess(task.cmd, task.args, function () {
                    console.log('Exiting cmd: \'' + task.cmd + '\' with args \'' + task.args + '\'');
                    resolve();
                });
            });
        }).catch(function (reason) {
            console.log(dedent(_templateObject, task.cmd, task.args, reason));
        });
    });

    return promise;
}

// onDeath(function (signal, err) {
//     console.log(dedent`Process that was spawned with args ${process.spawnargs}, PID=${process.pid}
//                        dies after receiving signal '${signal}'. Error info: ${err}`);
//
//     if (runningProcess) {
//         console.log('Killing child process');
//
//         var x = runningProcess;
//
//         runningProcess.exit(1);
//
//         // runningProcess.kill();
//         console.log(`killed= ${x.killed}, spawnargs=${x.spawnargs}, pid = ${x.pid}`);
//         runningProcess = undefined;
//         console.log('Process killed');
//     }
//     else{
//         console.log('No child process running');
//     }
// });

// https://github.com/mhart/epipebomb:
// By default, node throws EPIPE errors if process.stdout is being written to
// and a user runs it through a pipe that gets closed while the process is still
// outputting (eg, the simple case of piping a node app through head).
// -------------------
// Uncommenting this line may be necessary if you want to pipe a node/npm process to
// another process, e.g. in command:
//      npm run develop | tee console.log
// which would write output both to terminal as well as to file 'console.log'
// Another command:
//      npm run develop | head
// could potentially cause the same result, if npm was closed with SIGTERM.
suppressEpipe();