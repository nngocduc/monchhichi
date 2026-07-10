const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};

const appFirebase = {
  app: null,
  auth: null,
  db: null,
  config: firebaseConfig,
  initialized: false,
  configured: Object.values(firebaseConfig).every(value => {
    return value && !String(value).startsWith("YOUR_");
  }),

  init(){
    if(this.initialized) return this;
    if(!this.configured) return this;
    if(!window.firebase || !window.firebase.initializeApp) return this;

    this.app = window.firebase.apps && window.firebase.apps.length
      ? window.firebase.app()
      : window.firebase.initializeApp(firebaseConfig);
    this.auth = window.firebase.auth ? window.firebase.auth() : null;
    this.db = window.firebase.firestore ? window.firebase.firestore() : null;
    this.initialized = Boolean(this.app);
    return this;
  }
};

window.appFirebase = appFirebase;
