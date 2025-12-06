import express from "express";
import * as memberController from "../Controllers/memberController.js";

const router = express.Router();

router.get(`/members/detail`,memberController.getMembers)
router.post(`/members`,memberController.postMembers)
router.post(`/members/login`,memberController.loginMembers)
router.get(`/members/logout`,memberController.logoutMembers)
router.post('/members/uploadimg',memberController.uploadMember)
router.put('/members/update',memberController.updateMembers)

export default router
