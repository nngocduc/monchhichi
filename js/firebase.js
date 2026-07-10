const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};

const FIREBASE_SDK_VERSION = "12.15.0";

function hasRealFirebaseConfig(config){
  return Object.values(config).every(value => {
    return value && !String(value).includes("YOUR_");
  });
}

const appFirebase = {
  app: null,
  auth: null,
  modules: null,
  config: firebaseConfig,
  initialized: false,
  configured: hasRealFirebaseConfig(firebaseConfig),
  error: null,
  initPromise: null,

  async init(){
    if(this.initialized) return this;
    if(!this.configured) return this;
    if(this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const [appModule, authModule] = await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth.js`)
      ]);

      this.modules = { app: appModule, auth: authModule };
      this.app = appModule.getApps().length
        ? appModule.getApp()
        : appModule.initializeApp(firebaseConfig);
      this.auth = authModule.getAuth(this.app);
      this.initialized = true;
      this.error = null;
      return this;
    })().catch(error => {
      this.error = error;
      this.initPromise = null;
      return this;
    });

    return this.initPromise;
  }
};

window.appFirebase = appFirebase;
