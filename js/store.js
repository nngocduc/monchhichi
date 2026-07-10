const LS_KEY = 'olr_data_v1';

function cloneData(data){
  return JSON.parse(JSON.stringify(data));
}

const localStore = {
  key: LS_KEY,

  load(defaultData){
    try{
      const saved = localStorage.getItem(LS_KEY);
      if(saved) return JSON.parse(saved);
    }catch(e){}
    return cloneData(defaultData);
  },

  save(data){
    try{
      localStorage.setItem(LS_KEY, JSON.stringify(data));
      return true;
    }catch(e){
      return false;
    }
  },

  reset(defaultData){
    try{
      localStorage.removeItem(LS_KEY);
    }catch(e){}
    return cloneData(defaultData);
  }
};

const firestoreStore = {
  load(defaultData){
    throw new Error('Firestore store is not wired into the app yet.');
  },

  save(data){
    throw new Error('Firestore store is not wired into the app yet.');
  },

  reset(defaultData){
    throw new Error('Firestore store is not wired into the app yet.');
  }
};

const activeStore = localStore;

window.localStore = localStore;
window.firestoreStore = firestoreStore;
window.activeStore = activeStore;
