import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html'
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer?: ElementRef;

  show = false;
  input = '';
  loading = false;
  messages: Message[] = [];
  private shouldScrollToBottom = false;

  constructor(private http: HttpClient) {}

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  toggle() {
    this.show = !this.show;
    if (this.show && this.messages.length === 0) {
      // Add welcome message
      this.addAssistantMessage(
        "Hello! I'm your aviation AI assistant. I can help you with flight regulations, medical requirements, license information, and more. How can I assist you today?"
      );
    }
  }

  sendQuickMessage(message: string) {
    this.input = message;
    this.send();
  }

  send() {
    if (!this.input.trim() || this.loading) return;

    const userMessage = this.input.trim();
    this.messages.push({
      role: 'user',
      text: userMessage,
      timestamp: this.getTimestamp()
    });
    this.shouldScrollToBottom = true;
    this.loading = true;
    this.input = '';

    this.http.post<any>('/api/chat', { message: userMessage }).subscribe({
      next: (res) => {
        this.addAssistantMessage(res.answer);
        this.loading = false;
      },
      error: (err) => {
        console.error('Chat error:', err);
        this.addAssistantMessage(
          '⚠️ I apologize, but I\'m having trouble connecting to the AI service. Please try again in a moment.'
        );
        this.loading = false;
      }
    });
  }

  private addAssistantMessage(text: string) {
    this.messages.push({
      role: 'assistant',
      text: text,
      timestamp: this.getTimestamp()
    });
    this.shouldScrollToBottom = true;
  }

  private scrollToBottom() {
    if (this.messageContainer) {
      try {
        this.messageContainer.nativeElement.scrollTop = 
          this.messageContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Scroll error:', err);
      }
    }
  }

  private getTimestamp(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
