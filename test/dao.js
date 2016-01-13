/**
 * Created by rilke on 16/1/13.
 */

var message = {
	//消息体,会推送到浏览器
	body: {
		content: "this is a test",
		resourceId: "uhost-xsdfa"
	},
	expireTimeStamp: 1452674692742, //毫秒
	userEmailList: ['lixiaojun@ucloud.cn', 'wangjianliang@ucloud.cn', 'uweb@ucloud.cn']
};

var dao = new MessageDao();
dao.save(message).then(dao.getAll.bind(dao)).then(function(data){
	console.log(data)
});


