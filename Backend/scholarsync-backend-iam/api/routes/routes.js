import express from 'express';
const router = express.Router();
import { protect, authorize, USER_ROLE } from 'scholarsync-backend-common';
import { ROUTES } from '../../constants/route-constants.js';

import authController from '../controller/auth-controller.js';
import passwordController from '../controller/password-controller.js';
import userController from '../controller/user-controller.js';
import studentController from '../controller/student-controller.js';
import teacherController from '../controller/teacher-controller.js';
import ipController from '../controller/ip-controller.js';

// ========== AUTH (Public) ==========
router.post(ROUTES.AUTH_LOGIN, (req, res, next) => authController.login(req, res, next));
router.post(ROUTES.AUTH_FORGOT_PASSWORD, (req, res, next) => passwordController.forgotPassword(req, res, next));
router.put(ROUTES.AUTH_RESET_PASSWORD, (req, res, next) => passwordController.resetPassword(req, res, next));
router.post(ROUTES.AUTH_REFRESH_TOKEN, (req, res, next) => authController.refreshToken(req, res, next));

// ========== AUTH (Protected) ==========
router.get(ROUTES.AUTH_ME, protect, (req, res, next) => authController.getMe(req, res, next));
router.put(ROUTES.AUTH_UPDATE_PASSWORD, protect, (req, res, next) => authController.updatePassword(req, res, next));
router.post(ROUTES.AUTH_LOGOUT, protect, (req, res, next) => authController.logout(req, res, next));
router.post(ROUTES.AUTH_REGISTER, protect, authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER), (req, res, next) => authController.register(req, res, next));
router.post(ROUTES.AUTH_BULK_REGISTER, protect, authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER), (req, res, next) => authController.bulkRegister(req, res, next));

// ========== USER MANAGEMENT (Unified) ==========
router.get(ROUTES.USER_BY_ID, protect, authorize(USER_ROLE.ADMIN), (req, res, next) => userController.getUser(req, res, next));
router.put(ROUTES.USER_BY_ID, protect, authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER), (req, res, next) => userController.updateUser(req, res, next));
router.delete(ROUTES.USER_BY_ID, protect, authorize(USER_ROLE.ADMIN), (req, res, next) => userController.deleteUser(req, res, next));
router.post(ROUTES.USER_STATUS, protect, authorize(USER_ROLE.ADMIN), (req, res, next) => userController.manageUserStatus(req, res, next));

// ========== LIST ENDPOINTS ==========
router.get(ROUTES.TEACHERS, protect, authorize(USER_ROLE.ADMIN), (req, res, next) => teacherController.getTeachers(req, res, next));
router.get(ROUTES.STUDENTS, protect, authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER), (req, res, next) => studentController.getAllStudents(req, res, next));

// ========== LECTURE ASSIGNMENT (Admin) ==========
router.post(ROUTES.LECTURES_MANAGE, protect, authorize(USER_ROLE.ADMIN), (req, res, next) => studentController.manageLectures(req, res, next));

// ========== IP MANAGEMENT (Admin) ==========
router.post(ROUTES.IP_MANAGE, protect, authorize(USER_ROLE.ADMIN), (req, res, next) => ipController.manageIP(req, res, next));
router.delete(ROUTES.IP_DELETE, protect, authorize(USER_ROLE.ADMIN), (req, res, next) => ipController.deleteIP(req, res, next));
router.get(ROUTES.IP_STATUS, protect, authorize(USER_ROLE.ADMIN), (req, res, next) => ipController.getIPStatus(req, res, next));

export default router;
