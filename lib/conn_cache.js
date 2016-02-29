
var sessionConnMap = {};
var userConnMap = {};
var projectConnMap = {};
var companyConnMap = {};

function saveConn (socket){
    sessionConnMap[socket.id] = socket;

    userConnMap[socket.UserId] || userConnMap[socket.UserId] = [];
    userConnMap[socket.UserId].push(socket);

    companyConnMap[socket.CompanyId] || companyConnMap[socket.CompanyId] = [];
    companyConnMap[socket.CompanyId].push(socket);
}

modules.exports = {
    session: sessionConnMap,
    user: userConnMap,
    project: projectConnMap,
    company: companyConnMap,
    save: saveConn
}
