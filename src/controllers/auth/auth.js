import { Customer, DeliveryPartner } from "../../models/index.js";
import jwt from "jsonwebtoken";

//controllers - these tell what are the function that need to be executed on any particular api call
const generateTokens = (user) => {
  try {
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.REFRESH_TOKEN_SECRET
    );

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("error", error);
  }
};

export const loginCustomer = async (req, res) => {
  try {
    const { phone } = req.body;

    //checking in database whether this phone exists or not
    const customer = await Customer.findOne({ phone });

    console.log("customer", customer);

    if (!customer) {
      customer = new Customer({ phone, role: "Customer" });
    }

    await customer.save();

    const { accessToken, refreshToken } = generateTokens(customer);

    return res.send({
      message: customer
        ? "Login successfully"
        : "Customer created successfully",
      accessToken,
      refreshToken,
      customer,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).send({ message: "Something went wrong", error });
  }
};

export const loginDeliveryPartner = async (req, res) => {
  try {
    const { email, password } = req.body;

    //checking in database whether this phone exists or not
    const deliveryPartner = await DeliveryPartner.findOne({ email });

    if (!deliveryPartner) {
      return res.status(404).send({ message: "Delivery Partner not found" });
    }

    const isMatch = password === deliveryPartner.password;

    if (!isMatch) {
      return res.status(400).send({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(deliveryPartner);

    return res.send({
      message: "Login successful",
      accessToken,
      refreshToken,
      deliveryPartner,
    });
  } catch (error) {
    console.log("error", error);
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).send({ message: "Refresh Token required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    let user;

    if (decoded.role === "Customer") {
      user = await Customer.findById(decoded.userId);
    } else if (decoded.role === "DeliveryPartner") {
      user = await Customer.findById(decoded.userId);
    } else {
      return res.status(403).send({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(403).send({ message: "Invalid Refresh token" });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    return res.send({
      message: "Token refreshed successfully",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(403).send({ message: "Invalid refresh token", error });
  }
};

export const fetchUser = async (req, res) => {
  try {
    const { userId, role } = req.user;

    let user;

    if (role === "Customer") {
      user = await Customer.findById(userId);
    } else if (role === "DeliveryPartner") {
      user = await Customer.findById(userId);
    } else {
      return res.status(403).send({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    return res.send({
      message: "User found successfully",
      user,
    });
  } catch (error) {
    return res.status(404).send({ message: "Something went wrong", error });
  }
};
