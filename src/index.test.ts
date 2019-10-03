import { transformFileAsync } from "@babel/core";
import path from "path";
import * as fs from "fs-extra";

let babelOptions = {
  configFile: false,
  babelrc: false,
  plugins: [require("./index")]
} as any;

test("it works", async () => {
  let result = await transformFileAsync(
    path.resolve(__dirname, "..", "test", "one.ts"),
    babelOptions
  );
  expect(result!.code).toMatchSnapshot();
});

test("it works if things change", async () => {
  let origTest = path.resolve(__dirname, "..", "test");
  let testCopy = path.resolve(__dirname, "..", "test-copy");
  await fs.remove(testCopy);
  await fs.copy(origTest, testCopy);
  let fileAToTransform = path.resolve(testCopy, "one.ts");
  let result = await transformFileAsync(
    path.resolve(testCopy, "one.ts"),
    babelOptions
  );
  expect(result!.code).toMatchSnapshot();
  await fs.writeFile(
    fileAToTransform,
    `import { OtherThing } from "./another";

  const enum Thing {
    one,
    two,
    three
  }
  
  let thing = Thing.three;
  
  let otherThing = OtherThing.oneMore;
  `
  );
  await fs.writeFile(
    path.resolve(testCopy, "another.ts"),
    `export const enum OtherThing {
      another,
      thing,
      oneMore
    }
    `
  );
  let secondResult = await transformFileAsync(
    path.resolve(testCopy, "one.ts"),
    babelOptions
  );
  expect(secondResult!.code).toMatchSnapshot();
});
