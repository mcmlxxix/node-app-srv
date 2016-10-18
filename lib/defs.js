var error = {
	/* non-errors */
	NONE: 			0,

	/* database errors */
	LOCK: 			1,
	UNLOCK: 		2,
	WRITE:			3,
	READ: 			4,

	/* service errors */
	INVALID_REQUEST:5,
	INVALID_PATH: 	6,
	INVALID_DB: 	7,
	INVALID_OPER: 	8,
	INVALID_USER: 	9,
	INVALID_PASS: 	10,
	AUTH_REQD: 		11,
	NOT_AUTHORIZED:	12,
	USER_GROUP:		13

};

var oper = {
	/* operations */
	READ: 			0,
	WRITE: 			1,
	LOCK: 			2,
	UNLOCK: 		3,
	SUBSCRIBE: 		4,
	UNSUBSCRIBE: 	5,
	AUTH: 			6
};

var lock = {
	/* lock types */
	READ: 			"r",
	WRITE: 			"w",
	/* lock-level options */
	NONE: 			null,
	TRANS:	 		"transaction",
	FULL: 			"full"
};

module.exports = {
	error:error,
	oper:oper,
	lock:lock
}
