"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onDeleteAppointment = exports.onCreateAppointment = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const googleapis_1 = require("googleapis");
const path = __importStar(require("path"));
admin.initializeApp();
// Este arquivo deve ser colocado na pasta functions pelo usuário
const KEYFILE = path.join(__dirname, '..', 'service-account.json');
// Escopos necessários para a agenda
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// A linha abaixo faz deploy apenas para o servidor local
exports.onCreateAppointment = functions.region('southamerica-east1').firestore
    .document('appointments/{appointmentId}')
    .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data)
        return;
    const { userEmail, date, startTime, endTime, googleMeetLink } = data;
    try {
        // Autenticação com a Service Account
        const auth = new googleapis_1.google.auth.GoogleAuth({
            keyFile: KEYFILE,
            scopes: SCOPES,
        });
        const authClient = await auth.getClient();
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: authClient });
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
    }
    catch (error) {
        console.error('Erro detalhado ao criar evento:', {
            message: error.message,
            errors: error.errors,
            code: error.code,
            response: error.response?.data
        });
        return { success: false, error: error.message };
    }
});
exports.onDeleteAppointment = functions.region('southamerica-east1').firestore
    .document('appointments/{appointmentId}')
    .onDelete(async (snap, context) => {
    const data = snap.data();
    if (!data)
        return;
    const { googleCalendarEventId } = data;
    if (!googleCalendarEventId) {
        console.log('Nenhum ID de evento da Google Agenda encontrado para este agendamento.');
        return;
    }
    try {
        // Autenticação com a Service Account
        const auth = new googleapis_1.google.auth.GoogleAuth({
            keyFile: KEYFILE,
            scopes: SCOPES,
        });
        const authClient = await auth.getClient();
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: authClient });
        await calendar.events.delete({
            calendarId: 'amandaladeirapsi@gmail.com',
            eventId: googleCalendarEventId,
        });
        console.log(`Evento da Google Agenda excluído com sucesso! ID: ${googleCalendarEventId}`);
        return { success: true };
    }
    catch (error) {
        console.error('Erro ao excluir evento da Google Agenda:', error.message);
        return { success: false, error: error.message };
    }
});
//# sourceMappingURL=index.js.map