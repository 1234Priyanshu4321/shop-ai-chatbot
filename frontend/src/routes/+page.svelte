<script lang="ts">
	import { onMount } from 'svelte';

	interface Message {
		sender: 'user' | 'ai';
		text: string;
		timestamp?: Date;
	}

	let messages: Message[] = [];
	let input = '';
	let loading = false;
	let loadingHistory = true;
	let sessionId: string | null = null;
	const API_URL = 'http://localhost:3001';
	let messagesContainer: HTMLDivElement;

	// Load session ID and chat history from localStorage on mount
	onMount(async () => {
		const storedSessionId = localStorage.getItem('chatSessionId');
		if (storedSessionId) {
			sessionId = storedSessionId;
			await loadChatHistory(storedSessionId);
		} else {
			// No existing session, show welcome message
			messages = [{ sender: 'ai', text: 'Hi! How can I help you?', timestamp: new Date() }];
			loadingHistory = false;
		}
	});

	async function loadChatHistory(sessionIdToLoad: string) {
		try {
			const response = await fetch(`${API_URL}/chat/history/${sessionIdToLoad}`);
			if (response.ok) {
				const data = await response.json();
				if (data.messages && data.messages.length > 0) {
					messages = data.messages.map((msg: any) => ({
						sender: msg.sender,
						text: msg.text,
						timestamp: new Date(msg.timestamp)
					}));
					// Scroll to bottom after loading
					setTimeout(() => scrollToBottom(), 100);
				} else {
					// Empty history, show welcome message
					messages = [{ sender: 'ai', text: 'Hi! How can I help you?', timestamp: new Date() }];
				}
			} else {
				// Session not found or error, start fresh
				messages = [{ sender: 'ai', text: 'Hi! How can I help you?', timestamp: new Date() }];
			}
		} catch (error) {
			console.error('Error loading chat history:', error);
			// On error, start fresh
			messages = [{ sender: 'ai', text: 'Hi! How can I help you?', timestamp: new Date() }];
		} finally {
			loadingHistory = false;
		}
	}

	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	async function sendMessage() {
		if (!input.trim() || loading) return;

		const userMessage = input.trim();
		input = '';
		loading = true;

		// Add user message to UI immediately
		messages = [...messages, { sender: 'user', text: userMessage, timestamp: new Date() }];

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
			messages = [...messages, { sender: 'ai', text: data.reply, timestamp: new Date() }];
			// Scroll to bottom after new message
			setTimeout(() => scrollToBottom(), 100);
		} catch (error) {
			console.error('Error sending message:', error);
			messages = [
				...messages,
				{
					sender: 'ai',
					text: "Sorry, I'm having trouble right now. Please try again.",
					timestamp: new Date()
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

<div class="chat-container">
	<div class="chat-header">
		<h1>AI Live Chat</h1>
	</div>

	<div class="messages-container" bind:this={messagesContainer}>
		{#if loadingHistory}
			<div class="message message-ai">
				<div class="message-bubble loading">
					Loading chat history...
				</div>
			</div>
		{:else}
			{#each messages as message (message.timestamp?.getTime() || message.text)}
			<div class="message message-{message.sender}">
				<div class="message-wrapper">
					<div class="message-bubble">
						{message.text}
					</div>
					{#if message.timestamp}
						<div class="message-timestamp">
							{formatTimestamp(message.timestamp)}
						</div>
					{/if}
				</div>
			</div>
		{/each}
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
		text-align: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.chat-header h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
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

	.message-timestamp {
		font-size: 0.75rem;
		color: #999;
		margin-top: 0.25rem;
		padding: 0 0.5rem;
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
</style>

