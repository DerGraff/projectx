class BaseProjectx {

    constructor(projeckData = null) {
        if (projeckData == null) {
            projeckData = {
                productName: "projectx empty",
                target: "",
                version: "0.0.0",
                description: "projectx",
            }
        }
        this.projectData = projeckData;
    }

    init(projectData){
        this.projectData = {...this.projectData, ...projectData};
    }
    build(directory, env) {
        throw new Error("Method not implemented.");
    }
    getPackedPath() {
        throw new Error("Method not implemented.");
    }
    getAppPath() {
        throw new Error("Method not implemented.");
    }
}

module.exports = { BaseProjectx };