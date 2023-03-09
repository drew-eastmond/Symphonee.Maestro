const esbuild = require("esbuild");
const fs = require("fs");

const { GenericTask } = require("../GenericTask");


class EsbuildTask extends GenericTask {

    constructor(process) {

        super(process);

        console.log("Esbuild constructed");

    }

    async $start(taskData, args) {

        console.log("Esbuild $start( ... )"); // , taskData, args);

    }

    async $trigger(file) {

        console.log("Esbuild $trigger( ... )");

        console.group("!!!!!!!!!!!!!!! $trigger( ... )");

            // execute pre-task
        await this.$exec(this.task.pre_task);

        console.log("pre_task", this.task.pre_task);
        console.log("task", this.task);

        for (const fileObj of this.task.trigger.file) {

            await this.$exec(fileObj.pre_task);
            console.log("pre_task", fileObj.pre_task);

            const currentCompile = { "tree_shake": true, "minify": false, "--watch": true, ...fileObj };

            // console.log(currentCompile);

            

            let command = `./symphonee/esbuild/esbuild.exe ${currentCompile.in} --outfile=${currentCompile.out[0]} --bundle `;
            command += (currentCompile.watch === true) ? " --watch=forever " : "";
            command += (currentCompile.tree_shake === true) ? " --tree-shaking=true " : " --tree-shaking=false ";
            command += (currentCompile.source_map === true) ? " --sourcemap " : "";
            command += (currentCompile.platform == "node") ? " --platform=node" : ""

            switch (currentCompile.minify) {
                case true:
                    command += " --minify";
                    break;
            }

            switch (currentCompile.format) {
                case "cjs":
                    command += " --format=cjs";
                    break;
                case "esm":
                    command += " --format=cjs";
                    break;
                case "iife":
                default:
                    command += " --format=iife";
                    break;

            }

            for (let i = 1; i < currentCompile.out.length; i++) {

                await new Promise(function (resolve, reject) {

                    fs.copyFile(currentCompile.out[0], currentCompile.out[i], (err) => {
                        if (err) {
                            console.log("Error Found:", err);

                            reject(err);
                        }
                        else {

                            resolve();
                          
                        }
                    });

                });

            }

            // console.log(command.replace(/\//g, "\\\\"));


            // console.log(`.\\symphonee\\esbuild\\esbuild.exe ${fileObj.in} --outfile=${fileObj.out} --bundle ${(fileObj.watch === true) ? "--watch=forever" : ""}`);
            console.log(command.replace(/\//g, "\\\\"));
            await this.$exec(command.replace(/\//g, "\\\\")); //  `.\\symphonee\\esbuild\\esbuild.exe ${fileObj.in} --bundle --outfile=${fileObj.out} ${(fileObj.watch === true) ? "--watch=forever" : ""} --tree-shaking=true --minify`);

            // execute post-task
            await this.$exec(fileObj.post_task);
            console.log("post_task", fileObj.post_task, "\n\n");


        }

        console.log("all done");
        console.groupEnd("$trigger( ... )");

        return "esbuild completed";

    }

    async $install() {



    }

}

const esbuildTask = new EsbuildTask(process);

/*

require('esbuild').build({
  entryPoints: ['app.js'],
  outfile: 'out.js',
  bundle: true,
  watch: {
    onRebuild(error, result) {
      if (error) console.error('watch build failed:', error)
      else { 
        console.log('watch build succeeded:', result)
        // HERE: somehow restart the server from here, e.g., by sending a signal that you trap and react to inside the server.
      }
    },
  },
}).then(result => {
  console.log('watching...')
})


*/