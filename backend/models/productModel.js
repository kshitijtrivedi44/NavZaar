const mongoose = require("mongoose")

productSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please Enter Product Name"],
        trim:true
    },
    description:{
        type:String,
        required:[true,"Please Enter Product Discription"]
    },
    price:{
        type:Number,
        required:[true,"Please Enter Product Price"]
    },
    ratings:{
        type:Number,
        default:0
    },
    images:[{
        public_id:{
            type:String,
            required:true
        },
        url:{
            type:String,
            required:true
        }
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    isBulk:{
        type: Boolean,
        default: false
    },
    category:{
        type:String,
        required:[true,"Please Enter Product Category"]
    },
    Stock:{
        type:Number,
        required:[true,"Please Enter Product Stock"],
        default:1
    },
    numOfReviews:{
        type:Number,
        default:0
    },
    reviews:[
        
        {
            user:{
                type:mongoose.Schema.ObjectId,
                ref:"User",
                required:true
            },
            createdAt:{
                type:Date,
                default:Date.now
            },
            name:{
                type:String,
                required:true
            },
            rating:{
                type:Number,
                required:true
            },
            comment:{
                type:String
            }
        }
    ],

    user:{
        type:mongoose.Schema.ObjectId,
        ref:"User",
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})

module.exports = mongoose.model("Product", productSchema);