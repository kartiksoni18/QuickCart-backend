import {
  Branch,
  Customer,
  DeliveryPartner,
  Order,
} from "../../models/index.js";

export const createOrder = async (req, res) => {
  try {
    const { userId } = req.user;
    const { items, branch, totalPrice } = req.body;

    const customerData = await Customer.findById(userId);
    const branchData = await Branch.findById(branch);

    if (!customerData) {
      return res.status(404).send({ message: "Customer not found" });
    }

    if (!branchData) {
      return res.status(404).send({ message: "Branch not found" });
    }

    const newOrder = new Order({
      customer: userId,
      items: items.map((item) => ({
        id: item.id,
        item: item.item,
        count: item.count,
      })),
      branch,
      totalPrice,
      deliveryLocation: {
        latitude: customerData.liveLocation.latitude,
        longitude: customerData.liveLocation.longitude,
        address: customerData.address || "No address available",
      },
      pickupLocation: {
        latitude: branchData.location.latitude,
        longitude: branchData.location.longitude,
        address: branchData.address || "No address available",
      },
    });

    const savedOrder = await newOrder.save();
    return res
      .status(201)
      .send({ message: "Order created successfully", savedOrder });
  } catch (error) {
    return res.status(500).send({ message: "Failed to create order", error });
  }
};

export const confirmOrder = async (req, res) => {
  try {
    const { userId } = req.user;
    const { orderId } = req.params;
    const { deliveryPersonLocation } = req.body;

    const deliveryPerson = await DeliveryPartner.findById(userId);

    if (!deliveryPerson) {
      return res.status(404).send({ message: "Delivery Person not found" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    if (order.status !== "available") {
      return res.status(400).send({ message: "Order not available" });
    }

    order.status = "confirmed";

    order.deliveryPartner = userId;

    order.deliveryPersonLocation = {
      latitude: deliveryPersonLocation?.latitude,
      longitude: deliveryPersonLocation?.longitude,
      address: deliveryPersonLocation?.address || "",
    };

    // integrating socket
    req.server.io.to(orderId).emit("orderConfirmed", order);

    await order.save();

    return res.send({ message: "Order confirmed successfully", order });
  } catch (error) {}
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { userId } = req.user;
    const { orderId } = req.params;
    const { status, deliveryPersonLocation } = req.body;

    const deliveryPerson = await DeliveryPartner.findById(userId);

    if (!deliveryPerson) {
      return res.status(404).send({ message: "Delivery Person not found" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    if (["cancelled", "delivered"].includes(order.status)) {
      return res
        .status(400)
        .send({ message: "Order status cannot be updated" });
    }

    if (order.deliveryPartner.toString() !== userId) {
      //any other delivery partner cannot update your order status (only who confirmed can update)
      return res.status(403).send({ message: "Unauthorized" });
    }

    order.status = status;

    order.deliveryPersonLocation = deliveryPersonLocation;

    await order.save();

    // integrating socket
    req.server.io.to(orderId).emit("liveTrackingUpdates", order);

    return res.send({ message: "Order status updated successfully", order });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Failed to update order status", error });
  }
};

export const getOrders = async (req, res) => {
  try {
    const { status, customerId, deliveryPartnerId, branchId } = req.params;

    let query = {};

    if (status) {
      query.status = status;
    }
    if (customerId) {
      query.customer = customerId;
    }

    if (deliveryPartnerId && branchId) {
      query.deliveryPartner = deliveryPartnerId;
      query.branch = branchId;
    }

    const orders = await Order.find(query).populate(
      "customer branch items.item deliveryPartner"
    );

    return res.send(orders);
  } catch (error) {
    return res.status(500).send({ message: "Failed to retrieve order", error });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).send({ message: "No order found" });
    }

    return res.send(order);
  } catch (error) {
    return res.status(500).send({ message: "Failed to retrieve order", error });
  }
};
