import express from 'express';
import {
  verifyWebhook,
  receiveWebhook,
  notifyPatient,
  confirmAppointment,
  remindAppointment,
} from '../controllers/whatsappController.js';

const router = express.Router();

// Webhook Meta (verificação e recebimento de mensagens)
router.get('/webhook', verifyWebhook);
router.post('/webhook', receiveWebhook);

// Envio de notificações
router.post('/notify', notifyPatient);
router.post('/confirm-appointment', confirmAppointment);
router.post('/reminder', remindAppointment);

export default router;
