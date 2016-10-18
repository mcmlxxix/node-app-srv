# node-app-srv

Application service for [node-jsondb](https://github.com/mcmlxxix/node-jsondb) 

## Description

[node-app-srv](https://github.com/mcmlxxix/node-app-srv) is a static TCP socket service which accepts connections on a designated port from an instance of [node-app-client](https://github.com/mcmlxxix/node-app-client). 

## Installation

'npm install node-app-srv'

## Service Configuration

'./settings/settings.json'

{
	settings:{
		"host":				"localhost",
		"port":				10089,
		"maxconnections": 	200
	}
}

'./settings/applications.json'

{
	/* application namespace */
	test:{
		/* application name */
		name:		"Test",
		/* application directory */
		dir:		"./applications/test/",
		/* application launch script */
		file:		"test.js",
		/* application user groups (see users.js for group membership) */
		groups:		["testgroup","admin"]
		/* NOTE: comment out "groups" property to allow anonymous access, 
		set "groups" value to "*" to allow all groups access */
	},
	test2:{
		...
	}
}

'./settings/users.json'

{
	/* NOTE: each user name must be unique, and comments must be removed */
	users:{	
		/* 	<name> 			:	<password> */
			"admin"			:	"admin",
			"guest"			:	"", 
			"testuser"		:	"test"
	},
	/* NOTE: guest user should remain in user list if you wish to allow anonymous access to any applications
	(guest users must still authenticate) */

	/* user groups (see applications.js for application-specific group membership) */
	groups:{
		guest:[
			"guest"
		],
		testgroup:[
			"testuser"
		],
		admin:[
			"admin"
		]
	}
	/* NOTE: guest group should remain in group list to allow easier control of guest access to applications */
}

## Application Configuration

'./settings/databases.json'

{
	test:{
		file:		"./applications/test/db/test.json",
		locking:	"transaction",
		users:{
			admin:	"rw",
			guest:	"r"
		}
	}
}

## Usage

'node node-app-srv'



