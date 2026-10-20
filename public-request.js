/* Public MyEOD requests. No session or browser storage is used. */
(function () {
  'use strict';
  const endpoint = 'https://hnsxwrarctqqasddtghq.supabase.co/functions/v1/submit-portal-request';
  const apiKey = 'sb_publishable_bPnkexoj2cGftGvUUbdFNQ_MHfg1z99';
  const en = document.documentElement.lang.toLowerCase().startsWith('en');
  const text = en ? {
    busy: 'Sending your request…',
    success: 'Request accepted by the SMTP server. Inbox delivery still needs confirmation. Reference: ',
    uncertain: 'Delivery could not be confirmed. Keep the same fields and retry to check this request without sending it twice.',
    edited: 'The previous request has an unconfirmed result. Restore its fields and retry before submitting a different request.',
    UNAUTHORIZED: 'The form configuration is invalid. No request has been sent.',
    ORIGIN_NOT_ALLOWED: 'This page is not authorised to send requests.',
    TEST_EMAIL_NOT_ALLOWED: 'This email address is not authorised for acceptance testing.',
    CONFIG_REQUIRED: 'Sending is not configured yet. Your fields have been kept.',
    VALIDATION: 'Check the required fields and email address.',
    IN_PROGRESS: 'This request is still being processed. Retry with the same fields shortly.',
    SEND_UNCONFIRMED: 'Delivery could not be confirmed. Retry with the same fields; no new request will be created.',
    RATE_LIMITED: 'Too many requests. Please wait before retrying.',
    CONFLICT: 'This reference already belongs to another request. Your fields have been kept.',
    TEMPORARY_ERROR: 'The service is temporarily unavailable. Your fields have been kept. Retry shortly.'
  } : {
    busy: 'Envoi de votre demande…',
    success: 'Demande acceptée par le serveur SMTP. Réception dans la boîte à confirmer. Référence : ',
    uncertain: 'Envoi non confirmé. Conservez les mêmes champs et réessayez pour vérifier cette demande sans double envoi.',
    edited: 'Le résultat de la demande précédente est incertain. Rétablissez ses champs et réessayez avant de soumettre une demande différente.',
    UNAUTHORIZED: 'La configuration du formulaire est incorrecte. Aucune demande n’a été envoyée.',
    ORIGIN_NOT_ALLOWED: 'Cette page n’est pas autorisée à envoyer des demandes.',
    TEST_EMAIL_NOT_ALLOWED: 'Cette adresse email n’est pas autorisée pour la recette.',
    CONFIG_REQUIRED: 'L’envoi n’est pas encore configuré. Vos champs sont conservés.',
    VALIDATION: 'Vérifiez les champs obligatoires et l’adresse email.',
    IN_PROGRESS: 'Cette demande est encore en cours de traitement. Réessayez avec les mêmes champs dans un instant.',
    SEND_UNCONFIRMED: 'Envoi non confirmé. Réessayez avec les mêmes champs ; aucune nouvelle demande ne sera créée.',
    RATE_LIMITED: 'Trop de demandes. Patientez avant de réessayer.',
    CONFLICT: 'Cette référence correspond déjà à une autre demande. Vos champs sont conservés.',
    TEMPORARY_ERROR: 'Le service est temporairement indisponible. Vos champs sont conservés. Réessayez dans un instant.'
  };
  function setup(form, kind, status) {
    if (!form || !status) return;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.style.overflowWrap = 'anywhere';
    status.style.maxWidth = '100%';
    const controls = Array.from(form.querySelectorAll('input, textarea, select, button[type="submit"]'));
    let busy = false, previous = null, uncertain = false;
    function show(message, ok) {
      status.textContent = message;
      status.style.display = 'block';
      status.style.color = ok ? '#27633d' : '#6c3030';
    }
    function value(name) { const field = form.elements.namedItem(name); return field ? field.value.trim() : ''; }
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (busy) return;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const payload = {
        kind: kind,
        language: en ? 'en' : 'fr',
        service: location.pathname.split('/').pop().replace(/\.html$/, ''),
        firstname: value('firstname'), lastname: value('lastname'), company: value('company'),
        email: value('email'), country: value('country'), phone: value('phone'),
        job_title: value('role'), message: value('need'), website: ''
      };
      const fingerprint = JSON.stringify(payload);
      if (uncertain && previous && previous.fingerprint !== fingerprint) { show(text.edited, false); return; }
      if (!previous || previous.fingerprint !== fingerprint) previous = { fingerprint: fingerprint, id: crypto.randomUUID() };
      payload.request_id = previous.id;
      const savedDisabled = controls.map(control => control.disabled);
      busy = true;
      controls.forEach(control => { control.disabled = true; });
      form.setAttribute('aria-busy', 'true');
      show(text.busy, false);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json', apikey: apiKey },
          body: JSON.stringify(payload), signal: controller.signal
        });
        const result = await response.json();
        if (response.ok && result.ok === true && result.status === 'smtp_accepted' && result.request_id === previous.id) {
          show(text.success + result.request_id, true);
          form.reset();
          previous = null;
          uncertain = false;
        } else {
          const code = typeof result.code === 'string' ? result.code : '';
          uncertain = ['SEND_UNCONFIRMED', 'IN_PROGRESS', 'CONFLICT'].includes(code) || !Object.prototype.hasOwnProperty.call(text, code);
          show(Object.prototype.hasOwnProperty.call(text, code) ? text[code] : text.uncertain, false);
        }
      } catch (_) {
        uncertain = true;
        show(text.uncertain, false);
      } finally {
        clearTimeout(timeout);
        busy = false;
        controls.forEach((control, index) => { control.disabled = savedDisabled[index]; });
        form.removeAttribute('aria-busy');
      }
    });
  }
  function init() {
    setup(document.getElementById('new-client-form'), 'new_client', document.getElementById('new-client-status'));
    setup(document.getElementById('contact-form'), 'contact', document.getElementById('contact-message'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
