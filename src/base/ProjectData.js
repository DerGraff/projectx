const fs = require('fs');
const path = require('path');
const os = require('os');


class ProjectData {
    name = "";
    productName = "";
    target = "";
    version = "";
    description = "";
    project = {}
    fileNames = {}
    is = {}
    packageJson = {}

    constructor() {
        this.project = { type: "", target: "", productName: "", folder: "", dirName: "", os: "" }
        this.fileNames.pioIniName = "platformio.ini";
        this.fileNames.quasarIniName = 'quasar.config.js';
        this.fileNames.packageName = 'package.json';
        this.is = { pio: false, quasar: false, node: false };

    }

    setIs(key, value) {
        this.is[key] = value;
    }

    getProjectResult() {
        var env = { "env": { productName: this.productName, target: this.target, version: this.version, description: this.description } }
        var filenNames = { "filenames": this.fileNames }
        var is = { "is": this.is }
        if(!this.project.productName && this.productName){
            this.project.productName = this.productName;
        }
        var project = { "project": this.project }

        return { ...project, ...env, ...filenNames, ...is };
    }



    updateResultFi() {
        this.resultFi = this.getProjectResult();
    }

    setProjectData(projectData) {        
        if (projectData.target)
            this.setTarget(projectData.target);

        if (projectData.type)
            this.type = projectData.type;
        
        this.project = { ...this.project, ...projectData }        
    }

    setTarget(target) {
        this.target = target;
        this.project.target = target;
        this.updateResultFi();
    }

    setPackageJson(packageJson) {
        this.packageJson = packageJson;
        this.productName = packageJson.name || packageJson.productName;
        this.name = packageJson.name;
        this.setProjectData({ name: this.name });
        this.version = packageJson.version;
        this.description = packageJson.description;
    }
}

var projectData = new ProjectData();

function handlerFi(options = {}, directory, platform = os.platform()) {
    var resultFi = {};
    console.log("------ HandlerFi Start ------");
    var target = options.target || platform;
    const command = options.command;
    const returnAsJson = options.json;
    // resultFi = { project: { type: "", target: target, productName: packageJson.name || packageJson.productName, folder: directory, dirName: directory, os: platform } };
    projectData.setProjectData({ target: target, folder: directory, dirName: directory, os: platform });


    function checkFilesExist(directoryPath, filenames) {
        const result = {};
        // Normalize the directory path
        const normalizedPath = path.resolve(directoryPath);

        for (const filename of filenames) {
            const filePath = path.join(normalizedPath, filename);
            result[filename] = fs.existsSync(filePath);
        }

        return result;
    }

    var packageName = projectData.fileNames.packageName

    const filenamesToCheck = Object.values(projectData.fileNames);

    const filesExistenceResult = checkFilesExist(directory, filenamesToCheck);

    projectData.setIs("pio", filesExistenceResult[projectData.fileNames.pioIniName]);
    projectData.setIs("quasar", filesExistenceResult[projectData.fileNames.quasarIniName]);
    projectData.setIs("node", filesExistenceResult[projectData.fileNames.packageName]);

    if (projectData.is.pio) {
        console.log(piox.getName());
        piox.projectDirectory = directory;
        piox.checkOld();
    }

    var folderName = path.basename(directory);

    var packageJson = {
        name: "",
        productName: folderName,
        version: "",
        description: "",
    };


    if (projectData.is.node) {
        try {
            var packageJsonNew = JSON.parse(fs.readFileSync(path.join(directory, projectData.fileNames.packageName), 'utf-8'));
            packageJson = { ...packageJson, ...packageJsonNew };
        }
        catch (error) {
            console.error(`File ${packageName} does not exist in the specified directory.`);
        }
    }
    projectData.setPackageJson(packageJson);


    var projectType = "notFound";

    if (projectData.is.pio) {

        console.log(piox.getName());
        piox.projectDirectory = directory;
        piox.checkOld();
        projectType = "pio";
    }
    else if (projectData.is.quasar) {
        projectType = "quasar";
    }
    else if (projectData.is.node) {
        projectType = "node";
    }
    projectData.setProjectData({ type: projectType });

    resultFi = projectData.getProjectResult();

    console.log("------ HandlerFi End ------");
    return resultFi;
}

module.exports = { projectData, handlerFi };