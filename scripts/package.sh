#!/bin/bash
project_name=`cat scripts/server.conf | grep project_name | awk '{print $2}'`
version="";
branch="";
server_group = "";
environment="";
publish_user=root;
project_path="/srv/http/${project_name}/"

echo "==============================================";
echo "准备发布: ${project_name}";

if [[ "x${server_group}" == "x" ]]; then
    echo "==============================================";
    echo "请输入要发布的服务器分组, sg1: 172.17.144.22 172.17.144.29;  sg2: 172.17.144.36 172.17.144.43";
    read server_group;
fi

if [[ "x$1" == "x" ]]; then
    echo "==============================================";
    echo "请输入要发布的版本号码!例如: [0.0.1]";
    read version;
fi

if [[ "x$1" == "x" ]]; then
    echo "==============================================";
    echo "请输入要发布的分支!例如: [master]";
    read branch;
fi

if [[ "x$2" == "x" ]]; then
    echo "==============================================";
    echo "请输入要发布环境!例如: [dev|production|vip]";
    read environment;
fi


SERVERS=`cat scripts/server.conf | grep ${environment} | awk -F '=' '{print $2}'`

if [[ "x${SERVERS}" == "x" ]]; then
    echo "==============================================";
    echo "没有找到目标服务器配置 请联系 wentianle@ucloud.cn 确认";
    exit 1;
fi

#==============================================================================================================

confirm="N";

echo "==============================================";
echo "即将发布 项目:${project_name} 分支:${branch}-- 版本:${version}  -- 发布到: ${environment} : ${SERVERS} -- 是否继续 [N/y]";

read confirm

case "${confirm}" in
    [yY]) ;;
    *) exit 1;;
esac


#==============================================================================================================
confirm="N";
tag_name="${project_name}-${branch}-${version}";

echo "==============================================";
echo "即将打包程序并 创建tag ${tag_name} 请确认是是否 所有文件已经提交, 是否继续 [N/y]";

read confirm

case "${confirm}" in
    [yY]) ;;
    *) exit 1;;
esac

echo "正在检查远端是否有更新";

git fetch;

#==============================================================================================================

confirm="N";

echo "==============================================";
echo " 是否继续创建 tag [N/y]";
read confirm

case "${confirm}" in
    [yY]) ;;
    *) exit 1;;
esac


echo "==============================================";
echo "开始强制创建 tag  ${tag_name}";
git tag --force ${tag_name};
git push --tags;

#==============================================================================================================

echo "==============================================";
filename=${tag_name}.tar.gz;
echo "开始强制创建 tar 包 ${filename}";
git archive ${branch} | gzip > ~/export/${filename};
echo "git archive ${branch} | gzip > ~/export/${filename}";
echo $filename;


#==============================================================================================================

echo "==============================================";
confirm="N";
echo " 是否发布到 ${environment} 环境 [N/y]";
read confirm

case "${confirm}" in
    [yY]) ;;
    *) exit 1;;
esac

echo "==============================================";

version_path="${project_path}"

# 上传并解压文件 对正在运行的没有影响

echo $SERVERS
echo " ssh ${publish_user}@${SERVERS} 'mkdir -p ${version_path}'"
echo " scp ~/export/${filename} ${publish_user}@${SERVERS}:${version_path}/${filename}"
echo " ssh ${publish_user}@${SERVERS} 'cd ${version_path} && tar xf $filename'"
echo " ssh ${publish_user}@${SERVERS} 'cd ${version_path} && gulp build'"
echo " ssh ${publish_user}@${SERVERS} 'cd /srv/http && sh project_sync.sh ${project_name}'"

ssh ${publish_user}@${SERVERS} "mkdir -p ${version_path}"
scp ~/export/${filename} ${publish_user}@${SERVERS}:${version_path}/${filename}
ssh ${publish_user}@${SERVERS} "cd ${version_path} && tar xf $filename"
ssh ${publish_user}@${SERVERS} "cd ${version_path} && gulp build"
ssh ${publish_user}@${SERVERS} "cd /srv/http/scripts && sh sync_consolev3.sh ${project_name} ${server_group}"
