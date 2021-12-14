
function isNotEmptyOrCwd(outputDir: string){
    return outputDir !== "" && outputDir !== "."
}

function withTrailingPathSep(outputDir: string){
    return outputDir.endsWith("/") ? outputDir : outputDir + "/"
}

export const inputFileMap = {
    demo: "src/demo.html",
    bash: "src/demo-bash.html",
    sound: "src/demo-sound.html",
}

export const inputFileList = Object.values(inputFileMap)


export const outputMapForDir = (outputDir = ".") => { 
    const prefix = isNotEmptyOrCwd(outputDir) ? withTrailingPathSep(outputDir) : ""
    return {
        [inputFileMap.demo]: prefix + "demo.html",
        [inputFileMap.bash]: prefix + "demo/bash.html",
        [inputFileMap.sound]: prefix + "demo/sound.html"
    };
}
