"use strict";

const Hapi = require("@hapi/hapi");

const server = Hapi.server({
	port: 3000,
	host: "0.0.0.0",
});

server.route({
	method: "GET",
	path: "/",
	handler: (request, h) => {
		request.logger.info("In handler %s", request.path);
		return "Hello, world!";
	},
});

const init = async () => {
	await server.register({
		plugin: require("hapi-pino"),
		options: {
			prettyPrint: true,
			logEvents: ["response", "onPostStart"],
		},
	});

	await server.start();
	console.log(`Server running at: ${server.info.uri}`);
};

process.on("unhandledRejection", (err) => {
	console.log(err);
	process.exit(1);
});

// quit on ctrl-c when running docker in terminal
process.on("SIGINT", function onSigint() {
	console.info(
		"Got SIGINT (aka ctrl-c in docker). Graceful shutdown ",
		new Date().toISOString()
	);
	shutdown();
});

// quit properly on docker stop
process.on("SIGTERM", function onSigterm() {
	console.info(
		"Got SIGTERM (docker container stop). Graceful shutdown ",
		new Date().toISOString()
	);
	shutdown();
});

// shut down server
function shutdown() {
	// NOTE: server.close is for express based apps
	// If using hapi, use `server.stop`
	server.stop();
}

init();
