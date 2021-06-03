# Docker-Node 

##Docker File
* Use `COPY`instead of `ADD` to copy files into the container. ADD can do a lot more stuff that just copy files such as downloading files from internet, so don't use `ADD` unless you're sure you need it.
* use npm/yarn to install during build. Whaterever you use make sure you clean it up (ex using `npm cache clean --force`) so your image is small as possible.
* Use node in `CMD`, not npm. if node is executed by npm it will run as a subprocess of npm and this will add some complexity and unnecesary layer. Another reason is npm doesn't work well as an init or PID 1 process.
* Use `WORKDIR` whenever possible.

## Base Image Guidelines
* Stick to even versions, those are stable releases.
* Don't use `:latest`, unless not for production env.
* Use a `DEBIAN` base image is in general a good idea.
* `Alpine` is a very small base image and has only the minimal tools to run node. `Debian` base image may have more os based packages so with `Alpine` you may need to make sure that the image support the packages u need.
* Don't use `:slim`. It is tipically an smaller version of debian but it is better to use `Alpine`.
* Don't use `:onbuild`.
* You can create you're node image even when it is not available in the official node images in docker hub. Look how it can be build base on CentOs Image on `/CentOs`. This should be done only if it is a requirement in your company otherwise just use on of the official images of node in docker hub.

```sh 
cd CentOs/
docker build -t centos-node .
docker run centos-node node --version
```

## When to use Alpine?
* `Alpine` is small and security focused image but now `Debian/Ubuntu` are now smaller too. 100MB space saving isn't significant for you server. 
* `Alpine` also has its own issues and security vulnerablities just like all open source software.
* `Alpine` CVE scanning fails.

## Least Privilege: Using node User
* root in container doesn't mean root in the host, in fact that is one of the purposes of using container however we want to continure reducing risk inside container so it is a good practice to run your container as a not root user.
* Official node images have a node user but it is not enable by default. (use the following command in your `Dockerfile`).
```sh
USER node
```
After this command any of these command (`RUN`,`ENTRYPOINT`,`CMD`) will be using node user to execute those, everything else will still be using root. **Meaning that commands such as WORKDIR will create directories as root with root permissions so there is where you will need to use chown to change directory permissions**. 
* remember to perform root commands such as `apt/apk` and `npm i -g` before to switch to non root user.
* later on when using node user you might encounter permissions issues with write access, may require `chown node:node`. The following command manually creates a directory and change permissions in that directory so the node group and node user can do things like running `npm i` or writting some cache files.
```sh
RUN mkdir app && chown -R node:node .
```
* In case you need to enter into the container as root you can still do that.
```sh
docker-compose exec -u root
```
* look on `/user-node` for further details.
 

## Making Images Efficiently
* Pick proper `FROM`.
* Line order matters. remember each line is executed as new layer in the image. if you have layers that don't  change very often but they are at the bottom of the file then you end up with those layers being built over and over again for no reason. So better if you can put at the top these layers(commands) that don't will change frequently.
* `COPY` twice. first copy package files , then install and then copy source code:
```sh
# * means that will copy the file only if it exists on your local
COPY package.json package-lock.json* ./
RUN npm install && npm cache clean --force
COPY . .
```
In that way we avoid to re install npm packages all the time we have a code change, meaning that we will only execute npm install when there is a change in package.json.(remember layers nature when building image).
* Put your os specific install at top of the dockerfile and all installations at once.(always pin versions)


## Node Process Management in Containers
* No need for nodemon, forever, or pm2 on server because docker does a great job at managing processes. Docker manages app start, stop, restart and healthcheck.
* As you know, Node.js is a single threaded language which in background uses multiple threads to execute asynchronous code. Docker manages multiple "replicas" to harness vcpus in your container.
* One npm/node problem : They don't listen for proper shutdown signal by default.

### PD1 Process (Running Node as main process)
* PD1 (Init Process) is the first process in a system(or container). In linux in means that this process have a couple responsabilities such as:
- handle zombie processes (Process that don't have a parent). Init process should clean up those processes.
- pass signal to sub-process.
* Every process except PD1 is created by another process invoking the fork() system call.
* Zombie process is not an issue with Node.

### CMD For healthy shutdown
* Shutdown is about signals comming from docker, and docker gets those either from itself or from OS(ctrl+c).
* Signals to stop are SIGINT(ctl+c) / SIGTERM(docker container stop) / SIGKILL.
* SIGINT and SIGTERM allow for  grateful stop.
* SIGKIll is used by default by docker after some seconds in case there is no response for SIGINT or SIGTERM
* npm doesn't respond to SIGINT/SIGTERM , that why it is not a good idea uset to start node in production environment.
* node doesn't respond by default to these signals but **it can be done with code** in case you want to do some sort of cleanup before finish up the process.
```sh
CMD ["node", "app.js"] instead of CMD ["npm", "start"]
```
### Proper Node Shutdown Options
* Temporal solution -> Use `--init` in docker run command. The `--init` flag inserts a tiny init-process into the container as the main process to make sure that any app will be wrapped  by his process and make  sure it properly handles terminations. This not propetly handles your node connections but at least will respond inmediatly to any `ctr+c`or any other termination method.
```sh
docker run --init -d nodeapp
```
* Permanent Workaround -> Adding tini manually to your image. you not need to use `--init` instead you specify tini in your `Dockerfile`.
```sh
RUN apk add --no-cache tini
# Entry point will run first and will wrap the CMD . This is what docker is doing in the background when include
# --init 
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "./bin/www"]
```
* Production -> Your app captures SIGINT for proper exit. look into [`sample.js`](2-graceful-shutdown/sample.js).

