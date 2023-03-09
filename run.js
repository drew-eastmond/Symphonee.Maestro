const fs = require('fs');
const path = require('path');

const glob = require('glob');
const chokidar = require('chokidar');

// const vm = require('vm');

const { fork, spawn, execSync, exec } = require('child_process');

// require("./summon-custom.js");
// const Mythic = require("./Mythic.js");

const __ActiveModuleMap = new Map();
const __WatchMap = new Map();

function InjectTaskParameter(param, file, taskData) {

	return param;

}

function InjectConfigData(configFile) {

	let jsonString = fs.readFileSync(configFile, 'utf8');
	const variables = JSON.parse(jsonString).variables;

	for (const [key, value] of Object.entries(variables)) {

		jsonString = jsonString.replace(new RegExp(`{${key}}`, "g"), value);

	}

	return JSON.parse(jsonString);

}

async function $FetchModule(taskObj, file, targetModule) {

	targetModule = { ...taskObj, ...targetModule };

	const data = JSON.stringify(targetModule);
	const buff = Buffer.from(data);
	const base64data = buff.toString('base64');
	args = ["--file ", file, "--task", base64data];

	const taskName = taskObj.name;

	// console.log("targetModule", targetModule);

	if ("pre_task" in targetModule) {

		execSync(InjectTaskParameter(targetModule.pre_task, { targetModule, "file": file }), { stdio: 'inherit' });

	}

	let iModule;
	if ("spawn" in targetModule) {

		const commands = targetModule.spawn.split(/\s+/);

		if (__ActiveModuleMap.has(taskName) === false ) {

			const childProcess = spawn(commands[0], [commands[1], ...args]);

			__ActiveModuleMap.set(taskName, childProcess);

			childProcess.stdout.on('data', (data) => {
				// console.log ( `${filterData.id} : ${data}` );
				console.log(`${data}`);
			});

			childProcess.stderr.on('data', (data) => {
				console.error(taskName, `stderr: ${data}`);
			});

			childProcess.on('close', (code) => {
				console.log(taskName, `child process exited with code ${code}`);
			});

		}

		iModule = __ActiveModuleMap.get(taskName);

	} else if ("fork" in targetModule) {

		if (__ActiveModuleMap.has(taskName) === false) {

			const commands = targetModule.fork.split(/\s+/);

			const child = fork(commands[0], { "stdio": "inherit" });
			child.send([commands.slice(1), targetModule]);

			__ActiveModuleMap.set(taskName, child);

		}

		iModule = __ActiveModuleMap.get(taskName);
		iModule.send({ "file": file });

			// use the onMessage to wait until the child is done. It consider child task is async
		let onMessage;
		await new Promise(function (resolve, reject) {

			onMessage = (message) => {

				if (message[0] == "resolve") {

					resolve(message[1]);
					console.log("task resolved", message[1]);

				} else if (message[0] == reject) {

					reject(message[1]);
					console.log("task rejected", message[1]);

				}

			};

			iModule.on('message', onMessage);

		})
			.finally(function () {

				iModule.off('message', onMessage);

			});

	} else if ("exec" in targetModule) {

		const commands = targetModule.exec.split(/\s+/);
		console.log("executing", [...commands, ...args].join(" "));
		// console.log([commands, ...args].join(" "));
		const result = exec([...commands, ...args].join(" "), { stdio: 'pipe' }, (err, stdout, stderr) => {
			if (err) {
				console.error(err);
				return;
			}
			console.log(stdout);
		});
		console.log(result.toString());

	} else {

		console.warn("Task has no execution point: " + targetModule.id);
		console.warn(targetModule);

	}

	if ("post_task" in targetModule) {

		execSync(InjectTaskParameter(targetModule.post_task, { targetModule, "file": file }), { stdio: 'inherit' });

	}

	return iModule;

}

let pathParse;
// let compileDir;
let watchReady = false;
let compilableFiles = [];

const files = glob.sync("**/.tasks");
files.forEach(async (file) => {

	const configObj = InjectConfigData(file);

	// console.log(configObj);

	// pathParse = path.parse(file);
	// compileDir = pathParse.dir;

	for (const taskData of configObj.tasks) {

		if (taskData.enabled === false) continue;

		const watchObj = taskData.watch;
		if (watchObj && watchObj.match !== undefined) {

			// console.log(watchObj.match);
			compilableFiles.push(watchObj.match);
			__WatchMap.set(watchObj.match, taskData);

		}

	}

	// auto start the filters
	console.log("found: ", configObj);


	for (const taskData of configObj.tasks) {

		if (taskData['start'] === undefined || taskData.enabled === false) continue;

		if (taskData.cwd !== undefined) {

			process.chdir(taskData.cwd);

		}

		const iModule = await $FetchModule(taskData, "--start--", taskData.start);

	}

});

// compilableFiles = [compileDir + '/ts/**/*\.ts', compileDir + '/js/**/*\.js', compileDir + '/scss/**/*\.scss', compileDir + '/twig/**/*\.twig', compileDir + '/js/**/*\.json'];
console.log("compilableFiles", compilableFiles);

chokidar.watch(compilableFiles, { 'ignored': [/(^|[\/\\])\../] }).on('all', async (event, filePath) => {

	switch (event) {
		case 'add':
			// do nothing. This is too volitile!
			break;
		case 'unlink':

			break;
		case 'change':

			watchReady = true;
			break;
		default:

	}

	if (watchReady) {

		const dependencyMap = new Map();
		const dependencies = [];

		// find what task matches the current file
		for (let [watch, taskObj] of __WatchMap) {

			if (/\*\*[\/\\]*/.test(watch)) {

				watch = watch.replace(/\*\*[\/\\]\*/, "(.+?)");

			} else if (/\*/.test(watch)) {

				watch = watch.replace(/\*/, "(.+?)");

			}

			const regExp = new RegExp(watch);
			if (regExp.test(watch)) {

				const iModule = await $FetchModule(taskObj, filePath, taskObj.watch);

			} else {

				console.log("no match", filePath);

			}

		}

	}

});