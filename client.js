//функция проверки строки на пустоту 
function isEmpty(str) {
  for (var i = 0; i < str.length; i++)
      if (" " != str.charAt(i))
          return false;
      return true;
}
//функция проверки полей формы на заполненность
function checkform(f) {
  var errMSG = ""; 
  for (var i = 0; i<f.elements.length; i++) 
    if(f.elements[i].nodeName == "INPUT" && f.elements[i].type === "text"){    
        if (isEmpty(f.elements[i].value))  
            errMSG += "  " + f.elements[i].name; 
    }
  if ("" != errMSG) {
    return errMSG;
  }else
    return "";
}
function addLeadingZero(d) {
  return (d < 10) ? '0' + d : d;
}
//ф-ция для получения НОРМАЛЬНОГО времени(копипаста с https://www.youtube.com/watch?v=TdurrvcOHgQ)
function getUserTime(t = new Date()) {
  let Y = t.getFullYear();
  let M = addLeadingZero(t.getMonth() + 1);
  // if (M < 10) M = '0' + M;
  let D = addLeadingZero(t.getDate());
  //let d = days[t.getDay()];
  let h = addLeadingZero(t.getHours());
  let m = addLeadingZero(t.getMinutes());

  //console.log(Y, M, D, h, m);
  return `${Y}-${M}-${D} ${h}:${m}`
}
//прокрутка блока сообщений 
let scrollToEnd = ( elem ) => {
  let el = document.querySelector(elem);
      el.scrollTop = el.scrollHeight;
}
//скрытие чата для неавторизованных пользователей
// или скрытие формы авторизации и открытие чата для авторизованных
let form = document.getElementById("auth");
let chat = document.getElementById("chat");
//console.log(typeof(form.classList));
if(form.classList.contains("unauthorized")){
 // console.log("sheesh");
  chat.classList.add("hid");
  form.classList.remove("hid");
}else{
  chat.classList.remove("hid");
  form.classList.add("hid");
}
let socket = io("ws://127.0.0.1:3000/")
//элементы формы авторизации
let login = document.getElementById("login");
let password = document.getElementById("password");
let authsubmit = document.getElementById("send_auth");
//элементы формы отправки сообщений
let messageInput =  document.getElementById("mes");
let messubmit = document.getElementById("send_message");
let mesblock = document.getElementById("messages");
//коробка для списка пользователей
let users_list = document.getElementById("users");
//куда отправлять(к какому пользователю(по умолчанию all))
let destination = document.querySelector("li.using").id;
let ul = document.querySelector("ul.users_list");
//список всех пользователей
let users = document.querySelectorAll("li.usr");
let nik;
//let users_list = document.querySelectorAll("li").textContent;
//при подключении делай это
socket.on('connection', function (socket) {
  //console.log(socket.id);
  //нужно запрашивать данные для нужного чата(общего по умолчанию) и список всех активных пользователей
  console.log("подключился к серверу");
});
//добавление нового пользователя в список
socket.on("new users", (data) => {
 // console.log(socket.id + " idshnik");
  console.log("новые пользователи");
 // console.log(users_list);
  //формируем массив имеющихся на сайте пользователей
  let list = [];
  users.forEach(user => {
    list.push(user.textContent);
  });
  //console.log(list);
  //если полученный массив клиентов не пустой
  if(!(data.length == 0)){
    //для каждого клиента
    data.forEach(user => {
      //console.log(user);
      //если клиента нет в списке людей на сайте то
      if(!list.includes(user.name) && user.socket != socket.id && user.name != nik){
        //console.log(user);
        //добаляй его на сайт
        let us = document.createElement("li");//[id="+user.socket+"]")
        us.id = user.socket;
        us.className = "usr";
        us.textContent = user.name;
        ul.appendChild(us);
      }
    });
  }
  users = document.querySelectorAll("li.usr");
});
//восстанавливаем сообщения для любого чата(первоначально для общего)
socket.on("restore messages", (data) => {
  let messages = data.messages;
  let to = data.to;
  console.log("восстановление сообщений");
 // console.log(messages);
  if(to = "all"){
    messages.forEach((row) => {
      //console.log("shit");
      let mes = document.createElement('div');
      mes.className = 'message';
      //console.log(row);
      mes.innerHTML = `<i>${row.time}</i><b> ${row.source}</b> : ${row.mes}`;
      mesblock.appendChild(mes);
    });
  }else if(destination == to){
    messages.forEach((row) => {
      let mes = document.createElement('div');
      mes.className = 'message';
      //console.log("shit");
      //console.log(row);
      mes.innerHTML = `<i>${row.time}</i><b>${row.source}</b> : ${row.mes}`;
      mesblock.appendChild(mes);
    });
  }
  scrollToEnd("#messages")
});
//ОБРАБОТКА КНОПКИ АВТОРИЗАЦИИ 
authsubmit.onclick = (event) => {
  console.log("auth submited");
  event.preventDefault();
  //Проверка введенных данных 
  let error = checkform(form);
  if(error != ""){
    alert("Введите данные в поля" + error)
  }else{
    nik = login.value;
    //console.log("all right")
    //если данные введены отправляй их на сервер
    socket.emit("auth", {login: login.value, password: password.value})
  }
};
//обработка сообщения об аутентификации с сервера
socket.on("auth", (data) => {
    //если авторизация успешна, то
    if(data.success){
      alert(data.result);
      chat.classList.remove("hid");
      form.classList.remove("unauthorized");
      form.classList.add("hid");
      socket.emit("change mes", {to:destination});
    }else alert(data.result);
});
//при нажатии enter в поле ввода сообщения 
messageInput.addEventListener('keyup', function(e) {
  if (e.key === "Enter") {
    //вызывай функцию 
    if(this.value != ""){ 
      sendmes(this.value);
      this.value = "";  
    }
  }
});
//или при нажатии на кнопку отправки сообщения
messubmit.onclick = (e) => {
  //вызывай функцию 
  if(messageInput.value != ""){ 
    sendmes(messageInput.value);
    messageInput.value = "";
  }
}
//сообщение от этого пользователя
function sendmes(message){
  //user_id - есть на сервере, message - передаем, time - передаем
  socket.emit("message", {mes:message, destination:destination, time:getUserTime()});
}
//сообщение от кого-то
socket.on("message", (data) => {
  console.log("сообщение от сервера")
  for (let key in data) {
    console.log( key + " : " + data[key]); 
  }
  console.log(data.destination + "  - to");
  console.log(data.from + " - from");
  console.log(destination + " - destination");
  //если открыт общий чат(using в классе у элемента li с id который лежит в data.destination)
  //то просто записывай сообщения в div для message
  //если получатель на сайте равен получателю полученому от сервера
  if((data.destination === destination) || (destination  === data.from)) { //|| (data.destination == socket.id)){
    //отправляй сообщение
    //console.log("записываем сообщение");
    let mes = document.createElement('div');
    mes.className = 'message';
    mes.innerHTML = `<i>${data.time} </i><b> ${data.source} </b> : ${data.mes}`;
    mesblock.appendChild(mes);//"<div class='message'><i>" + data.time +" </i><b> "+data.source+"</b>:"+data.mes+"</div>");
    scrollToEnd('#messages');
  }else{
    //помечать пользователей которым пришло сообщение в списке пользователей чем-то и убирать метку при открытии этого чата
    //document.getElementById(data.destination).classList.add("noted");
    if(data.destination != "all"){
    let elem = document.getElementById(data.from);
    if(typeof elem !== null && elem !== 'undefined' ) {
      document.getElementById(data.from).classList.add("noted");
    }
    }else document.getElementById("all").classList.add("noted");
    console.log("не тот чат открыт");
  } 
});

//обработка смены "комнаты"
//используя делегирование
ul.addEventListener('click', (event) => {
  console.log("клик");
  let user = event.target;
  if(user.tagName != "LI") console.log("не то");
  else{
    if(user.classList.contains("noted")) user.classList.remove("noted"); 
    console.log("нужный клик");
    //убирай using у эл-та, который был до этого
    let using = document.querySelector(".using");
    using.classList.remove("using");
    //добавляй тому на которого нажали
    user.classList.add("using");
    user.classList.add("usr");
    //запоминай его socket id
    console.log("old dest -" + destination);
    destination = user.id;
    console.log("new dest - " + destination);
    //убирай все сообщения со страницы
    mesblock.innerHTML = "";
    //запрашивай сообщения для этого клиента
    socket.emit("change mes", {to:destination});
  }
})

//при закрытии соединения:
socket.on("remove user", (id) => {
  let usr = document.getElementById(id);
  console.log(id + " с именем " + usr.innerText + " отключился");
  if(typeof usr !== null && usr !== 'undefined' ) {
      document.getElementById(id).remove();
  }
  //usr.remove();
  //if(id == socket.id) window.close();
});

socket.on("disconnect", reason => alert("Отключился. " + reason));