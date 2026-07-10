import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Send, Image, Smile, DollarSign, Phone, MoreVertical, Paperclip } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/modals/Modal';
import { messagesApi } from '../lib/api';
import { toConversation, toMessage } from '../lib/mappers';
import { useAuth } from '../contexts/AuthContext';
import type { Conversation, Message } from '../types';

export function MessagesPage() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState('');
  const [convSearch, setConvSearch] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [counterFor, setCounterFor] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const selectedId = selectedConversation?.id ?? null;

  const loadConversations = useCallback(async (autoSelect: boolean) => {
    try {
      const r = await messagesApi.getConversations();
      const convs = r.data.map(toConversation);
      setConversations(convs);
      if (autoSelect) {
        setSelectedConversation((cur) => cur ?? convs[0] ?? null);
      }
    } catch { /* ignore */ }
  }, []);

  // Load the conversation list, then poll it for new messages / unread changes.
  useEffect(() => {
    loadConversations(true);
    const t = setInterval(() => loadConversations(false), 6000);
    return () => clearInterval(t);
  }, [loadConversations]);

  // Load + poll the open conversation's messages. Only update state when the
  // message set actually changed so the view doesn't jump while idle.
  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    let cancelled = false;
    const fetchMessages = async () => {
      try {
        const r = await messagesApi.getMessages(selectedId);
        if (cancelled) return;
        const next = r.data.messages.map(toMessage);
        setMessages((prev) => {
          const sameLength = prev.length === next.length;
          const sameLast = prev[prev.length - 1]?.id === next[next.length - 1]?.id;
          return sameLength && sameLast ? prev : next;
        });
      } catch { /* ignore */ }
    };
    fetchMessages();
    const t = setInterval(fetchMessages, 4000);
    return () => { cancelled = true; clearInterval(t); };
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation) return;
    const content = message;
    setMessage('');
    try {
      const res = await messagesApi.send(selectedConversation.id, content);
      setMessages((prev) => [...prev, toMessage(res.data)]);
    } catch { /* ignore */ }
  };

  const handleSendOffer = async () => {
    if (!selectedConversation) return;
    const amount = parseInt(offerAmount, 10);
    if (!amount || amount <= 0) return;
    const content = `I'd like to offer NPR ${amount.toLocaleString()} for this item.`;
    setShowOfferModal(false);
    setOfferAmount('');
    try {
      const res = await messagesApi.send(selectedConversation.id, content, 'offer', amount);
      setMessages((prev) => [...prev, toMessage(res.data)]);
    } catch { /* ignore */ }
  };

  const handleRespondToOffer = async (
    messageId: string,
    action: 'accept' | 'decline' | 'counter',
    amount?: number,
  ) => {
    if (!selectedConversation) return;
    setRespondingId(messageId);
    try {
      await messagesApi.respondToOffer(selectedConversation.id, messageId, action, amount);
      // Refresh this thread and the conversation list (agreed price lives on
      // the conversation), then re-sync the open conversation.
      const [msgRes, convRes] = await Promise.all([
        messagesApi.getMessages(selectedConversation.id),
        messagesApi.getConversations(),
      ]);
      setMessages(msgRes.data.messages.map(toMessage));
      const convs = convRes.data.map(toConversation);
      setConversations(convs);
      const fresh = convs.find((c) => c.id === selectedConversation.id);
      if (fresh) setSelectedConversation(fresh);
    } catch { /* ignore */ }
    finally { setRespondingId(null); }
  };

  const handleSubmitCounter = () => {
    const amount = parseInt(counterAmount, 10);
    if (!counterFor || !amount || amount <= 0) return;
    const messageId = counterFor;
    setCounterFor(null);
    setCounterAmount('');
    handleRespondToOffer(messageId, 'counter', amount);
  };

  const otherParticipant = (conv: Conversation) =>
    conv.participants.find((p) => p.id !== authUser?.id) ?? conv.participants[0];

  const listingSellerId = selectedConversation?.listing?.seller?.id;
  const iAmBuyer = !!listingSellerId && authUser?.id !== listingSellerId;
  const agreedPrice = selectedConversation?.agreedPrice;

  const filteredConversations = conversations.filter((conv) => {
    if (!convSearch.trim()) return true;
    const q = convSearch.toLowerCase();
    const name = otherParticipant(conv)?.name?.toLowerCase() ?? '';
    const last = conv.lastMessage?.content?.toLowerCase() ?? '';
    const item = conv.listing?.title?.toLowerCase() ?? '';
    return name.includes(q) || last.includes(q) || item.includes(q);
  });

  return (
    <div className="min-h-screen flex flex-col bg-thrift-bg">
      <Navbar />
      <div className="flex flex-1 min-h-0">
      {/* Conversations List */}
      <div className="w-80 border-r border-thrift-border bg-thrift-surface flex flex-col">
        <div className="p-4 border-b border-thrift-border">
          <h1 className="font-semibold text-thrift-text mb-4">Messages</h1>
          <Input
            placeholder="Search conversations"
            icon={<Search className="w-4 h-4" />}
            value={convSearch}
            onChange={(e) => setConvSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="p-6 text-sm text-thrift-text-secondary text-center">No conversations yet</p>
          )}
          {conversations.length > 0 && filteredConversations.length === 0 && (
            <p className="p-6 text-sm text-thrift-text-secondary text-center">No conversations match “{convSearch}”</p>
          )}
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={`w-full p-4 flex gap-3 hover:bg-thrift-bg transition-colors ${
                selectedConversation?.id === conv.id ? 'bg-thrift-bg' : ''
              }`}
            >
              <div className="relative">
                <img
                  src={otherParticipant(conv)?.avatar ?? 'https://picsum.photos/seed/user/200/200'}
                  alt={otherParticipant(conv)?.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-thrift-success rounded-full border-2 border-thrift-surface" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-thrift-text">{otherParticipant(conv)?.name}</p>
                  <span className="text-xs text-thrift-text-secondary">
                    {conv.lastMessage?.timestamp
                      ? new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </span>
                </div>
                <p className="text-sm text-thrift-text-secondary line-clamp-1">
                  {conv.lastMessage?.content ?? ''}
                </p>
                {conv.unreadCount > 0 && (
                  <span className="inline-block mt-1 text-xs bg-thrift-primary text-white px-2 py-0.5 rounded-full">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      {!selectedConversation ? (
        <div className="flex-1 flex items-center justify-center text-thrift-text-secondary">
          Select a conversation to start chatting
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-thrift-border bg-thrift-surface flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={otherParticipant(selectedConversation)?.avatar ?? 'https://picsum.photos/seed/user/200/200'}
                alt={otherParticipant(selectedConversation)?.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-thrift-text">{otherParticipant(selectedConversation)?.name}</p>
                <p className="text-xs text-thrift-success">Active now</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-thrift-text-secondary hover:text-thrift-primary transition-colors">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 text-thrift-text-secondary hover:text-thrift-primary transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Item being discussed */}
          {selectedConversation.listing && (
            <div className="px-6 py-3 bg-thrift-bg border-b border-thrift-border flex items-center gap-4">
              <img
                src={selectedConversation.listing?.images?.[0] ?? 'https://placehold.co/400x300?text=No+Image'}
                alt={selectedConversation.listing.title}
                className="w-16 h-12 rounded object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-thrift-text text-sm">{selectedConversation.listing.title}</p>
                <p className="text-thrift-primary font-semibold">NPR {selectedConversation.listing.price.toLocaleString()}</p>
              </div>
              <Link to={`/listings/${selectedConversation.listing.id}`}>
                <Button variant="outline" size="sm">View Item</Button>
              </Link>
            </div>
          )}

          {/* Agreed-price banner — buyer can check out at the negotiated price */}
          {agreedPrice != null && iAmBuyer && selectedConversation.listing && (
            <div className="px-6 py-3 bg-thrift-success/10 border-b border-thrift-success/30 flex items-center justify-between gap-4">
              <p className="text-sm text-thrift-text">
                Agreed price: <span className="font-semibold text-thrift-success">NPR {agreedPrice.toLocaleString()}</span>
              </p>
              <Button
                size="sm"
                onClick={() => navigate(`/checkout/${selectedConversation.listing!.id}`, {
                  state: { agreedPrice, conversationId: selectedConversation.id },
                })}
              >
                Buy at this price
              </Button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-thrift-bg">
            {messages.map((msg) => {
              const isMine = msg.senderId === authUser?.id;

              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <p className="text-xs text-thrift-text-secondary bg-thrift-surface border border-thrift-border rounded-full px-3 py-1 max-w-[80%] text-center">
                      {msg.content}
                    </p>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isMine ? 'order-2' : ''}`}>
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        msg.type === 'offer'
                          ? 'bg-thrift-warning/15 border border-thrift-warning text-thrift-text'
                          : isMine
                          ? 'bg-thrift-primary text-white rounded-br-md'
                          : 'bg-thrift-surface border border-thrift-border text-thrift-text rounded-bl-md'
                      }`}
                    >
                      {msg.type === 'offer' && msg.offerAmount != null && (
                        <p className="flex items-center gap-1 text-xs font-semibold text-thrift-warning mb-0.5">
                          <DollarSign className="w-3 h-3" /> Offer · NPR {msg.offerAmount.toLocaleString()}
                        </p>
                      )}
                      <p className="text-sm">{msg.content}</p>

                      {/* Offer status + response controls */}
                      {msg.type === 'offer' && (
                        <div className="mt-2 pt-2 border-t border-thrift-warning/30">
                          {msg.offerStatus === 'accepted' && (
                            <p className="text-xs font-semibold text-thrift-success">✓ Accepted</p>
                          )}
                          {msg.offerStatus === 'declined' && (
                            <p className="text-xs font-medium text-thrift-error">Declined</p>
                          )}
                          {msg.offerStatus === 'pending' && isMine && (
                            <p className="text-xs text-thrift-text-secondary">Waiting for a response…</p>
                          )}
                          {msg.offerStatus === 'pending' && !isMine && (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                loading={respondingId === msg.id}
                                onClick={() => handleRespondToOffer(msg.id, 'accept')}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={respondingId === msg.id}
                                onClick={() => handleRespondToOffer(msg.id, 'decline')}
                              >
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={respondingId === msg.id}
                                onClick={() => { setCounterFor(msg.id); setCounterAmount(''); }}
                              >
                                Counter
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className={`text-xs text-thrift-text-secondary mt-1 ${isMine ? 'text-right' : ''}`}>
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="px-6 py-4 bg-thrift-surface border-t border-thrift-border">
            <div className="flex items-center gap-3">
              <button className="p-2 text-thrift-text-secondary hover:text-thrift-primary transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              <button className="p-2 text-thrift-text-secondary hover:text-thrift-primary transition-colors">
                <Image className="w-5 h-5" />
              </button>
              <button className="p-2 text-thrift-text-secondary hover:text-thrift-primary transition-colors">
                <Smile className="w-5 h-5" />
              </button>
              <Button
                variant="outline"
                size="sm"
                icon={<DollarSign className="w-4 h-4" />}
                onClick={() => setShowOfferModal(true)}
              >
                Make Offer
              </Button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-thrift-bg border border-thrift-border rounded-full"
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="p-3 rounded-full bg-thrift-primary text-white hover:bg-thrift-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Make Offer Modal */}
      <Modal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        title="Make an Offer"
      >
        <div className="mb-4">
          <p className="text-sm text-thrift-text-secondary">Item</p>
          <p className="font-medium text-thrift-text">
            {selectedConversation?.listing?.title ?? 'Item'}
          </p>
        </div>
        <div className="mb-4">
          <p className="text-sm text-thrift-text-secondary">Current Price</p>
          <p className="font-semibold text-thrift-primary">
            {selectedConversation?.listing?.price != null
              ? `NPR ${selectedConversation.listing.price.toLocaleString()}`
              : '—'}
          </p>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-thrift-text mb-2">Your Offer (NPR)</label>
          <input
            type="number"
            value={offerAmount}
            onChange={(e) => setOfferAmount(e.target.value)}
            placeholder="Enter your offer"
            className="w-full px-4 py-2 border border-thrift-border rounded-input"
          />
        </div>
        <Button className="w-full" onClick={handleSendOffer}>
          Send Offer
        </Button>
      </Modal>

      {/* Counter Offer Modal */}
      <Modal
        isOpen={counterFor !== null}
        onClose={() => setCounterFor(null)}
        title="Counter the Offer"
      >
        <div className="mb-6">
          <label className="block text-sm font-medium text-thrift-text mb-2">Your Counter Price (NPR)</label>
          <input
            type="number"
            value={counterAmount}
            onChange={(e) => setCounterAmount(e.target.value)}
            placeholder="Enter your counter offer"
            className="w-full px-4 py-2 border border-thrift-border rounded-input"
          />
        </div>
        <Button
          className="w-full"
          disabled={!counterAmount || parseInt(counterAmount, 10) <= 0}
          onClick={handleSubmitCounter}
        >
          Send Counter Offer
        </Button>
      </Modal>
    </div>
  );
}
