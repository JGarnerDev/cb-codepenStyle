// == Utility Functions == //

/**
 * Creates and returns a new HTML element
 * @function createEle
 * @param {string} type - string of element tag
 * @returns HTML element
 */

const createEle = (type) => {
  return document.createElement(type);
};

/**
 * Returns existing element in the HTML document by id attribute
 * @function getEleById
 * @param {string} id - string of element id
 * @returns HTML element
 */

const getEleById = (id) => {
  return document.getElementById(id);
};

/**
 * Returns existing elements in the HTML document by class attribute
 * @function getEleByClass
 * @param {string} class - string of element class
 * @returns array of HTML elements
 */

const getEleByClass = (className) => {
  return document.getElementsByClassName(className);
};

/**
 * Removes default actions of element, adds a onClick event listener to element
 * @function addClickListener
 * @param {HTML element} ele - the target HTML element
 * @param {function} fn - the function to be called on click of element
 * @returns undefined
 */

const addClickListener = (ele, fn) => {
  ele.addEventListener("click", (e) => {
    e.preventDefault();
    fn();
  });
};

/**
 * Takes an object, returns an 'li' element with nested 'p' elements with the inner text of the object values
 * @function formatObjectToLI
 * @param {string} className - the class name to be given to the new list item element
 * @param {object} object - the data object, which the values thereof are to be the nested text elements of the list item
 * @returns HTML 'li' element with nested 'p' elements
 */

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

/**
 * Specialized function for this particular environment - returns the first (in this case, the only) list element from a parent node
 * @function getChildUl
 * @param {string} containerClass - the class name of the node wherein a list element is
 * @returns the first HTML 'ul' element of parent node
 */

const getChildUl = (containerClass) => {
  return getEleByClass(containerClass)[0].getElementsByTagName("ul")[0];
};

/**
 * replaces a list with a new list made with given data
 * @function createAndReplaceUL
 * @param {string} targetUlParentClass - the class name of the node wherein a list element is
 * @param {Array<Object>} data - array of objects (e.g. messages, users, rooms)
 * @returns replaces the list within the target parent node with a new list
 */

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
// ====================== //

/**
 * A model for our client user object
 * @class User
 * @param {string} id - deconstructed from data - the firebase id attributed to a new user entry
 * @param {string} name - the name derived from login input
 * @param {string} currentRoom - the value of the room that the user is emitting messages to
 * @returns new User object
 */
class User {
  constructor({ id, name, currentRoom }) {
    this.id = id;
    this.name = name;
    this.currentRoom = currentRoom;
  }
}

let user;

const serverURL = "http://127.0.0.1:3001/";

// Establishing bi-direcitonal client connection to server
const socket = io.connect(serverURL);

// Querying elements for event and property listening
const loginInput = getEleById("login-input"),
  loginButton = getEleById("login-button"),
  roomChangeButton = getEleById("roomChange"),
  chatHeader = getEleById("chat-header"),
  messageInput = getEleById("chat-input"),
  sendMessageButton = getEleById("chat-submit");

// For each of these buttons...
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
  // ...add the corresponding onClick function
  addClickListener(button, fn[i]);
});
// When the server confirms that the user is added to the db, the global user variable is assigned as a new User object with the response data
socket.on("USER_LOGIN", (data) => {
  user = new User(data);
});

// When the server has an updated list of all users currently connected, replace the list
socket.on("allUsers", (data) => {
  createAndReplaceUL("all-users-list", data);
});

// When the server has an updated list of rooms currently active, replace the list
socket.on("rooms", (data) => {
  if (typeof data[0] === "string") {
    data = data[0];
    data = [{ data }];
  }
  createAndReplaceUL("rooms-list", data);
});

// When the server has an updated list of users currently active in the occupied room, replace the list
socket.on("roomUsers", (data) => {
  createAndReplaceUL("room-users-list", data);
});

// When the server has an updated list of messages in the currently active room, replace the list
socket.on("roomMessages", (data) => {
  createAndReplaceUL("chat-messages-list", data);
});
