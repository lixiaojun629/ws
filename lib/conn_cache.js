var sessionConnMap = {};
var userConnMap = {};
var projectConnMap = {};
var companyConnMap = {};

function saveConn(socket) {
	sessionConnMap[socket.id] = socket;

	userConnMap[socket.UserId] || (userConnMap[socket.UserId] = []);
	userConnMap[socket.UserId].push(socket);

	companyConnMap[socket.CompanyId] || (companyConnMap[socket.CompanyId] = []);
	companyConnMap[socket.CompanyId].push(socket);
}

function removeConn(socket) {
	delete sessionConnMap[socket.id];

	var indexUser = userConnMap[socket.UserId].indexOf(socket);
	userConnMap[socket.UserId].splice(indexUser,1);

	var indexCompany = companyConnMap[socket.CompanyId].indexOf(socket);
	companyConnMap[socket.CompanyId].splice(indexCompany,1);
}

module.exports = {
	session: sessionConnMap,
	user: userConnMap,
	project: projectConnMap,
	company: companyConnMap,
	save: saveConn,
	remove: removeConn
};
