const sass = require("sass");

const { GenericTask } = require("../GenericTask");

const sassTask = new GenericTask(process);
sassTask.$start()
    .then(function (genericTask) {

        var result = sass.renderSync({
            file: genericTask.args.file
        });

        console.log(result);

    });