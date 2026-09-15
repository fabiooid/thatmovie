'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { ArrowUp, Film, Square } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Markdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  CHAT_RESOURCE_ID,
  createGuestId,
  getGuestId,
  saveGuestId,
} from '@/lib/guest';

const EXAMPLES = [
  'A kid finds a game that starts happening in real life',
  'Someone lives the same day over and over',
  'People are living in a fake world and one person wakes up',
];

const getMessageText = (message: UIMessage) =>
  message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('')
    .trim();

const isLookingUpMovies = (message: UIMessage) =>
  message.role === 'assistant' &&
  !getMessageText(message) &&
  message.parts.some((part) => part.type.startsWith('tool-'));

export function MovieChat() {
  const [guestId, setGuestId] = useState('');

  useEffect(() => {
    setGuestId(getGuestId());
  }, []);

  const startNewChat = () => {
    const id = createGuestId();
    saveGuestId(id);
    setGuestId(id);
  };

  if (!guestId) {
    return <ChatShell />;
  }

  return (
    <ChatSession
      key={guestId}
      guestId={guestId}
      onNewChat={startNewChat}
    />
  );
}

function ChatShell({ children }: { children?: ReactNode }) {
  return (
    <div className="mx-auto flex h-svh w-full max-w-2xl flex-col px-4">
      {children}
    </div>
  );
}

function ChatSession({
  guestId,
  onNewChat,
}: {
  guestId: string;
  onNewChat: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest({ messages }) {
          return {
            body: {
              messages: [messages.at(-1)],
              memory: {
                thread: guestId,
                resource: CHAT_RESOURCE_ID,
              },
            },
          };
        },
      }),
    [guestId],
  );

  const { messages, sendMessage, setMessages, status, error, clearError, stop } =
    useChat({
      id: guestId,
      transport,
    });

  const isBusy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/chat?thread=${guestId}`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setMessages(data);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [guestId, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const send = (text: string) => {
    const next = text.trim();

    if (!next || isBusy) {
      return;
    }

    clearError();
    sendMessage({ text: next });
    setInput('');
  };

  return (
    <ChatShell>
      <header className="flex items-start justify-between gap-4 py-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Film className="size-4 text-muted-foreground" />
            <p className="font-[family-name:var(--font-serif)] text-xl leading-none tracking-tight">
              That Movie
            </p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Describe a movie you remember. We will try to find it.
          </p>
        </div>
        {messages.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={onNewChat}>
            New chat
          </Button>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-center gap-3 pb-8">
            <p className="text-sm text-muted-foreground">Try something like:</p>
            <div className="flex flex-col gap-2">
              {EXAMPLES.map((example) => (
                <Button
                  key={example}
                  type="button"
                  variant="outline"
                  className="h-auto justify-start whitespace-normal px-3 py-2 text-left text-sm font-normal"
                  onClick={() => send(example)}
                  disabled={isBusy}
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-4">
            {messages.map((message) => {
              const text = getMessageText(message);

              if (message.role === 'user') {
                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
                      {text}
                    </div>
                  </div>
                );
              }

              if (isLookingUpMovies(message)) {
                return (
                  <div key={message.id} className="flex justify-start">
                    <p className="text-sm text-muted-foreground">
                      Looking through movies...
                    </p>
                  </div>
                );
              }

              if (!text) {
                return null;
              }

              return (
                <div key={message.id} className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-sm leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-4 [&_ol:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4 [&_ul:last-child]:mb-0 [&_strong]:font-medium">
                    <Markdown>{text}</Markdown>
                  </div>
                </div>
              );
            })}
            {status === 'submitted' && messages.at(-1)?.role === 'user' ? (
              <p className="text-sm text-muted-foreground">
                Looking through movies...
              </p>
            ) : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form
        className="py-4"
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
      >
        {error ? (
          <p className="mb-2 text-sm text-destructive">
            Something went wrong. Try again.
          </p>
        ) : null}
        <div className="flex items-end gap-2 rounded-2xl border bg-card p-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                send(input);
              }
            }}
            placeholder="Describe the movie..."
            disabled={isBusy}
            rows={1}
            className="min-h-10 max-h-36 resize-none border-0 bg-transparent px-3 py-2 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          {isBusy ? (
            <Button
              type="button"
              size="icon"
              className="rounded-full"
              onClick={() => stop()}
              aria-label="Stop"
            >
              <Square data-icon="inline-start" className="size-3 fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              className="rounded-full"
              disabled={!input.trim()}
              aria-label="Send"
            >
              <ArrowUp data-icon="inline-start" />
            </Button>
          )}
        </div>
      </form>
    </ChatShell>
  );
}
