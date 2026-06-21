// ============================================
// Chat Application - Vanilla JavaScript
// ============================================

// Conversation history to maintain chat context
let conversationHistory = [];

// DOM elements
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// ============================================
// Helper Functions
// ============================================

/**
 * Add a message to the chat box UI
 * @param {string} role - 'user' or 'model'
 * @param {string} text - Message text
 */
function addMessageToChat(role, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${role}`;
  messageDiv.textContent = text;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to latest message
}

/**
 * Add a temporary "Thinking..." message that can be replaced later
 * @returns {HTMLElement} The thinking message element
 */
function addThinkingMessage() {
  const messageDiv = document.createElement('div');
  messageDiv.id = 'thinking-message';
  messageDiv.className = 'message message-model';
  messageDiv.textContent = 'Thinking...';
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  return messageDiv;
}

/**
 * Replace the temporary thinking message with the actual response
 * @param {string} text - The response text
 */
function replaceThinkingMessage(text) {
  const thinkingMessage = document.getElementById('thinking-message');
  if (thinkingMessage) {
    thinkingMessage.textContent = text;
    thinkingMessage.id = ''; // Remove ID since it's no longer temporary
  }
}

// ============================================
// API Communication
// ============================================

/**
 * Send message to backend API and get AI response
 * @param {string} userMessage - User's message
 */
async function sendMessageToAPI(userMessage) {
  try {
    // Build request payload with conversation history
    const payload = {
      conversation: conversationHistory,
    };

    // Send POST request to backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Check if response status is OK
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse JSON response
    const data = await response.json();

    // Validate that response contains result
    if (!data.result) {
      replaceThinkingMessage('Sorry, no response received.');
      return;
    }

    // Add AI response to chat and conversation history
    const aiMessage = data.result;
    replaceThinkingMessage(aiMessage);
    conversationHistory.push({ role: 'model', text: aiMessage });
  } catch (error) {
    console.error('Error communicating with API:', error);
    replaceThinkingMessage('Failed to get response from server.');
  }
}

// ============================================
// Event Listeners
// ============================================

/**
 * Handle form submission
 */
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Get and trim user input
  const userMessage = userInput.value.trim();

  // Validate input is not empty
  if (!userMessage) {
    return;
  }

  // Add user message to UI
  addMessageToChat('user', userMessage);

  // Add user message to conversation history
  conversationHistory.push({ role: 'user', text: userMessage });

  // Clear input field
  userInput.value = '';

  // Focus back on input for better UX
  userInput.focus();

  // Show thinking message while waiting for response
  addThinkingMessage();

  // Send message to API and get response
  await sendMessageToAPI(userMessage);
});
