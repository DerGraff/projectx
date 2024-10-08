
const yargs = require('yargs');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { argv } = require("process");
var { controllerx, quasarx, piox, Handlerx } = require("../controllerx.js");
const os = require('os');
const { projectData, handlerFi } = require("../base/ProjectData.js");

const yargsResult = yargs
    .usage('Usage: <mode> -c <command> [-d <directory>] [--json]')
    .positional('o', {
        alias: 'mode',
        describe: 'Command to execute',
        type: 'string',
        demandOption: false
    })
    .option('c', {
        alias: 'command',
        describe: 'Command to execute',
        type: 'string',
        demandOption: true
    })
    .option('d', {
        alias: 'directory',
        describe: 'Directory path',
        type: 'string'
    })
    .option('t', {
        alias: 'target',
        describe: 'Target',
        type: 'string'
    })
    .option('e', {
        alias: 'env',
        describe: 'Environment',
        type: 'string',
        default: "default"
    })
    .option('A', {
        alias: 'arch',
        describe: 'Architecture',
        type: 'string'
    })
    .option('j', {
        alias: 'json',
        describe: 'Return result as JSON',
        type: 'boolean',
        default: false
    })
    .option('m', {
        alias: 'copy',
        describe: 'Copy to apps directory',
        type: 'boolean',
        default: true
    })
    .option('s', {
        alias: 'sync',
        describe: 'Sync to Server directory',
        type: 'boolean',
        default: true
    })
    .updateStrings({
        'Commands:': 'My Commands -->\n'
    })
    .config('settings', function (configPath) {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    });

const options = yargsResult.argv;
const args = options._;
const command = options.command;
const returnAsJson = options.json;
let directory = options.directory || process.cwd();
let mode = options.mode;
console.log("Mode: " + mode);

var printOptions = false;
if (printOptions) {
    console.log(options);
}


var resultFi = handlerFi(options, directory, os.platform());
// console.log(resultFi);
function printResult() {
    console.log(JSON.stringify(resultFi, null, 2));

}
var target = options.target || resultFi.project.target;
var arch = options.arch || resultFi.project.arch;


var isCopy = false;
var isSync = false;

function updateVersion(packageJson, folder, packageName = "package.json") {
    var thirdPos = packageJson.version.lastIndexOf(".");
    var version = packageJson.version.substring(thirdPos + 1);
    version = parseInt(version) + 1;
    packageJson.version = packageJson.version.substring(0, thirdPos + 1) + version;
    fs.writeFileSync(path.join(folder, packageName), JSON.stringify(packageJson, null, 2));
}

function gitUpdate(folder) {
    const { execSync } = require('child_process');

    try {
        let stdout = execSync("git pull", {
            cwd: folder
        });
        console.log(`stdout: ${stdout.toString()}`);
    } catch (error) {
        console.error(`error: ${error.message}`);
    }
}

if (mode == "projectx" || mode == "x") {
    console.log("ProjectX Mode");
    console.log("Directory: " + directory);
    console.log("ProcDir: " + process.cwd());
    console.log("FileDir: " + __dirname);
    console.log("nodeDir: " + process.env.NODE_PATH);
    console.log(process.env);
    if (command == "update") {
        gitUpdate(path.dirname(path.dirname(__dirname)));
    }
}
else {

    var projectClass = null;

    if (projectData.is.pio) {
        if (command == "build") {
            piox.build(directory, options.env, target, arch);
        }
        else if (command == "copy") {
            isCopy = true;
        }
        else {
            resultFi.error = 1;
            resultFi.message = "unknownCommand"

        }
        printResult();

    }
    else if (projectData.is.quasar) {
        // console.log("Quasar Project");
        var { quasarx } = require("../projects/quasar/quasarx.js");

        quasarx.init(resultFi.project);
        // console.log(quasarx.getAppPath());
        // console.log(quasarx.getPackedPath());

        if (command == "build") {

            quasarx.build(directory, options.env, target, arch);
            isCopy = options.copy || true;
            isSync = options.sync || true;
        }
        if (command == "release") {
            if (projectData.is.node) {
                if (!projectData.packageJson.version) {
                    projectData.packageJson.version = "0.0.1";
                }
                updateVersion(projectData.packageJson, directory);
            }
            quasarx.build(directory, options.env, target, arch);
            isCopy = options.copy || true;
            isSync = options.sync || true;
        }
        else if (command == "copy") {

            // console.log(resultFi)
            isCopy = true;
        }
        else if (command == "sync") {
            isSync = true;
        }
        else if (command == "count") {
            updateVersion(projectData.packageJson, directory);
        }
        else if (command == "version") {
            console.log(projectData.packageJson.version);
        }
        else if (command == "init") {
            console.log("Init Quasar Project");
            // quasarx.init(resultFi.project);
        }
        else if (command == "fsync") {
            updateVersion(projectData.packageJson, directory);
            isSync = true;
            isCopy = true;
        }
        else if (command == "pull") {
            const { execSync } = require('child_process');

            try {
                let stdout = execSync("git pull", { cwd: directory });
                console.log(`stdout: ${stdout.toString()}`);
            } catch (error) {
                console.error(`error: ${error.message}`);
            }
        }
        //

        projectClass = quasarx;
        printResult();
    }
    else {
        resultFi.error = 1;
        resultFi.message = "unknownProject"
        //
        printResult();
    }

    controllerx.projectx = projectClass;

    if (isCopy) {
        Handlerx.copyToApps(resultFi);
    }


    resultFi.projectx = projectClass;

    if (isSync && projectClass != null) {
        Handlerx.copyToServer(projectClass, resultFi, ["win-unpacked", "linux-unpacked", "mac-unpacked", "linux-arm64-unpacked"]);
    }

}
// console.log(resultFi);