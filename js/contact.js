(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---- email delivery -------------------------------------------------------------
     Enquiries are posted to Web3Forms (free), which emails them to datameldltd@gmail.com.
     1) Go to https://web3forms.com, enter datameldltd@gmail.com, and copy the access key they email you.
     2) Paste it below. Access keys are designed to be public, so it is safe in this file.
     Until a real key is here the form falls back to opening the visitor's email app.     */
  const ACCESS_KEY = 'cb6ce129-0baa-47c8-99f7-af735cac946f';
  const ENDPOINT = 'https://api.web3forms.com/submit';
  const EMAIL = 'datameldltd@gmail.com';
  const NUMBERS = { 'wa-uk': '447510294896', 'wa-pk': '923101539434' };
  const live = ACCESS_KEY && !/^PASTE/i.test(ACCESS_KEY);

  const form = $('#ctForm'), hint = $('#ctHint'), submit = $('#ctSubmit'), done = $('#ctDone');
  const val = id => ($('#' + id).value || '').trim();
  const needs = () => $$('#chips input:checked').map(i => i.value.replace('&amp;', '&'));
  const setHint = t => { hint.textContent = t; };
  const mark = (id, bad) => $('#' + id).classList.toggle('bad', !!bad);

  function validate() {
    ['fName', 'fEmail', 'fPhone'].forEach(id => mark(id, false));
    if (!val('fName')) { setHint('Please add your name so we know who we are talking to.'); mark('fName', true); $('#fName').focus(); return false; }
    if (!val('fEmail') && !val('fPhone')) { setHint('Please add an email or a phone number so we can reply.'); mark('fEmail', true); mark('fPhone', true); $('#fEmail').focus(); return false; }
    if (val('fEmail') && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('fEmail'))) { setHint('That email address does not look right. Please check it.'); mark('fEmail', true); $('#fEmail').focus(); return false; }
    setHint(''); return true;
  }

  function summary() {
    const n = needs();
    return [
      "Hi Data Meld, I'm " + val('fName') + (val('fBiz') ? ' from ' + val('fBiz') : '') + '.',
      n.length ? "I'm interested in: " + n.join(', ') + '.' : "I'd like to talk about a project.",
      val('fType') ? 'Business type: ' + val('fType') + '.' : '',
      val('fWhen') ? 'Timeline: ' + val('fWhen') + '.' : '',
      val('fMsg'),
      val('fEmail') ? 'Email: ' + val('fEmail') : '',
      val('fPhone') ? 'Phone: ' + val('fPhone') : ''
    ].filter(Boolean).join('\n\n');
  }

  function busy(on) { submit.disabled = on; submit.classList.toggle('loading', on); $('span', submit).textContent = on ? 'Sending…' : 'Send message'; }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if ($('#fTrap').value) return;            // honeypot: bots fill this, people never see it
    if (!validate()) return;

    if (!live) {                               // not connected yet: open the visitor's email app
      console.warn('Contact form: no Web3Forms access key set in js/contact.js, falling back to mailto.');
      setHint('Opening your email app. Just press send.');
      location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('New project enquiry from ' + val('fName')) + '&body=' + encodeURIComponent(summary());
      return;
    }

    busy(true); setHint('');
    const body = {
      access_key: ACCESS_KEY,
      subject: 'New enquiry from ' + val('fName') + (val('fBiz') ? ' (' + val('fBiz') + ')' : ''),
      from_name: 'Data Meld website',
      replyto: val('fEmail') || undefined,
      name: val('fName'), business: val('fBiz') || '-', email: val('fEmail') || '-', phone: val('fPhone') || '-',
      business_type: val('fType') || '-', timeline: val('fWhen') || '-',
      needs: needs().join(', ') || '-', message: val('fMsg') || '-',
      botcheck: ''
    };
    try {
      const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || 'send failed');
      done.hidden = false; form.classList.add('sent'); form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      setHint('Sorry, that did not go through. Please try again, or message us on WhatsApp or ' + EMAIL + '.');
    } finally { busy(false); }
  });

  $('#ctAgain').addEventListener('click', () => { form.reset(); done.hidden = true; form.classList.remove('sent'); setHint(''); });
  $$('#ctForm input, #ctForm select, #ctForm textarea').forEach(el => el.addEventListener('input', () => el.classList.remove('bad')));

  // WhatsApp shortcuts use the same fields
  $$('[data-send]').forEach(btn => btn.addEventListener('click', () => {
    if (!val('fName')) { setHint('Add your name first, then choose WhatsApp.'); mark('fName', true); $('#fName').focus(); return; }
    setHint('');
    window.open('https://wa.me/' + NUMBERS[btn.dataset.send] + '?text=' + encodeURIComponent(summary()), '_blank', 'noopener');
  }));
})();
