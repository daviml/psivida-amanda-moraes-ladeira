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
exports.onCreateAppointment = void 0;
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
    const { userEmail, date, startTime, endTime } = data;
    try {
        // Autenticação com a Service Account
        const auth = new googleapis_1.google.auth.GoogleAuth({
            keyFile: KEYFILE,
            scopes: SCOPES,
        });
        const authClient = await auth.getClient();
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: authClient });
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
            conferenceData: {
                createRequest: {
                    requestId: context.params.appointmentId,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
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
            conferenceDataVersion: 1,
        });
        const meetLink = response.data.hangoutLink;
        // Salvar o link do Meet de volta no documento do Firestore
        if (meetLink) {
            await snap.ref.update({ googleMeetLink: meetLink });
            console.log(`Evento criado com sucesso! Link: ${meetLink}`);
        }
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
//# sourceMappingURL=index.js.map