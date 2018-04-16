var express = require('express');
var app = express();
var http = require('http').Server(app);
// 思考：socket.io作为一个函数，当前http作为参数传入生成一个io对象？
// io-server
var io = require("socket.io")(http);

var users = []; // 储存登录用户
var usersInfo = [];  // 存储用户姓名和头像

// 路由为/默认www静态文件夹
app.use('/', express.static(__dirname + '/www'));
 
// 每个连接的用户都有专有的socket
/* 
   io.emit(foo); //会触发所有用户的foo事件
   socket.emit(foo); //只触发当前用户的foo事件
   socket.broadcast.emit(foo); //触发除了当前用户的其他用户的foo事件
*/
io.on('connection', (socket)=> {
    // 渲染在线人员
    io.emit('disUser', usersInfo);

    // 登录，检测用户名
    socket.on('login', (user)=> {
        if(users.indexOf(user.name) > -1) { 
            socket.emit('loginError');
        } else {
            users.push(user.name);
            usersInfo.push(user);

            socket.emit('loginSuc');
            socket.nickname = user.name;
            io.emit('system', {
                name: user.name,
                status: '进入'
            });
            io.emit('disUser', usersInfo);
            console.log(users.length + ' user connect.');
        }
    });

    // 发送窗口抖动
    socket.on('shake', ()=> {
        socket.emit('shake', {
            name: '您'
        });
        socket.broadcast.emit('shake', {
            name: socket.nickname
        });
    });

    // 发送消息事件
    socket.on('sendMsg', (data)=> {
        var img = '';
        for(var i = 0; i < usersInfo.length; i++) {
            if(usersInfo[i].name == socket.nickname) {
                img = usersInfo[i].img;
            }
        }
        socket.broadcast.emit('receiveMsg', {
            name: socket.nickname,
            img: img,
            msg: data.msg,
            color: data.color,
            type: data.type,
            side: 'left'
        });
        socket.emit('receiveMsg', {
            name: socket.nickname,
            img: img,
            msg: data.msg,
            color: data.color,
            type: data.type,
            side: 'right'
        });
    });  

    // 断开连接时
    socket.on('disconnect', ()=> {
        var index = users.indexOf(socket.nickname); 
        if(index > -1 ) {  // 避免是undefined
            users.splice(index, 1);  // 删除用户信息
            usersInfo.splice(index, 1);  // 删除用户信息

            io.emit('system', {  // 系统通知
                name: socket.nickname,
                status: '离开'
            });
            
            io.emit('disUser', usersInfo);  // 重新渲染
            console.log('a user left.');
        }
    });
});

http.listen(3000, function() {
    console.log('listen 3000 port.');
});