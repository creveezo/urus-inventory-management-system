const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
menuBtn?.addEventListener('click', () => sidebar?.classList.toggle('active'));
document.querySelector('.settings-btn')?.addEventListener('click', () => { location.href = '/settings.html'; });

// Shared Ask Pengurus chat widget.
const chat = document.createElement('div');
chat.className = 'pengurus-widget';
chat.innerHTML = `
  <section class="pengurus-panel" id="pengurus-panel" aria-labelledby="pengurus-title" hidden>
    <header class="pengurus-header">
      <div><span class="pengurus-header-icon" aria-hidden="true">✦</span><h2 id="pengurus-title">Ask Pengurus</h2></div>
      <button class="pengurus-close" type="button" aria-label="Close chat">×</button>
    </header>
    <div class="pengurus-messages" aria-live="polite">
      <p class="pengurus-message pengurus-message--assistant">
        Hi, I'm Pengurus. Ask me about your inventory.
      </p>
    </div>

    <div class="pengurus-composer">
      <input
        type="text"
        aria-label="Message"
        placeholder="Ask about your inventory..."
        maxlength="2000"
      >
      <button type="button" aria-label="Send message">➤</button>
    </div>
  </section>
  <button class="pengurus-toggle" type="button" aria-label="Open Ask Pengurus" aria-controls="pengurus-panel" aria-expanded="false">
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 5v3M13.5 5h5M7 15H5m22 0h-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="7" y="9" width="18" height="15" rx="5" fill="white"/><circle cx="12.5" cy="16" r="1.6" fill="#0b4a8a"/><circle cx="19.5" cy="16" r="1.6" fill="#0b4a8a"/><path d="M13 20c1.8 1.3 4.2 1.3 6 0" stroke="#0b4a8a" stroke-width="1.5" stroke-linecap="round"/></svg>
  </button>`;
document.body.append(chat);
const panel = chat.querySelector('.pengurus-panel');
const toggle = chat.querySelector('.pengurus-toggle');
const closeChat = () => { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open Ask Pengurus'); toggle.focus(); };
toggle.addEventListener('click', () => {
  if (!panel.hidden) { closeChat(); return; }
  panel.hidden = false; toggle.setAttribute('aria-expanded', 'true'); toggle.setAttribute('aria-label', 'Close Ask Pengurus');
  chat.querySelector('.pengurus-close').focus();
});
chat.querySelector('.pengurus-close').addEventListener('click', closeChat);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) closeChat(); });

const chatMessages = panel.querySelector('.pengurus-messages');
const chatInput = panel.querySelector('.pengurus-composer input');
const chatSendButton = panel.querySelector('.pengurus-composer button');

function addChatMessage(message, sender) {
  const element = document.createElement('p');

  element.className =
    `pengurus-message pengurus-message--${sender}`;

  element.textContent = message;

  chatMessages.appendChild(element);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendChatMessage() {
  const message = chatInput.value.trim();

  if (!message) {
    return;
  }

  addChatMessage(message, 'user');

  chatInput.value = '';
  chatInput.disabled = true;
  chatSendButton.disabled = true;

  try {
    const { connect } = await import('./secured-api.js');

    const api = await connect({ decorateHeader: false });

    const response = await api.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: message,
      }),
    });

    addChatMessage(response.message, 'assistant');
  } catch (error) {
    console.error('Pengurus chat error:', error);

    addChatMessage(
      'Sorry, I could not process that request. Please try again.',
      'assistant'
    );
  } finally {
    chatInput.disabled = false;
    chatSendButton.disabled = false;
    chatInput.focus();
  }
}

chatSendButton.addEventListener('click', sendChatMessage);

chatInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    sendChatMessage();
  }
});
