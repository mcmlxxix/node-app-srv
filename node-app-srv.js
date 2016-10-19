/** node.js JSON application service - mcmlxxix - 2016

	passes all inbound requests to a specified application module
	handling of all requests (with the exception of server authentication) is done by application
	
**/

/* local variables */
var fs, db, net, srv, rl, tx, err, defs, oper, crypto, pako, log, settings, dblist, databases, identities, users, groups, applications, clients;

/* global shit */
global.defs = require('./lib/defs');
global.addUser = function(userName,password) {
	if(!users[userName]) {
		users[userName] = password;
		return true
	}
	return false;
}
global.addGroup = function(groupName) {
	if(!groups[groupName]) {
		groups[groupName]=[];
		return true;
	}
	return false;
}
global.addGroupUser = function(userName,groupName) {
	if(!users[userName] || !groups[groupName]) 
		return false;
	if(isGroupMember(groups[groupName],users[userName]))
		return false;
	groups[group].push(userName);
	return true;
}
global.delUser = function(userName) {
	if(!users[username]) 
		return false;
	delete users[username];
	return true;
}
global.delGroup = function(groupName) {
	if(!groups[groupName]) 
		return false;
	delete groups[groupName];
	return true;
}
global.delGroupUser = function(userName,groupName) {
	if(!users[userName] || !groups[groupName]) 
		return false;
	var n = isGroupMember(groups[groupName],users[userName]);
	if(n<0)
		return false;
	groups[groupName].splice(n,1);
	return true;
}
global.saveUsers = function() {
	fs.writeFileSync('./settings/users.json','{\r\n' + JSON.stringify(users) + JSON.stringify(groups) + '\r\n}','utf8');
	log('user/group list saved to ' + './settings/users.json');
}
global.getClients = function(app) {
	var clist = [];
	for(var c in clients) {
		if(app && app != c.app) 
			continue;
		clist.push(c);
	}
	return clist;
}

/* console logging constants */
const LOG_INFO = 1;
const LOG_WARNING = 2;
const LOG_ERROR = 3;
const LOG_DEBUG = 4;

/* server events */
function onError(e) {
	switch(e.code) {
	case 'EADDRINUSE':
		log('server address in use',LOG_ERROR);
		exit(0);
	case 'ECONNRESET':
		break;
	default:
		log(e);
		break;
	}
}
function onListen() {
	log("server listening for connections",LOG_INFO);
}
function onCreate() {
	srv.on('error',onError);
	srv.on('connection',onConnection);
}
function onConnection(socket) {
	log('connected: ' + socket.remoteAddress,LOG_INFO);
	socket.setEncoding('utf8');
	socket.id = identities.shift();
	socket.ip = socket.remoteAddress;
	socket.rl = rl.createInterface({
		input:socket,
		output:socket
	});
	socket.rl.on('line',(data) => {
		parseRequest(socket,data);
	});
	socket.on('close',() => {
		log('disconnected: ' + socket.ip,LOG_INFO);
		delete clients[socket.id];
		identities.push(socket.id);
		socket.rl.close();
	});
	socket.on('error', onError);
}
 
/* parse minified request */
function parseRequest(socket,data) {
	var request = undefined;
	var result = undefined;
	try {
		//data = pako.inflate(data,{to:'string'});
		log('<< ' + data,LOG_DEBUG);
		request = tx.decode(JSON.parse(data));
	} 
	catch(e) {
		return sendError(socket,{data:data},err.INVALID_REQUEST);
	}
	if(request == undefined) {
		return sendError(socket,{data:data},err.INVALID_REQUEST);
	}
	try {
		result = handleRequest(socket,request);
	}
	catch(e) {
		log(e.stack,LOG_ERROR);
		return false;
	}
	return result;
}
/* handle inbound requests */
function handleRequest(socket,request) {
	//var startTime = Date.now();
	/* assign missing client ID */
	if(request.id == null) {
		request.id = socket.id;
	}
	/* authenticate client --
	this may end up being in a switch statement if there will be more operations 
	supported at the application server level (application management, etc) */
	if(request.oper == oper.AUTH) {
		return authenticate(socket,request,callback);
	}
	/* dont accept requests from unauthenticated clients */
	if(socket.user == null) {
		return sendError(socket,request,err.AUTH_REQD);
	}
	/* if no application was requested */
	if(request.app == undefined) {
		return sendError(socket,request,err.INVALID_DB);
	}
	/* if the requested application is not found */
	var app = applications[request.app.toLowerCase()];
	if(app == undefined) {
		return sendError(socket,request,err.INVALID_DB);
	}
	/* if the authenticated user is not in the application group */
	if(!isApplicationUser(app,socket.user)) {
		return sendError(socket,request,err.USER_GROUP);
	}
	/* pass request to application request handler */
	app.emit('request',socket,request,callback);
	
	/* callback is passed to all application request handlers */
	function callback(response) {
		//var endTime = process.hrtime();
		// if(request.id == null)
			// request.id = socket.id;
		//request.data = response;
		//request.elapsed = endTime - startTime;
		response.qid = request.qid;
		return respond(socket,response);
	}
	return true;
}
/* attach error code to response packet */
function sendError(socket,request,e) {
	request.status = e;
	respond(socket,request);
}
/* request response */
function respond(socket,response) {
	response = JSON.stringify(tx.encode(response));
	log('>> ' + response,LOG_DEBUG);
	//response = pako.deflate(response,{to:'string'});
	return socket.write(response + "\r\n");
}
/* authenticate a client connection */
function authenticate(socket,request,callback) {
	var usr = request.data;
	if(users[usr.name]) {
		var pw = users[usr.name];
		var hash = crypto.createHash('md5').update(pw).digest('hex');
		if(hash == usr.pass) {
			socket.user = usr;
			request.status = err.NONE;
		}
		else {
			request.status = err.INVALID_PASS;
			delete socket.user;
		}
	}
	else {
		request.status = err.INVALID_USER;
		delete socket.user;
	}
	sortClient(socket,request);
	callback(request);
	return true;
}
/* store authenticated client in clients object */
function sortClient(socket, request) {
	clients[socket.id] = { socket:socket, app:request.app };
}
/* determine if authenticated user is in an application group list */
function isApplicationUser(app,user) {
	/* application allows anonymous access */
	if(!app.appdata.groups) {
		return true;
	}
	/* if we are allowing access to all groups */
	if(app.appdata.groups == "*" || app.appdata.groups[0] == "*") {
		for(var ug=0;ug<groups.length;ug++) {
			if(isGroupMember(groups[ug],user))
				return true;
		}
	}
	/* otherwise, search specified groups */
	for(var ag=0;ag<app.appdata.groups.length;ag++) {
		var agroup = app.appdata.groups[ag];
		if(isGroupMember(groups[agroup],user))
			return true;
	}
	return false;
}
/* determine if user is in a given user group */
function isGroupMember(group,user) {
	for(var u=0;u<group.length;u++) {
		if(group[u] == user.name) {
			return u;
		}
	}
	return -1;
}
/* client identity pool */
function getPool(num) {
	var pool = [];
	for(var i=0;i<num;i++)
		pool.push(i);
	return pool;
}
/* load applications and settings */
function loadApplications(alist) {
	var apps = {};
	for(var a in alist) {
		var fName = alist[a].dir + alist[a].file;
		fs.exists(fName, function (exists) {
			if(exists) {
				log('loading application: ' + a,LOG_DEBUG);
				apps[a] = require(fName);
				apps[a].appdata = alist[a];
				log('application loaded: ' + a,LOG_DEBUG);
			}
			else {
				log('application file not found: ' + fName,LOG_ERROR);
			}
		});		
	}
	return apps;
}
/* initialization */
function init() {

	err = global.defs.error;
	oper = global.defs.oper;
	
	tx = require('./lib/transform');
	log = require('node-logger');
	net = require('net');
	fs = require('fs');
	rl = require('readline');
	crypto = require('crypto');
	//pako = require('pako');
	
	settings = require('./settings/settings');
	identities = getPool(settings.maxconnections);
	
	var ug = require('./settings/users'); 
	users = ug.users;
	groups = ug.groups;
	
	var alist = require('./settings/applications');
	applications = loadApplications(alist);
	clients = {};
	
	srv = net.createServer();
	srv.on('listening',onListen);
	srv.listen({'port':settings.port,'host':settings.host},onCreate);
	log('application server initialized',LOG_INFO);
}

/* and...go */
init();
