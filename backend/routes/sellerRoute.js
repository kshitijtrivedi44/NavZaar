const {isAuthenticatedUser} = require("../middleware/auth")

const express = require("express")


const {createSellProduct} = require("../controller/sellerController")
const router = express.Router()

router.route("/sellproduct").post(isAuthenticatedUser, createSellProduct)

module.exports = router