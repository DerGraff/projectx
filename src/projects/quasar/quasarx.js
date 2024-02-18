const { exec, execSync } = require('child_process');
const { BaseProjectx } = require('./../baseProjectx.js');
const { spawnSync } = require('child_process');

function executeCommandSync(command, directory = null) {
    try {
        let [cmd, ...args] = command.split(' ');
        
        var argsStr = args.join(' ');
        let options = {
            stdio: 'inherit', // This will direct stdout/stderr to the parent process
            shell: true,
            env: process.env // Include parent's environment variables
        };
        console.log(cmd, args);
        if (directory) {
            options.cwd = directory;
        }
        let child = spawnSync("quasar", args, options);

        if (child.error) {
            console.error(`Command execution failed: ${child.error}`);
            return null;
        }

        return child;
    } catch (error) {
        console.error(`Command execution failed: ${error}`);
        return null;
    }
}

// function executeCommandSync(command, directory = null) {
//     try {
//         var output = null;
//         if (directory) {
//             output = execSync(command, { cwd: directory });
//         }
//         else {
//             output = execSync(command);
//         }
//         return output;
//     } catch (error) {
//         console.error(`Command execution failed: ${error}`);
//         return null;
//     }
// }

class Quasarx extends BaseProjectx {

    // constructor(resultFi) {
    //     this.projectData = resultFi;
    // }
    build(directory, env, target = "win32", arch = "xxxx64") {
        const command = 'quasar build -m electron -T '+target+' -p always';
        var output = executeCommandSync(command, directory);
        console.log(output);
    }

    getPackedPath() {
        return "dist/electron/Packaged";
    }

    getAppPath() {
        var appPath = "build/quasar/apps/" + this.projectData.target + "/" + this.projectData.name;
        if(this.projectData.os == "win32"){
            appPath = "C:\\" + appPath;
            appPath = appPath.replace(/\//g, "\\");
        }
        return appPath
    }

    getShortAppPath() {
        return "apps/" + this.projectData.name + "/" + this.projectData.target;
        return "build/quasar/apps/" + this.projectData.target + "/" + this.projectData.name;
    }
}

var quasarx = new Quasarx();

module.exports = { quasarx };