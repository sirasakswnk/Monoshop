import express from "express";
import * as cartController from "../Controllers/cartController.js";

const router = express.Router();

router.post(`/carts/chkcart`,cartController.chkCart)
router.post(`/carts/addcart`,cartController.postCarts)
router.get('/carts/sumcart/:id',cartController.sumCarts)
router.get('/carts/getcart/:id',cartController.getCarts)
router.get(`/carts/getcartdtl/:id`,cartController.getCartDtl)
router.post('/carts/getcartbycus',cartController.getCartByCus)
router.post('/carts/addcartdtl',cartController.postCartDtl)
router.delete('/carts/deleteitem/:cartId/:pdId',cartController.deleteCartDtl)
router.delete('/carts/delete/:id',cartController.deleteCart)
router.post('/carts/confirm/:id',cartController.confirmOrder)
router.get('/orders/admin',cartController.getAllOrders)
router.get('/orders/:cusId',cartController.getOrders)
router.get('/orders/detail/:id',cartController.getOrderDtl)
router.put('/orders/:id/status',cartController.updateOrderStatus)
router.delete('/orders/:id',cartController.deleteOrder)
export default router