import mongoose from "mongoose";

//branch schema

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  address: { type: String },
  deliveryPartners: [
    { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryPartner" },
  ],
});

const Branch = mongoose.model("Branch", branchSchema);

export default Branch;
