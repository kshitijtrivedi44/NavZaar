const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Apifeatures = require("../utils/apifeatures");
const cloudinary = require("cloudinary")


// Create product -- admin
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
    try {
        let images = [];

        if (typeof req.body.images === "string") {
            images.push(req.body.images);
        } else if (Array.isArray(req.body.images)) {
            images = req.body.images;
        } else {
            return next(new ErrorHandler("Invalid images data", 400));
        }

        const imagesLink = [];

        // Upload images to cloudinary
        for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: "products",
            });

            imagesLink.push({
                public_id: result.public_id,
                url: result.secure_url,
            });
        }

        // Convert isVerified to boolean (check if it is a string and convert it)
        req.body.isVerified = req.body.isVerified === "true";

        req.body.images = imagesLink;
        req.body.user = req.user.id;
        req.body.isVerified = req.body.isVerified || false; // Default to false if not provided
        req.body.isBulk = req.body.isBulk || false; // Default to false if not provided

        // Create the product
        const product = await Product.create(req.body);

        // Return the created product
        res.status(201).json({
            success: true,
            product,
        });
    } catch (error) {
        return next(new ErrorHandler(error.message || "Internal Server Error", 500));
    }
});

// Get all products without filtering or pagination
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
    const products = await Product.find(); // Fetch all products

    res.status(200).json({
        success: true,
        products, // Return all products
        productCount: products.length, // Total count
    });
});

// GET ALL PDT -- ADMIN
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
    const products = await Product.find()

    res.status(200).json({
        success: true,
        products
    });
});





// Get single product detail

exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404))
    }

    res.status(200).json({
        success: true,
        product
    });
})


// Update product -- admin

exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
    let product = await Product.findById(req.params.id);
  
    if (!product) {
      return next(new ErrorHander("Product not found", 404));
    }
  
    // Images Start Here
    let images = [];
  
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }
  
    if (images !== undefined) {
      // Deleting Images From Cloudinary
      for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
      }
  
      const imagesLinks = [];
  
      for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
          folder: "products",
        });
  
        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
  
      req.body.images = imagesLinks;
    }
  
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
  
    res.status(200).json({
      success: true,
      product,
    });
  });
  


//Delete product -- admin

exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id)

    if (!product) {
        return next(new ErrorHandler("Product not found", 404))
    }

    // Deleting images from  couldinary
    for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id)

    }

    await product.deleteOne();

    res.status(200).json({
        success: true,
        message: "Pdt deleted successfully"
    })
})



// Create or Update Review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {

    const { rating, comment, productId } = req.body

    const review = {
        user: req.user.id,
        name: req.user.name,
        rating: Number(rating),
        comment
    }

    const product = await Product.findById(productId)

    const isReviewed = product.reviews.find((rev) => rev.user.toString() === req.user._id.toString())

    if (isReviewed) {
        product.reviews.forEach(rev => {
            if (rev.user.toString() === req.user._id.toString()) {

                rev.rating = rating,
                    rev.comment = comment
            }
        })

    } else {
        product.reviews.push(review)
        product.numOfReviews = product.reviews.length
    }

    let avg = 0;
    product.reviews.forEach(rev => {
        avg += rev.rating
    })

    if(product.reviews.length === 0){
        product.ratings = 0
    }else{
        product.ratings = avg / product.reviews.length;
    }

    await product.save({ validateBeforeSave: false })

    res.status(200).json({
        success: true
    })

})



// Get reviews of a product
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.id)

    if (!product) {
        return next(new ErrorHandler("Product not found", 404))
    }

    res.status(200).json({
        success: true,
        reviews: product.reviews
    })
})


//Delete a review
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
    const { id, productId } = req.query; // `id` here refers to the review's `_id`, not the user's id.

    const product = await Product.findById(productId);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // Filter out the review to be deleted
    const reviews = product.reviews.filter((rev) => rev._id.toString() !== id);

    // Recalculate the average rating
    let avg = 0;
    reviews.forEach((rev) => {
        avg += rev.rating;
    });

    const ratings = reviews.length > 0 ? avg / reviews.length : 0;
    const numOfReviews = reviews.length;

    // Update the product with the new reviews array
    await Product.findByIdAndUpdate(
        productId,
        {
            reviews,
            ratings,
            numOfReviews,
        },
        {
            new: true,
            runValidators: true,
            useFindAndModify: false,
        }
    );

    res.status(200).json({
        success: true,
        message: "Review deleted successfully",
    });
});
