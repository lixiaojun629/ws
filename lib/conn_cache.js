var sessionConnMap = {};
var userConnMap = {};
var projectConnMap = {};
var companyConnMap = {};

function saveConn(socket) {
	sessionConnMap[socket.id] = socket;

	insertMap(userConnMap, socket.UserId, socket);
	insertMap(companyConnMap, socket.CompanyId, socket);

	socket.ProjectIds.forEach(function (id) {
		insertMap(projectConnMap, id, socket);
	})
}

function insertMap(map, key, value) {
	map[key] || (map[key] = []);
	map[key].push(value);
}

function removeConn(socket) {
	delete sessionConnMap[socket.id];

	var indexUser = userConnMap[socket.UserId].indexOf(socket);
	userConnMap[socket.UserId].splice(indexUser, 1);

	var indexCompany = companyConnMap[socket.CompanyId].indexOf(socket);
	companyConnMap[socket.CompanyId].splice(indexCompany, 1);

	socket.ProjectIds.forEach(function (id) {
		var index = projectConnMap[id].indexOf(socket);
		projectConnMap[id].splice(index, 1);
	})
}

module.exports = {
	session: sessionConnMap,
	user: userConnMap,
	project: projectConnMap,
	company: companyConnMap,
	save: saveConn,
	remove: removeConn
};
