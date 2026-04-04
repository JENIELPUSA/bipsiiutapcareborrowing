const express = require('express');
const router = express.Router();//express router
const storageOptimized=require('./../Controller/StorageOptimization')
const authController = require('./../Controller/authController')

router.route('/')
    .post(authController.protect,storageOptimized.storageOptimization)
     .get(authController.protect,storageOptimized.DisplayStorageOptimizer)


module.exports=router