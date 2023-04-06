const { ClientRequest } = require('http');
//функция для добавления клиента в clients
function addclient(socket, id, name){
    console.log("new client added");
    //console.log(clients);
    let ex = {//ex = exist
        is: false,
        id: undefined
    };
    let count;
    for(let i = 0; i < clients.length; i++){
        if(clients[i].name == name){//если есть клиент с таким именем то
            ex.id = i;
            ex.is = true;
            break;
        }
    }
    //если клиент с таким именем есть то заменяй
    if(ex.is) clients.splice(ex.id, 1, {socket:socket, id:id, name:name});
    else clients.push({socket:socket, id:id, name:name});//если нет то просто вставляй в конец
    //console.log(clients);
    //console.log("after");
}
const express = require('express'),
    //создание приложения
    app = express(),
    //подключение http
    http = require('http').createServer(app),
    //подключение вебсокетов
    io = require('socket.io')(http)
    //io.emit - для всех подключенных
    //socket.broadcast.emit - для всех игнорируя отправителя
    //socket.emit или socket.send - для отправителя(этого же socket, но клиента) 
    //модуль бд
    sqlite3 = require('sqlite3').verbose();
//подключение к бд
const db = new sqlite3.Database('main.db');
const host = '127.0.0.1';
const port = '3000';

let messages = [];
let clients = [];
// при соединении клиента с сервером делай callbackfunction
io.on('connection', (socket) => {
    //clients.push(socket.id)
    console.log("User connected")
    //console.log("сообщение о новом клиенте");
    //socket.broadcast.emit("new users", clients)
    //console.log(clients)
    socket.on("auth", (data) => {
        // console.log("аутентификация")
        // for (let key in rows) {
        //     console.log( key + " : " + rows[key]); 
        // }
        console.log("аутентификация")
        //получаем сообщения из общего чата из бд
        /*let messages = [];
        let get_mes = "SELECT * FROM all_mes";
        db.all(get_mes, (err, rows) => {
            rows.forEach(row => messages.push(row));
        }); 
        socket.emit("restore message", messages);*/
        let select_user = 'SELECT * FROM users WHERE login=\''+data.login+'\' AND passw=\''+data.password+'\'';
        let add_user = 'INSERT INTO users (login, passw, online) VALUES(\''+data.login+'\',\''+data.password+'\','+1+')';
        //делай запрос к бд
        db.get(select_user, [], (err, rows) => {
            //console.log(rows);
            if (err) {
              socket.emit("auth", {success: false, result: "Произошла ошибка("+err+"). Перезагрузите страницу и попробуйте еще раз."});
              console.log(err);
            }else{
                if(rows == undefined){
                    //таких пользователей нет, значит записываем их в бд и возвращаем ответ типа 'добавлен новый ползователь'
                    db.run(add_user);
                    let row = db.get(select_user, [], (err, row) => {return row;});
                    //if(!clients.includes({socket:socket.id, id:rows.id, name:rows.login})){
                    //clients.push({socket:socket.id, id:row.id, name:row.login})}
                    addclient(socket.id, row.id, row.login);
                    console.log(clients);
                    socket.emit("auth", {success: true, result: "Новый пользователь был создан"});
                }else {
                    //такой пользователь есть => меняем ему значение в поле online на 1
                    db.run("UPDATE users SET online = 1 WHERE id = "+rows.id);
                    //сохраняем его id в clients
                    //clients.push({socket:socket.id, id:rows.id, name:rows.login})}
                    addclient(socket.id, rows.id, rows.login);
                    console.log(clients);
                    //отправляем ответ пользователю 
                    socket.emit("auth", {success: true, result: "Вы успешно вошли в аккаунт"});
                }
                console.log("сообщение о новом клиенте");
                io.emit("new users", clients);
                //console.log(clients);
            }
            //восстанавливаем сообщения для общего чата
            //socket.emit("restore message", messages);
        });
        io.emit("new users", clients);
    });
    //восстанавливаем сообщения для всех чатов
    socket.on("change mes", (data) => {
        console.log("изменение сообщений");
        for (let key in data) {
             console.log( key + " : " + data[key]); 
        }
        //id в бд для отправителя(from) и получателя(to)
        let to;
        clients.forEach(client => {
            if(client.socket == data.to){
            to = client.id;
        }});
        let from;
        clients.forEach(client => {if(client.socket == socket.id){
            from = client.id;
        }});
        //let to = clients.find(client => client.socket == data.to).id;
        //let from = clients.find(client => client.socket == socket.id).id; 
        messages = [];
        let get_mes = ``;
        //получаю список пользователей
        let users = []
        db.all("SELECT * FROM users", (err, rows) => {if(err) console.log(err); else users = rows})
        if(data.to == "all") get_mes = "SELECT * FROM all_mes";
        else get_mes = `SELECT * FROM users_mes WHERE (from_id == ${from} AND to_id == ${to}) or (to_id ==${from} AND  from_id == ${to})`;
        //let cnt = 0;
        db.all(get_mes, (err, rows) => {
            if(err) console.log(err)
            else{
                rows.forEach((row, index, array) => {
                    //console.log(row);
                    //console.log(messages.length);
                    //users.forEach(u => console.log(u))
                    let source;
                    //console.log(row.user_idid)
                    if(data.to == "all") users.forEach(u => {if(u.id == row.user_id)source=u.login});
                    else users.forEach(u => {if(u.id == row.from_id)source=u.login});
                    //console.log(source);
                    messages.push({time:row.time, mes:row.mes, source:source});
                    //console.log(messages.length);
                    //console.log(cnt + " : "+ messages[cnt].mes);
                    //cnt++;
                });
                //for(let i=0; i<=cnt; i++) console.log(messages[i])
                socket.emit("restore messages", {to:data.to, messages:messages});
            }
        }); 
        /*console.log("len = ", messages.length);
        for(let i=0; i<=cnt; i++) console.log(messages[i])*/
        
    })
    socket.on("message", (data) => {
        console.log("сообщение");
        for (let key in data) {
            console.log( key + " : " + data[key]); 
        }
        //кому(id в бд)
        let user_to;
        if(data.destination != "all"){
            clients.forEach(client => {if(client.socket == data.destination){
                user_to = client.id;
            }});
        }else user_to = "all";
        //let user_to = clients.find(client => client.socket == data.destination).id;
        //от кого
        let user_from;
        clients.forEach(client => {if(client.socket == socket.id){
            //id
            user_from = client.id;
            //имя в бд
            data.source = client.name;
        }});
        console.log(user_to + "    " + user_from);
        //let user_from = clients.find(client => client.socket == socket.id).id;
        //само сообщение
        let message = data.mes;
        //время отправки сообщения 
        let time = data.time;
        //если сообщение в общий чат, то
        let sql = ``;
        if(user_to == "all"){
            sql = `INSERT INTO all_mes (user_id, mes, time) VALUES('${user_from}', '${message}', '${time}')`;
            /*clients.forEach(client => {if(client.id == user_from){
                data.source = client.name;
            }});*/
            console.log(data.source);
            //data.source = user_from;
            io.send(data);
        //если сообщение конкретному пользователю, то     
        }else{
            sql = `INSERT INTO users_mes (from_id, to_id, mes, time) VALUES('${user_from}', '${user_to}', '${message}', '${time}')`;
            /*clients.forEach(client => {if(client.id == user_from){
                data.source = client.name;
            }});*/
            console.log(data.destination);
            data.from = socket.id;
            socket.to(data.destination).emit("message", data);
            socket.send(data);//отправка отправителю(чтобы у него отобразилось) 
        }
        //console.log(sql)
        db.run(sql, (err) => console.log(err));
    });
    //при закрытии соединения с клиентом
    socket.on("disconnect", () => {
        console.log("отключение человека")
        console.log(clients);
        //сообщай всем юзерам, что клиент ушел
        io.emit("remove user", socket.id)
        //меняй его поле online в БД на 0
        let delid;
        clients.forEach(client => { if(client.socket == socket.id)delid = client.id});
        let sql = `UPDATE users SET online = 0 WHERE id = ${delid}`;
        //удаляй его из списка клиентов
        let count = 0;
        clients.forEach(client => {
            if(socket.id == client.socket) clients.splice(count, 1);
            count++;
        });
        console.log(clients);
        socket.disconnect(true);
    })
});

app.use(express.static(__dirname))

//при запросе "/" отправляй строку
app.get('/', function(req, res) {
    res.send(fs.read('index.html'));
});

//сервер "слушает" новые события на 3000 порту 
http.listen(port, host, () => {
  console.log(`Server listens http://${host}:${port}`);
})
