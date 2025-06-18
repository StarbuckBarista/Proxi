import { useState } from 'react'
import { generatePlan } from './firebase'
import type { HttpsCallableResult } from 'firebase/functions';

interface GeminiResponse {
    candidates: {
        content: {
            parts: {
                text: string;
            }[];
        };
    }[];
}

export default function App() {

    const [goals, setGoals] = useState('');
    const [plan, setPlan] = useState('');

    const handleSubmit = async () => {

        const response = await generatePlan({ goals: goals.split(',') }) as HttpsCallableResult<GeminiResponse>;
        setPlan(response.data.candidates[0]?.content.parts[0]?.text || "No Plan Generated");
    };

    return (
        <div className="p-8 max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Proxi: Procrastination Fixer / Proxy Assistant</h1>
            <textarea value={goals} onChange={event => setGoals(event.target.value)} placeholder="Daily Goals" className="w-full p-2 border rounded mb-4"/>
            <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">Generate Plan</button>
            {plan && <pre className="mt-4 bg-gray-100 p-4 rounded">{plan}</pre>}
        </div>
    );
}
