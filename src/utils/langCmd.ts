const langCmd = (language: string): { fileName: string, compileCmd: string, runCmd: string[] } => {
        let fileName = "";
        let compileCmd = "";
        let runCmd: string[] = [];

        if (language === "javascript") {
            fileName = "script.js";
            runCmd = ["node", `/app/${fileName}`];
        } else if (language === "python") {
            fileName = "script.py";
            runCmd = ["python3", `/app/${fileName}`];
        } else if (language === "java") {
            fileName = "Main.java";
            compileCmd = "javac /app/Main.java";
            runCmd = ["java", "-cp", "/app", "Main"];
        }

    return { fileName, compileCmd, runCmd };
};

export default langCmd;
