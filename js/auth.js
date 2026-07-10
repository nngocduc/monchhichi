(function(){
  'use strict';

  const AUTH_STATES = {
    unavailable: 'unavailable',
    checking: 'checking',
    loggedOut: 'logged-out',
    loginForm: 'login-form',
    registerForm: 'register-form',
    loggedIn: 'logged-in'
  };

  const copy = {
    [AUTH_STATES.loginForm]: {
      icon: '🤍',
      title: 'ログイン',
      lead: 'Firebase Auth のメール / パスワードでログインします。',
      submit: 'ログイン',
      switchText: '新規登録へ'
    },
    [AUTH_STATES.registerForm]: {
      icon: '🕯️',
      title: '新規登録',
      lead: 'Firebase Auth にメール / パスワードのアカウントを作成します。',
      submit: '登録',
      switchText: 'ログインへ戻る'
    },
    [AUTH_STATES.loggedIn]: {
      icon: '🤎',
      title: 'ログイン中',
      lead: 'Firebase Auth にログインしています。'
    },
    [AUTH_STATES.loggedOut]: {
      icon: '🤍',
      title: 'ログアウト中',
      lead: 'ログインまたは新規登録ができます。'
    },
    [AUTH_STATES.unavailable]: {
      icon: '⚠️',
      title: 'Firebase Auth未接続',
      lead: 'Firebase設定が未入力のため、ログインと登録は利用できません。'
    },
    [AUTH_STATES.checking]: {
      icon: '⏳',
      title: 'Firebase Auth確認中',
      lead: 'Firebase Auth の接続状態を確認しています。'
    }
  };

  let authState = AUTH_STATES.checking;
  let modalOpen = false;
  let authApi = null;
  let authClient = null;
  let authUser = null;
  let authReady = false;
  let authBusy = false;
  let unavailableReason = copy[AUTH_STATES.unavailable].lead;

  const q = selector => document.querySelector(selector);
  const els = {
    stateText: q('#authStateText'),
    link: q('#authLink'),
    modal: q('#authModal'),
    icon: q('#authIcon'),
    title: q('#authTitle'),
    lead: q('#authLead'),
    form: q('#authForm'),
    nameField: q('#authNameField'),
    name: q('#authName'),
    email: q('#authEmail'),
    password: q('#authPassword'),
    message: q('#authMessage'),
    cancel: q('#authCancel'),
    submit: q('#authSubmit'),
    switcher: q('#authSwitch'),
    placeholder: q('#authPlaceholder'),
    placeholderText: q('#authPlaceholderText'),
    placeholderClose: q('#authPlaceholderClose'),
    logout: q('#authLogout')
  };

  if(Object.values(els).some(el => !el)) return;

  const defer = window.requestAnimationFrame
    ? callback => window.requestAnimationFrame(callback)
    : callback => setTimeout(callback, 0);

  function setState(nextState, focusAfterRender = false){
    authState = nextState;
    renderAuth();
    if(focusAfterRender) focusCurrentState();
  }

  function renderAuth(){
    const showingLogin = authState === AUTH_STATES.loginForm;
    const showingRegister = authState === AUTH_STATES.registerForm;
    const showingForm = showingLogin || showingRegister;
    const loggedIn = authReady && Boolean(authUser);
    const unavailable = authState === AUTH_STATES.unavailable;
    const checking = authState === AUTH_STATES.checking;
    const showingInfo = unavailable || checking || authState === AUTH_STATES.loggedIn;
    const currentCopy = copy[authState] || copy[AUTH_STATES.unavailable];

    els.modal.classList.toggle('open', modalOpen);
    els.modal.setAttribute('aria-hidden', String(!modalOpen));
    els.stateText.textContent = getFooterStateText(loggedIn, unavailable, checking);
    els.link.textContent = getFooterLinkText(loggedIn, unavailable, checking);

    els.icon.textContent = currentCopy.icon;
    els.title.textContent = currentCopy.title;
    els.lead.textContent = unavailable ? unavailableReason : currentCopy.lead;

    els.form.hidden = !showingForm;
    els.placeholder.hidden = !showingInfo;
    els.switcher.hidden = !showingForm;
    els.nameField.hidden = true;
    els.password.autocomplete = showingRegister ? 'new-password' : 'current-password';

    if(showingForm){
      els.submit.textContent = currentCopy.submit;
      els.switcher.textContent = currentCopy.switchText;
      if(!els.message.textContent || !authBusy) els.message.textContent = '';
    }

    if(showingInfo){
      els.placeholderText.textContent = getInfoText(unavailable, checking, loggedIn);
    }

    els.logout.hidden = !loggedIn;
    setBusy(authBusy);
  }

  function getFooterStateText(loggedIn, unavailable, checking){
    if(checking) return 'Firebase Auth確認中';
    if(unavailable) return 'Firebase Auth未接続';
    if(loggedIn) return 'ログイン中';
    return 'ログアウト中';
  }

  function getFooterLinkText(loggedIn, unavailable, checking){
    if(checking) return '確認中';
    if(unavailable) return '設定が必要';
    if(loggedIn) return 'アカウント';
    return 'ログイン / 登録';
  }

  function getInfoText(unavailable, checking, loggedIn){
    if(checking) return 'Firebase Auth の初期化を待っています。';
    if(unavailable) return unavailableReason;
    if(loggedIn) return 'Firebase Auth にログインしています。';
    return '';
  }

  function focusCurrentState(){
    defer(() => {
      if(!els.modal.classList.contains('open')) return;
      if(authState === AUTH_STATES.registerForm || authState === AUTH_STATES.loginForm){
        els.email.focus();
      } else {
        els.placeholderClose.focus();
      }
    });
  }

  function setBusy(on){
    authBusy = on;
    els.email.disabled = on;
    els.password.disabled = on;
    els.submit.disabled = on;
    els.switcher.disabled = on;
    els.logout.disabled = on;
  }

  function setMessage(message){
    els.message.textContent = message;
  }

  function clearMessage(){
    setMessage('');
  }

  function clearForm(){
    els.name.value = '';
    els.email.value = '';
    els.password.value = '';
    clearMessage();
  }

  function openLoginForm(){
    if(!authReady){
      modalOpen = true;
      renderAuth();
      focusCurrentState();
      return;
    }
    modalOpen = true;
    clearForm();
    setState(AUTH_STATES.loginForm, true);
  }

  function openAccount(){
    if(!authUser){
      openLoginForm();
      return;
    }
    modalOpen = true;
    setState(AUTH_STATES.loggedIn, true);
  }

  function closeAuthModal(){
    modalOpen = false;
    if(authState === AUTH_STATES.loginForm || authState === AUTH_STATES.registerForm){
      clearForm();
      authState = authUser ? AUTH_STATES.loggedIn : AUTH_STATES.loggedOut;
    }
    renderAuth();
  }

  function activateAuthLink(){
    if(authState === AUTH_STATES.checking || authState === AUTH_STATES.unavailable){
      modalOpen = true;
      renderAuth();
      focusCurrentState();
      return;
    }
    if(authUser){
      openAccount();
      return;
    }
    openLoginForm();
  }

  function toggleFormMode(){
    clearMessage();
    if(authState === AUTH_STATES.loginForm){
      setState(AUTH_STATES.registerForm, true);
      return;
    }
    setState(AUTH_STATES.loginForm, true);
  }

  async function submitAuth(e){
    e.preventDefault();
    if(!authReady || !authClient || !authApi){
      modalOpen = true;
      setState(AUTH_STATES.unavailable, true);
      return;
    }

    const email = els.email.value.trim();
    const password = els.password.value;
    if(!email || !password){
      setMessage('メールアドレスとパスワードを入力してください。');
      return;
    }

    setBusy(true);
    setMessage(authState === AUTH_STATES.registerForm ? '登録しています…' : 'ログインしています…');

    try{
      const credential = authState === AUTH_STATES.registerForm
        ? await authApi.createUserWithEmailAndPassword(authClient, email, password)
        : await authApi.signInWithEmailAndPassword(authClient, email, password);
      authUser = credential.user;
      els.password.value = '';
      modalOpen = true;
      setState(AUTH_STATES.loggedIn, true);
    }catch(error){
      setMessage(authErrorMessage(error));
    }finally{
      setBusy(false);
    }
  }

  async function logoutAuth(){
    if(!authReady || !authClient || !authApi){
      closeAuthModal();
      return;
    }

    setBusy(true);
    try{
      await authApi.signOut(authClient);
      authUser = null;
      closeAuthModal();
      setState(AUTH_STATES.loggedOut);
    }catch(error){
      modalOpen = true;
      setState(AUTH_STATES.loggedIn);
      setMessage(authErrorMessage(error));
    }finally{
      setBusy(false);
    }
  }

  function authErrorMessage(error){
    const code = error && error.code;
    if(code === 'auth/email-already-in-use') return 'このメールアドレスはすでに登録されています。';
    if(code === 'auth/invalid-email') return 'メールアドレスの形式を確認してください。';
    if(code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') return 'メールアドレスまたはパスワードが違います。';
    if(code === 'auth/weak-password') return 'パスワードは6文字以上にしてください。';
    if(code === 'auth/network-request-failed') return 'ネットワーク接続を確認してください。';
    if(code === 'auth/operation-not-allowed') return 'Firebase Consoleでメール / パスワード認証を有効にしてください。';
    return 'Firebase Authでエラーが発生しました。';
  }

  async function initAuth(){
    if(!window.appFirebase){
      unavailableReason = 'Firebase設定スクリプトを読み込めません。';
      setState(AUTH_STATES.unavailable);
      return;
    }
    if(!window.appFirebase.configured){
      unavailableReason = 'js/firebase.js のFirebase設定がプレースホルダーのため、ログインと登録は利用できません。';
      setState(AUTH_STATES.unavailable);
      return;
    }

    setState(AUTH_STATES.checking);
    const firebaseApp = await window.appFirebase.init();
    if(!firebaseApp.auth || !firebaseApp.modules || !firebaseApp.modules.auth){
      unavailableReason = firebaseApp.error
        ? 'Firebase SDKを読み込めません。ネットワークまたは設定を確認してください。'
        : 'Firebase Authを初期化できません。';
      setState(AUTH_STATES.unavailable);
      return;
    }

    authClient = firebaseApp.auth;
    authApi = firebaseApp.modules.auth;
    authReady = true;
    authApi.onAuthStateChanged(authClient, user => {
      authUser = user;
      if(user){
        setState(AUTH_STATES.loggedIn);
        return;
      }
      if(authState === AUTH_STATES.checking){
        setState(modalOpen ? AUTH_STATES.loginForm : AUTH_STATES.loggedOut, modalOpen);
        return;
      }
      if(authState === AUTH_STATES.loggedIn){
        modalOpen = false;
        setState(AUTH_STATES.loggedOut);
        return;
      }
      renderAuth();
    }, () => {
      unavailableReason = 'Firebase Authの状態確認に失敗しました。';
      authReady = false;
      setState(AUTH_STATES.unavailable);
    });
  }

  els.link.addEventListener('click', activateAuthLink);
  els.link.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      activateAuthLink();
    }
  });
  els.form.addEventListener('submit', submitAuth);
  els.cancel.addEventListener('click', closeAuthModal);
  els.switcher.addEventListener('click', toggleFormMode);
  els.placeholderClose.addEventListener('click', closeAuthModal);
  els.logout.addEventListener('click', logoutAuth);
  els.modal.addEventListener('click', e => {
    if(e.target === els.modal) closeAuthModal();
  });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && els.modal.classList.contains('open')) closeAuthModal();
  });

  renderAuth();
  initAuth();
})();
