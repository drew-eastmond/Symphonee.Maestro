const { fork, spawn, execSync, exec } = require('child_process');
const fs = require("fs");

class GenericTask {

    constructor() {

        const _this = this;

        process.on("message", async function (message) {

            // console.log("message",message);

            if (message instanceof Array) {

                _this.args = message[0];
                _this.task = message[1];

                _this.$start(_this.args, _this.task);

            } else {

                if (await _this.$validate(message) !== false) {

                    _this.$trigger(message)
                        .then(function (resolve) {

                            console.log("Resolved");

                            process.send(["resolve", resolve]);

                        })
                        .catch(function (err) {

                            console.log(err);
                            process.send(["reject", err]);

                        })

                }

            }

        });

        // console.log(process.argv)

        this.args = {};
        for (let i = 2; i < process.argv.length; ) {

            const key = process.argv[i++];

            if (key == "--task") {

                this.task = JSON.parse(Buffer.from(process.argv[i++], 'base64').toString('utf8'));

            } else {

                this.args[key.replace("--", "")] = process.argv[i++];

            }
            
        }

        (async function () {

            console.log("async", _this.task, _this.args);
            await _this.$validate(undefined, _this.task, _this.args);

            await _this.$install(_this.task, _this.args);

        })();

    }

    async $trigger(file) {

    }

    async $start() {

    }

    async $install() {

    }

    async $validate(file, task, args) {

    }

    async $render() {

    }

    async $help() {


    }

    async $exec(command, options) {

        if (command === undefined) return;

        execSync(command, options || { stdio: 'inherit' });

    }

    async $spawn(command, args, options) {

        spawn(command, args, options || { stdio: 'inherit' });

    }

    async $fork(command, args, options) {

        fork(command, args, options || { stdio: 'inherit' });

    }

    async replicateFile(output, file) {

        if (file instanceof Array) {

            for (const entry of file) {

                fs.writeFileSync(entry, output, "utf-8");

            }

        } else {

            fs.writeFileSync(file, output, "utf-8");

        }

    }
}

module.exports = {
    GenericTask
};