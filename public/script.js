const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const button = form.querySelector('button');

// Store conversation history for API calls
let conversationHistory = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  try {
    // Disable form while processing
    input.disabled = true;
    button.disabled = true;

    // Add user message to chat display
    appendMessage('user', userMessage);
    input.value = '';

    // Add user message to conversation history
    conversationHistory.push({
      role: 'user',
      text: userMessage
    });

    // Show thinking message
    const thinkingId = showThinking();

    // Prepare payload for API
    const payload = {
      conversation: conversationHistory
    };

    // Send POST request to backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();

    if (!data.result) {
      throw new Error('No result received from server');
    }

    // Replace thinking message with actual response
    replaceThinking(thinkingId, data.result);

    // Add AI response to conversation history
    conversationHistory.push({
      role: 'model',
      text: data.result
    });

  } catch (error) {
    console.error('Error:', error);

    // Remove any existing thinking message
    const thinkingMessages = chatBox.querySelectorAll('.message.bot.thinking');
    thinkingMessages.forEach(msg => msg.remove());

    // Show error message
    const errorMessage = error.message.includes('Failed to fetch')
      ? 'Failed to connect to server. Please check your connection.'
      : error.message.includes('Server responded')
        ? 'Server error. Please try again later.'
        : 'Sorry, no response received.';

    appendMessage('bot', errorMessage);

  } finally {
    // Re-enable form
    input.disabled = false;
    button.disabled = false;
    input.focus();
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  
  // Parse markdown for bot messages
  if (sender === 'bot') {
    msg.innerHTML = marked.parse(text);
    msg.classList.add('markdown-content');
  } else {
    msg.textContent = text;
  }
  
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showThinking() {
  const msg = document.createElement('div');
  msg.classList.add('message', 'bot', 'thinking');
  msg.innerHTML = '<div class="loader"></div>';
  msg.id = 'thinking-' + Date.now();
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg.id;
}

function replaceThinking(thinkingId, newText) {
  const thinkingMsg = document.getElementById(thinkingId);
  if (thinkingMsg) {
    thinkingMsg.innerHTML = marked.parse(newText);
    thinkingMsg.classList.add('markdown-content');
    thinkingMsg.classList.remove('thinking');
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}
