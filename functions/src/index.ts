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
import axios from "axios";

admin.initializeApp();

interface GeneratePlanRequest {
    goals: string[];
}

export const generatePlan = functions.https.onCall(async (request: functions.https.CallableRequest<GeneratePlanRequest>) => {

    const userGoals = request.data.goals;
    const prompt = `Make a daily plan based on the following user goals: ${userGoals.join(", ")}.`;

    try {

        const response = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY, 
            {
                contents: [{
                    parts: [{
                        text: prompt
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

export const receiveReminder = functions.https.onRequest(async (request, response) => {

    if (request.method !== "POST") {

        response.status(405).send("Method Not Allowed");
        return;
    }

    const { title, notes, due, location, priority } = request.body;
    
    await admin.firestore().collection("reminders").add({
        title,
        notes,
        due: new Date(due),
        location,
        priority,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    response.status(200).send("Reminder Received");
});

export const receiveCalendarEvent = functions.https.onRequest(async (request, response) => {

    if (request.method !== "POST") {

        response.status(405).send("Method Not Allowed");
        return;
    }

    const { title, location, allDay, starts, ends, travelTime, calendar } = request.body;

    await admin.firestore().collection("calendarEvents").add({
        title,
        location,
        allDay: allDay,
        starts: new Date(starts),
        ends: new Date(ends),
        travelTime: travelTime,
        calendar,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    response.status(200).send("Calendar Event Received");
});
