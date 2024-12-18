// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// TODO: Replace the following with your app's Firebase project configuration
// See: https://support.google.com/firebase/answer/7015592
const firebaseConfig = {
  apiKey: "AIzaSyAIGgr8XRn0hv9sDWjEzb9Ke9rgkiYASqY",
  authDomain: "indyfund-d5a44.firebaseapp.com",
  projectId: "indyfund-d5a44",
  storageBucket: "indyfund-d5a44.appspot.com",
  messagingSenderId: "616682533701",
  appId: "1:616682533701:web:86867011e6f6a9f540442c",
  measurementId: "G-Z9VYSFGX37"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);


export {db};