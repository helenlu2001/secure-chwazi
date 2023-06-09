import type http from "http";
import { Server, Socket } from "socket.io";
import User from "../shared/User";
let io: Server;

const userToSocketMap: Map<string, Socket> = new Map<string, Socket>(); // maps user ID to socket object
const chwaziToUserMap: Map<string, string[]> = new Map<string, string[]>(); // maps user ID to chwazi ID
const socketToUserMap: Map<string, User> = new Map<string, User>(); // maps socket ID to user object

export const getSocketFromUserID = (userid: string) => userToSocketMap.get(userid);
export const getUserFromSocketID = (socketid: string) => socketToUserMap.get(socketid);
export const getSocketFromSocketID = (socketid: string) => io.sockets.sockets.get(socketid);

export const addUser = (user: User, socket: Socket): void => {
  const oldSocket = userToSocketMap.get(user._id);
  if (oldSocket && oldSocket.id !== socket.id) {
    // there was an old tab open for this user, force it to disconnect
    // TODO(weblab student): is this the behavior you want?
    oldSocket.disconnect();
    socketToUserMap.delete(oldSocket.id);
  }
  userToSocketMap.set(user._id, socket);
  socketToUserMap.set(socket.id, user);
};

export const removeUser = (user: User, socket: Socket): void => {
  if (user) userToSocketMap.delete(user._id);
  socketToUserMap.delete(socket.id);
};

export const init = (server: http.Server): void => {
  io = new Server(server);
  io.on("connection", (socket) => {
    console.log(`socket has connected ${socket.id}`);
    socket.on("disconnect", () => {
      console.log(`socket has disconnected ${socket.id}`);
      const user = getUserFromSocketID(socket.id);
      if (user !== undefined) removeUser(user, socket);
    });
    socket.on("create", (req: {cid: string, uid: string}) =>{
      userToSocketMap[req.uid] = socket
      
      let chwazi_id = ''
      for(let i = 0; i < 6; i++) {
        chwazi_id += Math.floor(Math.random() * 10).toString();
      }

      chwaziToUserMap.set(chwazi_id, [req.uid])
      console.log("hello, creation request", req)
      console.log("generated chwazi id is", chwazi_id)

      socket.emit("create-result", {chwazi: chwazi_id, lobby: {users: chwaziToUserMap.get(chwazi_id)}});
    })

    socket.on("join", (req) => {
      userToSocketMap[req.uid] = socket

      console.log('chwaziToUserMap', chwaziToUserMap)
      let valid = chwaziToUserMap.has(req.cid)
      if(valid) {
        chwaziToUserMap.get(req.cid)?.push(req.uid) 
        chwaziToUserMap.get(req.cid)?.forEach((uid) => {
          userToSocketMap[uid].emit('lobby data', {lobby: {users: chwaziToUserMap.get(req.cid)}})
        })
      }

      console.log("hello, join request", req, valid)

      socket.emit("join-result", {success: valid, lobby: {users: chwaziToUserMap.get(req.cid)}});
    })

    socket.on("start", (req) => {
      chwaziToUserMap.get(req.cid)?.forEach((uid) => {
        userToSocketMap[uid].emit('chwazi started')
      })
    })

    
  });
};

export const getIo = () => io;

export default {
  getIo,
  init,
  removeUser,
  addUser,
  getSocketFromSocketID,
  getUserFromSocketID,
  getSocketFromUserID,
};
