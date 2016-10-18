applications = {
	
	/* application namespace */
	test:{
		
		/* application name */
		name:		"Test",
		
		/* application directory */
		dir:		"./applications/test/",
		
		/* application launch script */
		file:		"test.js",
		
		/* application user groups (see users.js for group settings) */
		groups:		["testgroup","admin"]
	}
	
	/*, etc:{...} */
}

/* dont touch this shit */
module.exports = applications;