import express from "express";

import * as productController from "../Controllers/productController.js";

const router = express.Router();

router.get(`/products`,productController.getAllProducts)
router.get(`/products/three`,productController.getThreeProducts)
router.get(`/products/:product_id`,productController.getProductsById)
router.post(`/products`,productController.postProducts)
router.put(`/products/:product_id`,productController.putProducts)
router.delete(`/products/:product_id`,productController.deleteProducts)
router.get(`/products/brand/:brand_id`,productController.getProductsByBrandId)
router.get(`/products/search/:product_id`,productController.getSearchProducts)

export default router

