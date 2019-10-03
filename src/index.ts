import { Project } from "ts-morph";
import * as typescript from "typescript";
import { parse as babelParse, ParserOptions } from "@babel/core";

let projectCache = new Map<string, Project>();

export default function babelPluginTsc() {
  return {
    parserOverride(
      code: string,
      parserOpts: ParserOptions,
      parse: typeof babelParse
    ) {
      // @ts-ignore
      let filename = parserOpts.sourceFileName;

      if (!filename) {
        throw new Error(
          "babel-plugin-tsc can only transform if a filename is passed to Babel"
        );
      }
      let configFileName = typescript.findConfigFile(
        filename,
        typescript.sys.fileExists
      );
      if (!configFileName) {
        throw new Error("No tsconfig.json file could be found");
      }
      if (!projectCache.has(configFileName)) {
        const cachedProject = new Project({
          tsConfigFilePath: configFileName,
          addFilesFromTsConfig: false,
          compilerOptions: {
            noEmit: false
          }
        });
        projectCache.set(configFileName, cachedProject);
      }
      let project = projectCache.get(configFileName)!;
      let sourceFile = project.addExistingSourceFile(filename);
      project.resolveSourceFileDependencies();
      let sourceFiles = project.getSourceFiles();
      for (let sourceFile of sourceFiles) {
        sourceFile.refreshFromFileSystemSync();
      }
      let output = project.emitToMemory({ targetSourceFile: sourceFile });
      return parse(output.getFiles()[0].text, parserOpts);
    }
  };
}
