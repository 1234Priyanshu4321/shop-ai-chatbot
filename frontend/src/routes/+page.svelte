<script lang="ts">
	import { onMount } from 'svelte';

	interface Message {
		sender: 'user' | 'ai';
		text: string;
		timestamp?: Date;
		feedback?: 'positive' | 'negative' | null;
	}

	let messages: Message[] = [];
	let input = '';
	let loading = false;
	let loadingHistory = true;
	let sessionId: string | null = null;
	let darkMode = false;
	let isUserNearBottom = true; // Track if user is near bottom of scroll
	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
	let messagesContainer: HTMLDivElement;

	// Load session ID and chat history from localStorage on mount
	onMount(async () => {
		// Load dark mode preference
		const savedDarkMode = localStorage.getItem('darkMode');
		if (savedDarkMode === 'true') {
			darkMode = true;
			document.documentElement.classList.add('dark-mode');
		}

		const storedSessionId = localStorage.getItem('chatSessionId');
		if (storedSessionId) {
			sessionId = storedSessionId;
			await loadChatHistory(storedSessionId);
		} else {
			// No existing session, show welcome message
			messages = [{ 
				sender: 'ai', 
				text: 'Hi! How can I help you? Ask me about shipping, returns, or payments.', 
				timestamp: new Date() 
			}];
			loadingHistory = false;
		}

		// Set up scroll listener for scroll anchoring
		setTimeout(() => {
			if (messagesContainer) {
				messagesContainer.addEventListener('scroll', handleScroll);
			}
		}, 100);
	});

	function toggleDarkMode() {
		darkMode = !darkMode;
		localStorage.setItem('darkMode', darkMode.toString());
		if (darkMode) {
			document.documentElement.classList.add('dark-mode');
		} else {
			document.documentElement.classList.remove('dark-mode');
		}
	}

	function handleScroll() {
		if (!messagesContainer) return;
		const threshold = 100; // pixels from bottom
		const distanceFromBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
		isUserNearBottom = distanceFromBottom < threshold;
	}

	function handleFeedback(messageIndex: number, feedback: 'positive' | 'negative') {
		// Update message feedback in UI
		messages = messages.map((msg, idx) => 
			idx === messageIndex ? { ...msg, feedback } : msg
		);
		
		// Log feedback (in a real app, this would be sent to backend)
		console.log('Feedback:', { 
			messageIndex, 
			feedback, 
			message: messages[messageIndex].text,
			sessionId 
		});
		
		// Future: Send to backend API endpoint like POST /chat/feedback
	}

	async function loadChatHistory(sessionIdToLoad: string) {
		try {
			const response = await fetch(`${API_URL}/chat/history/${sessionIdToLoad}`);
			if (response.ok) {
				const data = await response.json();
				if (data.messages && data.messages.length > 0) {
					messages = data.messages.map((msg: any) => ({
						sender: msg.sender,
						text: msg.text,
						timestamp: new Date(msg.timestamp),
						feedback: null
					}));
		// Scroll to bottom after loading (user should be at bottom on initial load)
				isUserNearBottom = true;
				setTimeout(() => scrollToBottom(), 100);
				} else {
					// Empty history, show welcome message
					messages = [{ sender: 'ai', text: 'Hi! How can I help you? Ask me about shipping, returns, or payments.', timestamp: new Date(), feedback: null }];
				}
			} else {
				// Session not found or error, start fresh
				messages = [{ sender: 'ai', text: 'Hi! How can I help you? Ask me about shipping, returns, or payments.', timestamp: new Date(), feedback: null }];
			}
		} catch (error) {
			console.error('Error loading chat history:', error);
			// On error, start fresh
			messages = [{ sender: 'ai', text: 'Hi! How can I help you? Ask me about shipping, returns, or payments.', timestamp: new Date(), feedback: null }];
		} finally {
			loadingHistory = false;
		}
	}

	function scrollToBottom() {
		if (messagesContainer && isUserNearBottom) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	async function sendMessage() {
		if (!input.trim() || loading) return;

		const userMessage = input.trim();
		input = '';
		loading = true;

		// Add user message to UI immediately
		messages = [...messages, { sender: 'user', text: userMessage, timestamp: new Date(), feedback: null }];

		try {
			const response = await fetch(`${API_URL}/chat/message`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: userMessage,
					sessionId: sessionId
				})
			});

			if (!response.ok) {
				throw new Error('Failed to get response');
			}

			const data = await response.json();
			
			// Update session ID and store it
			if (data.sessionId) {
				sessionId = data.sessionId;
				localStorage.setItem('chatSessionId', sessionId);
			}

			// Add AI response
			messages = [...messages, { sender: 'ai', text: data.reply, timestamp: new Date(), feedback: null }];
			// Scroll to bottom after new message (only if user is near bottom)
			setTimeout(() => scrollToBottom(), 100);
		} catch (error) {
			console.error('Error sending message:', error);
			messages = [
				...messages,
				{
					sender: 'ai',
					text: "Sorry, I'm having trouble right now. Please try again.",
					timestamp: new Date(),
					feedback: null
				}
			];
		} finally {
			loading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function formatTimestamp(timestamp: Date | undefined): string {
		if (!timestamp) return '';
		
		const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		
		// If less than 1 minute ago, show "just now"
		if (diffMins < 1) return 'just now';
		
		// If today, show time only (e.g., "2:30 PM")
		if (date.toDateString() === now.toDateString()) {
			return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
		}
		
		// If yesterday, show "Yesterday 2:30 PM"
		const yesterday = new Date(now);
		yesterday.setDate(yesterday.getDate() - 1);
		if (date.toDateString() === yesterday.toDateString()) {
			return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
		}
		
		// Otherwise show date and time (e.g., "Dec 15, 2:30 PM")
		return date.toLocaleString('en-US', { 
			month: 'short', 
			day: 'numeric', 
			hour: 'numeric', 
			minute: '2-digit' 
		});
	}
</script>

<div class="chat-container" class:dark={darkMode}>
	<div class="chat-header">
		<h1>AI Live Chat</h1>
		<button class="theme-toggle" on:click={toggleDarkMode} aria-label="Toggle dark mode">
			{darkMode ? '☀️' : '🌙'}
		</button>
	</div>

	<div class="messages-container" bind:this={messagesContainer}>
		{#if loadingHistory}
			<div class="message message-ai">
				<div class="message-bubble loading">
					Loading chat history...
				</div>
			</div>
		{:else}
			{#if messages.length === 0}
				<div class="empty-state">
					<div class="empty-state-content">
						<h2>Welcome! 👋</h2>
						<p>Ask me about:</p>
						<ul class="suggestion-list">
							<li on:click={() => { input = 'What is your shipping policy?'; }}>Shipping policies</li>
							<li on:click={() => { input = 'What is your return policy?'; }}>Returns and refunds</li>
							<li on:click={() => { input = 'What payment methods do you accept?'; }}>Payment methods</li>
							<li on:click={() => { input = 'Tell me about your products'; }}>Product information</li>
						</ul>
					</div>
				</div>
			{:else}
				{#each messages as message, index (message.timestamp?.getTime() || message.text)}
				<div class="message message-{message.sender}">
					<div class="message-wrapper">
						<div class="message-bubble">
							{message.text}
						</div>
						<div class="message-footer">
							{#if message.timestamp}
								<div class="message-timestamp">
									{formatTimestamp(message.timestamp)}
								</div>
							{/if}
							{#if message.sender === 'ai' && !loading}
								<div class="message-feedback">
									<button 
										class="feedback-button" 
										class:active={message.feedback === 'positive'}
										on:click={() => handleFeedback(index, 'positive')}
										aria-label="Helpful"
										title="This was helpful"
									>
										👍
									</button>
									<button 
										class="feedback-button" 
										class:active={message.feedback === 'negative'}
										on:click={() => handleFeedback(index, 'negative')}
										aria-label="Not helpful"
										title="This was not helpful"
									>
										👎
									</button>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
			{/if}
		{/if}

		{#if loading}
			<div class="message message-ai">
				<div class="message-bubble loading">
					Agent is typing...
				</div>
			</div>
		{/if}
	</div>

	<div class="input-container">
		<input
			type="text"
			class="message-input"
			placeholder="Type your message..."
			bind:value={input}
			on:keypress={handleKeyPress}
			disabled={loading}
		/>
		<button class="send-button" on:click={sendMessage} disabled={loading || !input.trim()}>
			Send
		</button>
	</div>
</div>

<style>
	.chat-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		max-width: 800px;
		margin: 0 auto;
		background: #f5f5f5;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
			sans-serif;
	}

	.chat-header {
		background: #2c3e50;
		color: white;
		padding: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.chat-header h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		flex: 1;
		text-align: center;
	}

	.theme-toggle {
		background: transparent;
		border: 2px solid rgba(255, 255, 255, 0.3);
		color: white;
		border-radius: 0.5rem;
		padding: 0.5rem 0.75rem;
		cursor: pointer;
		font-size: 1.2rem;
		transition: all 0.2s;
	}

	.theme-toggle:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.5);
	}

	.messages-container {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.message {
		display: flex;
		width: 100%;
	}

	.message-user {
		justify-content: flex-end;
	}

	.message-ai {
		justify-content: flex-start;
	}

	.message-bubble {
		padding: 0.75rem 1rem;
		border-radius: 1rem;
		word-wrap: break-word;
	}

	.message-wrapper {
		display: flex;
		flex-direction: column;
		max-width: 70%;
	}

	.message-user .message-wrapper {
		align-items: flex-end;
	}

	.message-ai .message-wrapper {
		align-items: flex-start;
	}

	.message-user .message-bubble {
		background: #3498db;
		color: white;
		border-bottom-right-radius: 0.25rem;
	}

	.message-ai .message-bubble {
		background: white;
		color: #333;
		border-bottom-left-radius: 0.25rem;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.message-footer {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.25rem;
		padding: 0 0.5rem;
	}

	.message-timestamp {
		font-size: 0.75rem;
		color: #999;
	}

	.message-feedback {
		display: flex;
		gap: 0.25rem;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.message:hover .message-feedback {
		opacity: 1;
	}

	.feedback-button {
		background: transparent;
		border: 1px solid #ddd;
		border-radius: 0.25rem;
		padding: 0.25rem 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.2s;
		color: #666;
	}

	.feedback-button:hover {
		background: #f0f0f0;
		border-color: #3498db;
	}

	.feedback-button.active {
		background: #e3f2fd;
		border-color: #3498db;
		color: #3498db;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 2rem;
	}

	.empty-state-content {
		text-align: center;
		color: #666;
	}

	.empty-state-content h2 {
		margin: 0 0 1rem 0;
		color: #333;
		font-size: 1.5rem;
	}

	.empty-state-content p {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
	}

	.suggestion-list {
		list-style: none;
		padding: 0;
		margin: 1rem 0 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.suggestion-list li {
		padding: 0.5rem 1rem;
		background: #e8f4f8;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background 0.2s;
		font-size: 0.9rem;
	}

	.suggestion-list li:hover {
		background: #d1e7dd;
	}

	.suggestion-list li:active {
		transform: scale(0.98);
	}

	.message-bubble.loading {
		opacity: 0.7;
		font-style: italic;
	}

	.input-container {
		display: flex;
		gap: 0.5rem;
		padding: 1rem;
		background: white;
		border-top: 1px solid #e0e0e0;
	}

	.message-input {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 0.5rem;
		font-size: 1rem;
		outline: none;
	}

	.message-input:focus {
		border-color: #3498db;
	}

	.message-input:disabled {
		background: #f5f5f5;
		cursor: not-allowed;
	}

	.send-button {
		padding: 0.75rem 1.5rem;
		background: #3498db;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.send-button:hover:not(:disabled) {
		background: #2980b9;
	}

	.send-button:disabled {
		background: #bdc3c7;
		cursor: not-allowed;
	}

	/* Dark mode styles */
	:global(.dark-mode) .chat-container {
		background: #1a1a1a;
	}

	:global(.dark-mode) .messages-container {
		background: #1a1a1a;
	}

	:global(.dark-mode) .message-ai .message-bubble {
		background: #2d2d2d;
		color: #e0e0e0;
	}

	:global(.dark-mode) .message-user .message-bubble {
		background: #3498db;
		color: white;
	}

	:global(.dark-mode) .input-container {
		background: #2d2d2d;
		border-top-color: #404040;
	}

	:global(.dark-mode) .message-input {
		background: #1a1a1a;
		border-color: #404040;
		color: #e0e0e0;
	}

	:global(.dark-mode) .message-input:focus {
		border-color: #3498db;
	}

	:global(.dark-mode) .message-timestamp {
		color: #999;
	}

	:global(.dark-mode) .empty-state-content {
		color: #999;
	}

	:global(.dark-mode) .empty-state-content h2 {
		color: #e0e0e0;
	}

	:global(.dark-mode) .suggestion-list li {
		background: #2d2d2d;
		color: #e0e0e0;
	}

	:global(.dark-mode) .suggestion-list li:hover {
		background: #404040;
	}

	:global(.dark-mode) .feedback-button {
		border-color: #404040;
		color: #999;
	}

	:global(.dark-mode) .feedback-button:hover {
		background: #404040;
		border-color: #3498db;
	}
</style>

