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

    const { userEmail, date, startTime, endTime, googleMeetLink } = data;
    
    try {
      // Autenticação com a Service Account
      const auth = new google.auth.GoogleAuth({
        keyFile: KEYFILE,
        scopes: SCOPES,
      });
      const authClient = await auth.getClient();
      
      const calendar = google.calendar({ version: 'v3', auth: authClient as any });

      // Preparar datas para o Google (formato ISO na timezone local)
      // O Firestore salva como Timestamp, então convertemos para Date
      const appointmentDate = date.toDate();
      const year = appointmentDate.getUTCFullYear();
      const month = String(appointmentDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(appointmentDate.getUTCDate()).padStart(2, '0');
      
      const startIso = `${year}-${month}-${day}T${startTime}:00`;
      const endIso = `${year}-${month}-${day}T${endTime}:00`;

      const event = {
        summary: `Consulta: ${userEmail}`,
        description: `Atendimento Psicológico com Amanda Ladeira\nPaciente: ${userEmail}\n\nLink da Videochamada: ${googleMeetLink || 'Não informado'}`,
        start: {
          dateTime: startIso,
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: endIso,
          timeZone: 'America/Sao_Paulo',
        },
        location: googleMeetLink || 'Google Meet',
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

export const onDeleteAppointment = functions.region('southamerica-east1').firestore
  .document('appointments/{appointmentId}')
  .onDelete(async (snap: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    const data = snap.data();
    if (!data) return;

    const { googleCalendarEventId } = data;
    if (!googleCalendarEventId) {
      console.log('Nenhum ID de evento da Google Agenda encontrado para este agendamento.');
      return;
    }

    try {
      // Autenticação com a Service Account
      const auth = new google.auth.GoogleAuth({
        keyFile: KEYFILE,
        scopes: SCOPES,
      });
      const authClient = await auth.getClient();
      
      const calendar = google.calendar({ version: 'v3', auth: authClient as any });

      await calendar.events.delete({
        calendarId: 'amandaladeirapsi@gmail.com',
        eventId: googleCalendarEventId,
      });

      console.log(`Evento da Google Agenda excluído com sucesso! ID: ${googleCalendarEventId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao excluir evento da Google Agenda:', error.message);
      return { success: false, error: error.message };
    }
  });
