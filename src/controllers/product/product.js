import { Product } from "../../models/index.js";

export const getProductsByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const products = await Product.find({ category: categoryId })
      .select("-category")
      .exec();

    return res.send(products);
  } catch (error) {
    return res.status(500).send({ message: "Something went wrong", error });
  }
};
