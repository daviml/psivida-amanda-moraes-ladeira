import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';
import * as path from 'path';

admin.initializeApp();

// Este arquivo deve ser colocado na pasta functions pelo usuário
const KEYFILE = path.join(__dirname, '..', 'service-account.json');

// Escopos necessários para a agenda
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// A linha abaixo faz deploy apenas para o servidor local
export const onCreateAppointment = functions.region('southamerica-east1').firestore
  .document('appointments/{appointmentId}')
  .onCreate(async (snap: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    const data = snap.data();
    if (!data) return;

    const { userEmail, date, startTime, endTime } = data;
    
    try {
      // Autenticação com a Service Account
      const auth = new google.auth.GoogleAuth({
        keyFile: KEYFILE,
        scopes: SCOPES,
      });
      const authClient = await auth.getClient();
      
      const calendar = google.calendar({ version: 'v3', auth: authClient as any });

      // Preparar datas para o Google (formato ISO)
      // O Firestore salva como Timestamp, então convertemos para Date
      const appointmentDate = date.toDate();
      
      const startDateTime = new Date(appointmentDate);
      const [startHour, startMin] = startTime.split(':');
      startDateTime.setHours(parseInt(startHour), parseInt(startMin), 0);

      const endDateTime = new Date(appointmentDate);
      const [endHour, endMin] = endTime.split(':');
      endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0);

      const event = {
        summary: `Consulta: ${userEmail}`,
        description: `Atendimento Psicológico com Amanda Ladeira\nPaciente: ${userEmail}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'amandaladeirapsi@gmail.com',
        requestBody: event,
      });

      const eventId = response.data.id;
      const eventLink = response.data.htmlLink;

      // Salvar o ID e link do evento no Firestore
      await snap.ref.update({
        googleCalendarEventId: eventId,
        googleCalendarLink: eventLink,
        calendarSynced: true,
      });
      console.log(`Evento criado com sucesso! ID: ${eventId}, Link: ${eventLink}`);

      return { success: true };
    } catch (error: any) {
      console.error('Erro detalhado ao criar evento:', {
        message: error.message,
        errors: error.errors,
        code: error.code,
        response: error.response?.data
      });
      return { success: false, error: error.message };
    }
  });
