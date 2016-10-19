/** JSON application server - application example

	all packets are to be in JSON format, terminated by a CRLF
		
	REQUEST:{
		id		: <request id>,
		app		: <application namespace>,
		db 		: <database name>,
		oper	: <operation>,
		data	: <see below>,
		user	: <username (auth only)>,
		pass	: <password (auth only)>
	}
	
	*** database queries ***
	
	oper = READ
		data = [
			{ path:"path/to/data" },
			...
		];
	
	oper = WRITE
		data = [
			{ path:"path/to/data", key:"child_property", value:"value_to_be_written" },
			...
		];
	
	oper = UN/LOCK
		data = [
			{ path:	"path/to/data", lock: <see lock types> },
			...
		];
		
	oper = UN/SUBSCRIBE
		data = [
			{ path:	"path/to/data" },
			...
		];
		
	LOCK TYPES
		read = "r"
		write = "w"
		append = "a"	
**/

var db = require('node-jsondb');
var fs = require('fs');
var defs = global.defs;
var oper = defs.oper;
var err = defs.err;
var lock = defs.lock;

/* json database object */
var databases;
var settings;

/* logging constants */
const LOG_INFO = 1;
const LOG_WARNING = 2;
const LOG_ERROR = 3;
const LOG_DEBUG = 4;

/* this is where the majick happens.. you can specify anything you want here, in terms of 'request.oper', 
just make sure the client is speaking your language, unowudimean? */
function handleRequest(socket,request,callback) {
	
	/* if no operation was specified, we dont know what this request is for */
	if(request.oper == undefined) {
		return sendError(request,callback,err.INVALID_OPER);
	}
	
	/* because this example application is meant to just interact with a database, the db property must be defined */
	if(request.db == undefined) {
		return sendError(request,callback,err.INVALID_DB);
	}

	/* if the request database does not exist */
	var database = databases[request.db.toUpperCase()];
	if(database == undefined) {
		return sendError(request,callback,err.INVALID_DB);
	}
	
	/* for purposes of demonstration, these are the standard database 'write' commands and how to deal with them
	NOTE: we still handle the read commands here, as a 'write' lock permits reading */
	if(canWrite(database,socket.user)) {
		switch(request.oper) {
		case oper.READ:
			database.read(request,callback);
			break;
		case oper.WRITE:
			database.write(request,callback);
			break;
		case oper.LOCK:
			database.lock(request,callback);
			break;
		case oper.UNLOCK:
			database.unlock(request,callback);
			break;
		case oper.SUBSCRIBE:
			database.subscribe(request,callback);
			break;
		case oper.UNSUBSCRIBE:
			database.unsubscribe(request,callback);
			break;
		default:
			sendError(request,callback,err.INVALID_OPER);
			break;
		}	
	}
	/* for purposes of demonstration, these are the standard database 'read' commands and how to deal with them
	NOTE: we return an error if a 'write' operation is attempted with a 'read' lock */
	else if(canRead(database,socket.user)) {
		switch(request.oper) {
		case oper.WRITE:
		case oper.LOCK:
		case oper.UNLOCK:
			sendError(request,callback,err.NOT_AUTHORIZED);
			break;
		case oper.READ:
			database.read(request,callback);
			break;
		case oper.SUBSCRIBE:
			database.subscribe(request,callback);
			break;
		case oper.UNSUBSCRIBE:
			database.unsubscribe(request,callback);
			break;
		default:
			sendError(request,callback,err.INVALID_OPER);
			break;
		}	
	}
	/* we dont know what the fuck is going on, just send an error */
	else {
		sendError(request,callback,err.NOT_AUTHORIZED);
	}	
}

/* database access helpers */
function canWrite(database,user) {
	if(database.users[user.name] == null)
		return false;
	return /w/.test(database.users[user.name]);
}
function canRead(database,user) {
	if(database.users[user.name] == null)
		return false;
	return /r/.test(database.users[user.name]);
}

/* error response */
function sendError(request,callback,error) {
	request.status = error;
	callback(request);
}

/* create databases */
function load(dblist) {
	var dbs = {};
	for(var d in dblist) {
		var jsondb = db.create(d);
		jsondb.users = dblist[d].users;
		jsondb.settings.locking = dblist[d].locking;
		jsondb.settings.maxconnections = settings.maxconnections;
		fs.exists(dblist[d].file, function (exists) {
			if(exists)
				jsondb.load(dblist[d].file);
			else
				log('database file not found: ' + dblist[d].file,LOG_ERROR);
		});		
		dbs[d.toUpperCase()] = jsondb;
	}
	return dbs;
}

/* load settings and initialize application databases */
function init() {
	settings = require('./settings/settings');
	var dblist = require('./settings/databases');
	databases = load(dblist);
}

/* dew it */
init();

var Emitter = require('events');
module.exports = new Emitter();
module.exports.on('request',handleRequest);