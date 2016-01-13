/**
 *
 * Created by rilke on 16/1/13.
 */

var pubClient = require('../lib/redis')();
var subscribe = require('../lib/subscriber');
var messageDao = require('../lib/dao');

function process(client) {
	client.on('message', function (channel, message) {
		console.log(channel,message);
		messageDao.save(message);
	})
}
subscribe(['my_channel','my_channel1']).then(function(client){
	process(client);
	pubClient.publish('my_channel',JSON.stringify(message));
});

var message = {
	//消息体,会推送到浏览器
	body: {
		content: "this is a test",
		resourceId: "uhost-xsdfa"
	},
	expireTimeStamp: 1452677496000, //毫秒
	userEmailList: ['lixiaojun@ucloud.cn', 'wangjianliang@ucloud.cn', 'uweb@ucloud.cn']
};

