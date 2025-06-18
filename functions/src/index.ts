/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from "firebase-functions";
import axios from "axios";

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
