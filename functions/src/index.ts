/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import axios from "axios";

admin.initializeApp();

interface GeneratePlanRequest {
    goals: string[];
}

function formatDate (timestamp: Timestamp) {

    return timestamp.toDate().toLocaleString("en-US", {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Chicago'
    });
}

function formatPrompt (goals: any[], reminders: any[], calendarEvents: any[]) {

    const formattedGoals = goals.map((goal, i) => `${i + 1}. ${goal}`);

    const formattedReminders = reminders.map((reminder, i) => {
        const due = reminder.due ? `, due: ${formatDate(reminder.due)}` : '';
        const notes = reminder.notes ? `, notes: ${reminder.notes}` : '';
        const completed = reminder.completed ? ' (Completed)' : '';
        return `${i + 1}. "${reminder.title}"${due}${notes}${completed}`;
    });

    const formattedEvents = calendarEvents.map((event, i) => {
        const start = formatDate(event.starts);
        const end = event.ends ? formatDate(event.ends) : "N/A";
        const allDay = event.allDay ? " (All-day event)" : "";
        return `${i + 1}. "${event.title}" — ${start} to ${end}, location: ${event.location || "N/A"}${allDay}`;
    });

    return `
You are a helpful assistant named Proxi. Create a realistic and productive daily schedule based on the following user goals, calendar events, and reminders.

Include specific time blocks where appropriate. Respect fixed calendar events. Fit in goals and reminders logically around them, considering travel time, priority, and deadlines.

### User Goals:
${formattedGoals.join('\n')}

### Calendar Events:
${formattedEvents.join('\n')}

### Reminders:
${formattedReminders.join('\n')}
`;
}

export const generatePlan = functions.https.onCall(async (request: functions.https.CallableRequest<GeneratePlanRequest>) => {

    const userGoals = request.data.goals;

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 24 * 7 * 60 * 60 * 1000);

    const remindersSnapshot = await admin.firestore()
        .collection("reminders")
        .where("due", ">=", Timestamp.fromDate(now))
        .where("due", "<", Timestamp.fromDate(tomorrow))
        .get();

    const calendarEventsSnapshot = await admin.firestore()
        .collection("calendarEvents")
        .where("starts", ">=", Timestamp.fromDate(now))
        .where("starts", "<", Timestamp.fromDate(nextWeek))
        .get();

    try {

        const response = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY, 
            {
                contents: [{
                    parts: [{
                        text: formatPrompt(userGoals, remindersSnapshot.docs.map(doc => doc.data()),  calendarEventsSnapshot.docs.map(doc => doc.data()))
                    }]
                }]
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data;
    } catch (error) {

        console.error("Gemini API Error:", error);
        throw new functions.https.HttpsError("internal", "Gemini API Error");
    }
});

export const postReminder = functions.https.onRequest(async (request, response) => {

    if (request.method !== "POST") {

        response.status(405).send("Method Not Allowed");
        return;
    }

    const { title, notes, due, completed } = request.body;
    const hash = `${title}-${due}`;
    
    const docRef = admin.firestore().collection("reminders").doc(hash);
    await docRef.set({
        title,
        notes,
        due: new Date(due),
        completed
    });

    response.status(200).send("Reminder Received");
});

export const postCalendarEvent = functions.https.onRequest(async (request, response) => {

    if (request.method !== "POST") {

        response.status(405).send("Method Not Allowed");
        return;
    }

    const { title, location, allDay, starts, ends, calendar } = request.body;
    const hash = `${title}-${starts}`;

    const docRef = admin.firestore().collection("calendarEvents").doc(hash);
    await docRef.set({
        title,
        location,
        allDay: allDay,
        starts: new Date(starts),
        ends: new Date(ends),
        calendar
    });

    response.status(200).send("Calendar Event Received");
});
