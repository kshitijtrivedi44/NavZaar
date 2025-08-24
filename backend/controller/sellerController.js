const SellProduct = require("../models/sellProductModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const cloudinary = require("cloudinary");

// Create product 
exports.createSellProduct = catchAsyncErrors(async (req, res, next) => {
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

        // Create the product
        const product = await SellProduct.create(req.body);

        // Return the created product
        res.status(201).json({
            success: true,
            product,
        });
    } catch (error) {
        return next(new ErrorHandler(error.message || "Internal Server Error", 500));
    }
});
