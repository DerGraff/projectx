const { quasarx } = require("./projects/quasar/quasarx");
const { piox } = require("./projects/pio/piox");
var { uploadx, copyToAppsDirectroy, uploadDirectoryToFtp } = require("./base/uploadx.js");


class Handlerx {
    static copyToApps(projectData, exclude = []) {
        console.log("------------")
        console.log("------------")
        console.log("Start Copy")
        copyToAppsDirectroy(projectData, exclude);
    }

    static copyToServer(projectClass, projectData, exclude = []) {
        console.log("------------")
        console.log("------------")
        console.log("Start Sync")
        if (projectData.is.quasar){
            uploadDirectoryToFtp(projectClass.getAppPath()  + "/latest", projectClass.getShortAppPath(), exclude);
        }
        else {
            uploadDirectoryToFtp(projectClass.getAppPath(), projectClass.getShortAppPath(), exclude);
        }
        
    }
}


class Controllerx {
    projectx = null;

    constructor() {
        this.projectx = null;
    }

    copy() {

    }

    uploadFtp(){

    }

    release() {
        this.copy();
        this.uploadFtp();
    }
}

var controllerx = new Controllerx();

module.exports = { controllerx, quasarx, piox, Handlerx };