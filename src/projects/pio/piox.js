const path = require('path');
const fs = require('fs');

class Piox {
    constructor() {
        this.name = "pio";
        this.projectDirectory = "";
    }

    getName() {
        return this.name;
    }

    checkOld(update = false) {
        console.log("checkOld");

        //check if folder /espinit exists
        var checkPath = path.join(this.projectDirectory, "src/espinit");
        console.log(checkPath);
        if (fs.existsSync(checkPath)) {
            console.log("espinit exists");
            if (update) {
                console.log("update");
                //update espinit
            }
            else {
                console.log("not update");
                //do nothing
            }
        }

        // read platformio.ini
        var pioIniPath = path.join(this.projectDirectory, "platformio.ini");



        console.log(pioIniPath);
        if (fs.existsSync(pioIniPath)) {
            console.log("platformio.ini exists");

            var data = fs.readFileSync(pioIniPath, 'utf8');
            var lines = data.split('\n');
            //read platformio.ini
            let result = {};
            let currentSection = '';
            let currentKey = '';

            for (let line of lines) {
                if(line.startsWith(';')) continue;
                
                line = line.trim();
                if (line.startsWith('[')) {
                    currentSection = line.slice(1, -1);
                    result[currentSection] = {};
                } else if (line.includes('=')) {
                    const [key, value] = line.split('=').map(s => s.trim());
                    currentKey = key;
                    if (value) {
                        result[currentSection][currentKey] = [value];
                    } else {
                        result[currentSection][currentKey] = [];
                    }
                } else if (line) {
                    console.log(currentSection, currentKey, line);
                    result[currentSection][currentKey].push(line);
                }
            }

            console.log(result);
        }
    }

    getProjectDir() {
        return this.projectDirectory;
    }

    isValid() {
        return false;
    }
}

var piox = new Piox();
module.exports = { piox, Piox };