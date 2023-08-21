var merge = require("package-merge");
var fs = require("fs");

const pkgStr1 = fs.readFileSync(
  "/Users/ashwinjain/Development/Personal/poker/main/package.json",
  "utf8"
);
const pkgStr2 = fs.readFileSync(
  "/Users/ashwinjain/Development/Personal/poker/Vaadin/package.json",
  "utf8"
);

// only support string. buffer is not supported
const mergedPkgStr = merge(pkgStr1, pkgStr2);
fs.writeFile("main/package-merged.json", mergedPkgStr);
