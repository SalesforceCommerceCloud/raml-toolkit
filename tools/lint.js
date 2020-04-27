const path = require("path");
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function lintAsync(cmdStr, ramlFile) {
    try{
        const { stdout, stderr } = await exec(`npx ${cmdStr} ${ramlFile} -p mercury`);
        console.log(stderr, stdout);
    }catch(err) {
        console.log(err.message, err.stdout);
    }
}

function lint(npmLib) {
    if(!npmLib) {
        //use published npm lib by default
        npmLib = "@commerce-apps/raml-toolkit";
    }
    const apiConfig = require(path.resolve("/apis/api-config.json"));
    Object.keys(apiConfig).forEach(s => {
          apiConfig[s].forEach(t => {
              lintAsync(npmLib,
                  path.resolve(`/apis/${t.assetId}/${t.fatRaml.mainFile}`));
          });
      });
}

lint(process.argv[2]);


