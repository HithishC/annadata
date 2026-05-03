import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDLLVh90wwcO6lbVvxZYOZkepzWFxG0Pbc",
  authDomain: "annadata-f2fec.firebaseapp.com",
  projectId: "annadata-f2fec",
  storageBucket: "annadata-f2fec.firebasestorage.app",
  messagingSenderId: "458130266387",
  appId: "1:458130266387:web:6b6a512357c2defa0062e6"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);