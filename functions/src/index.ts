import { initializeApp } from "firebase-admin/app";

initializeApp();

export { onFirestoreWrite } from "./triggers/onFirestoreWrite";
export { exportFirestoreBackup } from "./backup/exportFirestore";
