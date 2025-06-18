import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
    apiKey: "AIzaSyBM6FcmfylF6_hVfPjfIJ2r5VmCpf4rNwc",
    authDomain: "proxi-66e57.firebaseapp.com",
    projectId: "proxi-66e57",
    storageBucket: "proxi-66e57.firebasestorage.app",
    messagingSenderId: "912618542397",
    appId: "1:912618542397:web:1442ac899e15217ddfa154",
    measurementId: "G-63F708HFTF"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

if (location.hostname === "localhost") {

    connectFunctionsEmulator(functions, "localhost", 5001);
    console.log("Connected to Firebase Functions Emulator");
}

export const generatePlan = httpsCallable(functions, "generatePlan");
