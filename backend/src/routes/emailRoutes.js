import express from 'express'
import { sendAppointmentEmail } from '../controllers/emailController.js'

const router = express.Router()

// POST /api/email/confirm-appointment
router.post('/confirm-appointment', sendAppointmentEmail)

export default router
