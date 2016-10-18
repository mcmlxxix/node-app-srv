# node-app-srv

Application service for [node-jsondb](https://github.com/mcmlxxix/node-jsondb) 

## Description

[node-app-srv](https://github.com/mcmlxxix/node-app-srv) is a static TCP socket service which accepts connections on a designated port from an instance of [node-app-client](https://github.com/mcmlxxix/node-app-client). 

## Installation

'npm install node-app-srv'

## Configuration

'./settings/settings.js'

	settings = {
		"host":				"localhost",
		"port":				10089,
		"maxconnections": 	200
	}

'./settings/databases.js'

	test:{
		file:		"./applications/test/db/test.json",
		locking:	"transaction",
		users:{
			admin:	"rw",
			guest:	"r"
		}
	}
	
'./settings/users.js'

	users = {	/* 	<name> 			:	<password> */
					"test"			:	"test",
					"guest"			:	"",
					"admin"			:	"admin"
	}
	
	groups = {	/* 	<name> 			:	<users> */
					"test"			:	["test","admin"],
					"guest"			:	[],
					"admin"			:	["admin"]
	}

## Usage

'node node-app-srv'



