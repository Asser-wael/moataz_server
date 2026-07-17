import { Server } from "socket.io";

let io;
let onlineUsers = 0;

const emitOnlineUsers = () => {
  io.emit("onlineUsers", onlineUsers);
};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    onlineUsers++;
    emitOnlineUsers();

    socket.on("join-order", (orderId) => {
      socket.join(`order-${orderId}`);
    });

    socket.on("joinAdminRoom", () => {
      socket.join("admin");
    });

    socket.on("disconnect", () => {
      onlineUsers--;
      emitOnlineUsers();
    });
  });

  return io;
};

export const getIO = () => io;