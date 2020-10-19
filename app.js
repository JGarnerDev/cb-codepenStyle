const createEle = (type) => {
  return document.createElement(type);
};
const getEleById = (id) => {
  return document.getElementById(id);
};
const getEleByClass = (className) => {
  return document.getElementsByClassName(className);
};
const addClickListener = (ele, fn) => {
  ele.addEventListener("click", (e) => {
    e.preventDefault();
    fn();
  });
};
const formatObjectToLI = (className, object) => {
  let li = createEle("li");
  li.setAttribute("class", className);
  Object.keys(object).forEach((key) => {
    let text = createEle("p");
    text.innerText = object[key];
    li.appendChild(text);
  });
  return li;
};
const getChildUl = (containerClass) => {
  return getEleByClass(containerClass)[0].getElementsByTagName("ul")[0];
};
const createAndReplaceUL = (targetUlParentClass, data) => {
  let newList = createEle("ul");
  let oldList = getChildUl(targetUlParentClass);
  let className = oldList.className;
  newList.setAttribute("class", className);
  let liClassName = className.slice(0, -1);
  data.forEach((ele, i) => {
    let li = formatObjectToLI(liClassName, ele);
    li.setAttribute("key", i);
    newList.appendChild(li);
  });
  getEleByClass(targetUlParentClass)[0].replaceChild(newList, oldList);
};
class User {
  constructor({ id, name, currentRoom }) {
    this.id = id;
    this.name = name;
    this.currentRoom = currentRoom;
  }
}
let user;
let users;
const serverURL = "http://127.0.0.1:3001/";
const socket = io.connect(serverURL);
const loginInput = getEleById("login-input"),
  loginButton = getEleById("login-button"),
  roomChangeButton = getEleById("roomChange"),
  chatHeader = getEleById("chat-header"),
  messageInput = getEleById("chat-input"),
  sendMessageButton = getEleById("chat-submit");
[loginButton, sendMessageButton, roomChangeButton].forEach((button, i) => {
  const fn = [
    () => {
      const name = loginInput.value;
      socket.emit("login", name);
    },
    () => {
      socket.emit("send", {
        user: user.name,
        room: user.currentRoom,
        message: messageInput.value,
      });
    },
    () => {
      const destination = "Other ROOM";
      socket.emit("changeRoom", { user, destination });
      user.currentRoom = destination;
    },
  ];
  addClickListener(button, fn[i]);
});
socket.on("USER_LOGIN", (data) => {
  user = new User(data);
});
socket.on("allUsers", (data) => {
  createAndReplaceUL("all-users-list", data);
});
socket.on("rooms", (data) => {
  if (typeof data[0] === "string") {
    data = data[0];
    data = [{ data }];
  }
  createAndReplaceUL("rooms-list", data);
});
socket.on("roomUsers", (data) => {
  createAndReplaceUL("room-users-list", data);
});
socket.on("roomMessages", (data) => {
  createAndReplaceUL("chat-messages-list", data);
});
