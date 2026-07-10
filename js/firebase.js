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
  db: null,
  modules: null,
  _bootstraps: {},
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
      const [appModule, authModule, firestoreModule] = await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth.js`),
        import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`)
      ]);

      this.modules = { app: appModule, auth: authModule, firestore: firestoreModule };
      this.app = appModule.getApps().length
        ? appModule.getApp()
        : appModule.initializeApp(firebaseConfig);
      this.auth = authModule.getAuth(this.app);
      this.db = firestoreModule.getFirestore(this.app);
      this.initialized = true;
      this.error = null;
      return this;
    })().catch(error => {
      this.error = error;
      this.initPromise = null;
      return this;
    });

    return this.initPromise;
  },

  async ensureUserDocuments(user){
    if(!user || !user.uid) return false;
    if(!this.db || !this.modules || !this.modules.firestore) return false;
    if(this._bootstraps[user.uid]) return this._bootstraps[user.uid];

    const fs = this.modules.firestore;
    this._bootstraps[user.uid] = (async () => {
      const userRef = fs.doc(this.db, "users", user.uid);
      const userSnap = await fs.getDoc(userRef);
      if(!userSnap.exists()){
        const fallbackName = user.email ? user.email.split("@")[0] : "user";
        await fs.setDoc(userRef, {
          displayName: user.displayName || fallbackName,
          createdAt: fs.serverTimestamp()
        });
      }

      const roomsQuery = fs.query(
        fs.collection(this.db, "rooms"),
        fs.where("ownerId", "==", user.uid),
        fs.limit(1)
      );
      const roomsSnap = await fs.getDocs(roomsQuery);
      if(roomsSnap.empty){
        await fs.addDoc(fs.collection(this.db, "rooms"), {
          ownerId: user.uid,
          title: "Our Little Room",
          createdAt: fs.serverTimestamp()
        });
      }
      return true;
    })().catch(error => {
      console.warn("Firestore bootstrap failed:", error);
      delete this._bootstraps[user.uid];
      return false;
    });

    return this._bootstraps[user.uid];
  }
};

window.appFirebase = appFirebase;
