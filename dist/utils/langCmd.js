"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const langCmd = (language) => {
    let fileName = "";
    let compileCmd = "";
    let runCmd = [];
    if (language === "javascript") {
        fileName = "script.js";
        runCmd = ["node", `/app/${fileName}`];
    }
    else if (language === "python") {
        fileName = "script.py";
        runCmd = ["python3", `/app/${fileName}`];
    }
    else if (language === "java") {
        fileName = "Main.java";
        compileCmd = "javac /app/Main.java";
        runCmd = ["java", "-cp", "/app", "Main"];
    }
    return { fileName, compileCmd, runCmd };
};
exports.default = langCmd;
