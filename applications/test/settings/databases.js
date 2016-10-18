/* configure databases here */
var databases = {
	
	/* database namespace */
	test:{
		
		/* database storage file */
		file:		"./applications/test/db/test.json",
		/* database locking (none, full, transaction) */
		locking:	"none",
		/* user access (separate from group membership) */
		users:{
			admin:	"rw",
			test:	"r"
		}
		
	}
}

module.exports = databases;