(function(){
  'use strict';

  const AUTH_STATES = {
    loggedOut: 'logged-out',
    loginForm: 'login-form',
    registerForm: 'register-form',
    loggedInPlaceholder: 'logged-in-placeholder'
  };

  const copy = {
    [AUTH_STATES.loginForm]: {
      icon: '🤍',
      title: 'ログインプレビュー',
      lead: 'Firebase Authはまだ接続されていません。入力しても認証は行われません。',
      submit: 'ログインプレビューを表示',
      switchText: '登録プレビューへ'
    },
    [AUTH_STATES.registerForm]: {
      icon: '🕯️',
      title: '登録プレビュー',
      lead: 'Firebase Authはまだ接続されていません。入力してもアカウントは作成されません。',
      submit: '登録プレビューを表示',
      switchText: 'ログインプレビューへ'
    },
    [AUTH_STATES.loggedInPlaceholder]: {
      icon: '🤎',
      title: '認証プレビュー状態',
      lead: 'これはプレビュー状態のみです。Firebase Authにはログインしていません。'
    }
  };

  let authState = AUTH_STATES.loggedOut;
  let modalOpen = false;

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
    const loggedIn = authState === AUTH_STATES.loggedInPlaceholder;
    const showingModal = showingForm || (loggedIn && modalOpen);
    const currentCopy = copy[authState] || {};

    els.modal.classList.toggle('open', showingModal);
    els.modal.setAttribute('aria-hidden', String(!showingModal));
    els.stateText.textContent = loggedIn ? '認証プレビュー中' : 'Firebase Auth未接続';
    els.link.textContent = loggedIn ? 'プレビュー状態' : 'ログイン / 登録プレビュー';

    if(currentCopy.icon) els.icon.textContent = currentCopy.icon;
    if(currentCopy.title) els.title.textContent = currentCopy.title;
    if(currentCopy.lead) els.lead.textContent = currentCopy.lead;

    els.form.hidden = !showingForm;
    els.placeholder.hidden = !loggedIn;
    els.switcher.hidden = !showingForm;
    els.nameField.hidden = !showingRegister;
    els.password.autocomplete = showingRegister ? 'new-password' : 'current-password';
    els.message.textContent = showingForm ? 'Firebase Authはまだ接続されていません（UIプレビューのみ）。' : '';

    if(showingForm){
      els.submit.textContent = currentCopy.submit;
      els.switcher.textContent = currentCopy.switchText;
    }
  }

  function focusCurrentState(){
    defer(() => {
      if(!els.modal.classList.contains('open')) return;
      if(authState === AUTH_STATES.registerForm){
        els.name.focus();
      } else if(authState === AUTH_STATES.loginForm){
        els.email.focus();
      } else if(authState === AUTH_STATES.loggedInPlaceholder){
        els.placeholderClose.focus();
      }
    });
  }

  function clearMessage(){
    els.message.textContent = '';
  }

  function clearForm(){
    els.name.value = '';
    els.email.value = '';
    els.password.value = '';
    clearMessage();
  }

  function openLoginForm(){
    modalOpen = true;
    clearForm();
    setState(AUTH_STATES.loginForm, true);
  }

  function openLoggedInPlaceholder(){
    modalOpen = true;
    setState(AUTH_STATES.loggedInPlaceholder, true);
  }

  function closeAuthModal(){
    modalOpen = false;
    if(authState === AUTH_STATES.loginForm || authState === AUTH_STATES.registerForm){
      clearForm();
      authState = AUTH_STATES.loggedOut;
    }
    renderAuth();
  }

  function activateAuthLink(){
    if(authState === AUTH_STATES.loggedInPlaceholder){
      openLoggedInPlaceholder();
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

  function submitSkeleton(e){
    e.preventDefault();
    clearMessage();
    modalOpen = true;
    setState(AUTH_STATES.loggedInPlaceholder, true);
  }

  function logoutSkeleton(){
    modalOpen = false;
    clearForm();
    setState(AUTH_STATES.loggedOut);
  }

  els.link.addEventListener('click', activateAuthLink);
  els.link.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      activateAuthLink();
    }
  });
  els.form.addEventListener('submit', submitSkeleton);
  els.cancel.addEventListener('click', closeAuthModal);
  els.switcher.addEventListener('click', toggleFormMode);
  els.placeholderClose.addEventListener('click', closeAuthModal);
  els.logout.addEventListener('click', logoutSkeleton);
  els.modal.addEventListener('click', e => {
    if(e.target === els.modal) closeAuthModal();
  });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && els.modal.classList.contains('open')) closeAuthModal();
  });

  renderAuth();
})();