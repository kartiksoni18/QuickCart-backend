import {
  fetchUser,
  loginCustomer,
  loginDeliveryPartner,
  refreshToken,
} from "../controllers/auth/auth.js";
import { updateUser } from "../controllers/tracking/user.js";
import { verifyToken } from "../middlewares/auth.js";

//routes are created
// for fetching user the middleware (verfiy token) has been integrated
export const authRoutes = async (fastify, options) => {
  fastify.post("/customer/login", loginCustomer);
  fastify.post("/deliveryPartner/login", loginDeliveryPartner),
    fastify.post("/refresh-token", refreshToken),
    fastify.get("/user", { preHandler: [verifyToken] }, fetchUser);
  fastify.patch("/user", { preHandler: [verifyToken]}, updateUser );
};
