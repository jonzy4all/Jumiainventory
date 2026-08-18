const Product = require("../Models/products"); // Import the Product model
const sendEmail = require("../Middleware/Emailsender"); // Import the email sender middleware

// Create a new product
// exports.createProduct = async (req, res) => {
//   try {
//     // Check if all required fields are provided
//     if (!req.body.name || !req.body.description || !req.body.price || !req.body.category || !req.body.size || req.body.quantity === undefined) {
//       return res.status(400).json({
//         message: "Please provide all required fields",
//       });
//     }
//     const {
//       name,
//       description,
//       price,
//       category,
//       inStock,
//       size,
//       quantity,
//     } = req.body;

//     const newProduct = new Product({
//       name,
//       description,
//       price,
//       category,
//       inStock,
//       size,
//       quantity,
//     });

//     await newProduct.save();

//     res.status(201).json({
//       message: "Product created successfully",
//       product: newProduct,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error creating product",
//       error: error.message,
//     });
//   }
// };

// create a product with image upload
exports.createProductwithimage = async (req, res) => {
  try {
    const {
      name,
      size,
      description,
      price,
      category,
      inStock,
      quantity,
      image,
    } = req.body;

    if (
      !name ||
      !size ||
      !description ||
      price === undefined ||
      !category ||
      quantity === undefined
    ) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    // if (!req.file) {
    //   return res.status(400).json({
    //     message: "Please upload an image",
    //   });
    // }

    const product = new Product({
      name,
      size,
      description,
      price,
      category,
      inStock,
      quantity,
       image: req.file ? req.file.path : null,
    });

    await product.save();

    // send email notification about the new product
    const emailSubject = "New Product Created";
    const emailText = `A new product has been created.
    "${name}",
    "${size}",
    "${description}",
    "${price}",
    "${category}",
    "${quantity}"`;
    await sendEmail("jonzy4all@yahoo.com", emailSubject, emailText);


    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating product",
      error: error.message,
    });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating product",
      error: error.message,
    });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();

    res.status(200).json({
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// Get a product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({product,});
  } catch (error) {
    res.status(500).json({
      message: "Error fetching product",
      error: error.message,
    });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting product",
      error: error.message,
    });
  }
};