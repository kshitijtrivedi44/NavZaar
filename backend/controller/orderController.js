const Order = require("../models/orderModel")

const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

//Create new order

exports.newOrder = catchAsyncErrors(async (req,res,next)=>{
    const {shippingInfo, orderItems, paymentInfo, itemsPrice, taxPrice, shippingPrice, totalPrice} = req.body;

    const order = await Order.create({
        shippingInfo, orderItems, paymentInfo, itemsPrice, taxPrice, shippingPrice, totalPrice,
        paidAt:Date.now(),
        user: req.user._id
    })

    res.status(201).json({
        success:true,
        message:"Order created successfully",
        order
    })
})


// Get  single order
exports.getSingleOrder = catchAsyncErrors(async(req,res,next)=>{
    const order = await Order.findById(req.params.id).populate("user","name email")

    if(!order){
        return next(new ErrorHandler("Order not found with this id",404))
    }

    res.status(200).json({
        success:true,
        order
    })

})

// Get logged in user orders
exports.myOrders = catchAsyncErrors(async(req,res,next)=>{
    const orders = await Order.find({user: req.user._id})

    if(!orders){
        return next(new ErrorHandler("Order not found with this id",404))
    }

    res.status(200).json({
        success:true,
        orders
    })

})


// Get all orders -- admin
exports.getAllOrders = catchAsyncErrors(async(req,res,next)=>{
    const orders = await Order.find()

    let totalAmount = 0;

    orders.forEach(order=>{
        totalAmount+= order.totalPrice
    })

    res.status(200).json({
        success:true,
        totalAmount,
        orders
    })

})


// Update order status -- admin
exports.updateOrder = catchAsyncErrors(async(req,res,next)=>{
    const order = await Order.findById(req.params.id)

    if(!order){
        return next(new ErrorHandler("Order not found with this id",404))
    }

    if(order.orderStatus === "Delivered"){
        return next(new ErrorHandler("You have already delivered this order", 400))
    }

    if(req.body.status==="Shipped"){
        for (const item of order.orderItems) {
            await updateStock(item.product, item.quantity);
        }    
    }

    order.orderStatus = req.body.status;

    if(req.body.status === "Delivered"){
        order.deliveredAt = Date.now()
    }

    await order.save({validateBeforeSave:false})

    res.status(200).json({
        success:true,
        order
    })

})


async function updateStock(id, quantity){
    const product = await Product.findById(id)
    product.Stock = product.Stock - quantity

    await product.save()
}



// Delete order -- admin
exports.deleteOrder = catchAsyncErrors(async(req,res,next)=>{
    const order = await Order.findById(req.params.id)

    await order.deleteOne()

    if(!order){
        return next(new ErrorHandler("Order not found with this id",404))
    }

    res.status(200).json({
        success:true
    })

})
