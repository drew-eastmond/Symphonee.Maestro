const fs = require("fs");

const { GenericTask } = require("../GenericTask");

class ExpressTask extends GenericTask {

    constructor(process) {

        super(process);

        console.log("ExpressTask constructed");

    }

    async $start() {

        const task = this.task;
        const args = this.args;

        console.log("Express", task, args);

        const express = require("express");
        const app = express();

        const root = task.root + ((task.root.endsWith("/")) ? "" : "/");

        console.log("root", root);

        app.use(express.static(root, {
            setHeaders: (res) => {
                res.set('Cross-Origin-Opener-Policy', 'same-origin');
                res.set('Cross-Origin-Embedder-Policy', 'require-corp');
            }
        }));
        app.use(function (req, res, next) {

            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            res.setHeader('Cross-Prigin-Opener-Policy', 'same-origin');

            // Cross - Origin - Embedder - Policy

            // res.status(200);

            // if (req.method === 'OPTIONS') {
            //     res.sendStatus(200)
            // } else {
            next();
            //}

        });


        app.get("*", function (req, res, next) {

            // res.setHeader('Access-Control-Allow-Origin', '*');
            // res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
            // res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            // res.setHeader('Cross-origin-Embedder-Policy', 'require-corp');
            // res.setHeader('Cross-origin-Opener-Policy', 'same-origin');

            const html = fs.readFileSync(root + "index.html", "utf-8");
            res.send(html);

            next();

        });

        app.get("test", function (req, res, next) {

            const html = fs.readFileSync(root + "index.html", "utf-8");
            res.send(html);

        });

        app.listen(1234);

        console.log("ExpressTask constructed");

    }

    async $validate() {

        if (this.task.root === undefined) throw `root property not assign to task: '${this.task.name}'. Im not a mind reader!`;

    }

    async $install(taskData, args) {

        // this.exec("npm install express");

    }

}

const expressTask = new ExpressTask(process);
expressTask.$validate();
expressTask.$start();