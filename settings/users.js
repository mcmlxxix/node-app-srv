/*	user configuration file -
	modify the below examples to 
	configure users as needed. 
	
	NOTE: each user name must be unique. */

/* user settings */
users = {	

	/* 	<name> 			:	<password> */
		"admin"			:	"admin",
		"testuser"		:	"test"
}

/* user groups (see applications.js for application-specific group membership) */
groups = {
	
	testgroup:[
		"admin",
		"testuser"
	],
	
	admin:[
		"admin"
	]
}

/* dont touch this shit */
module.exports = { users:users,groups:groups };