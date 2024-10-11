import "dotenv/config";
import Fastify from "fastify";
import { connectDB } from "./src/config/connect.js";
import { PORT } from "./src/config/config.js";
import { admin, buildAdminRouter } from "./src/config/setup.js";
import { registerRoutes } from "./src/routes/index.js";
import fastifySocketIO from "fastify-socket.io";
const start = async () => {
  // connecting the database
  await connectDB(process.env.MONGO_URI);

  // create an instance of fastify
  const app = Fastify();

  //socket io
  app.register(fastifySocketIO, {
    cors: {
      origin: "*",
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ["websocket"],
  });

  await registerRoutes(app);
  await buildAdminRouter(app);

  app.listen({ port: PORT, host: "0.0.0.0" }, (err, addr) => {
    if (err) {
      console.log(err);
    } else {
      console.log(`Server started at port : ${PORT}${admin.options.rootPath}`);
    }
  });

  app.ready().then(() => {
    app.io.on("connection", (socket) => {
      console.log("A user connected");

      socket.on("joinRoom", (orderId) => {
        socket.join(orderId);
        console.log(`User joined room ${orderId}`);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected");
      });
    });
  });
};

start();
