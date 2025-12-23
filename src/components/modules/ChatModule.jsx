import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCouple } from '../../context/CoupleContext';

const ChatModule = () => {
    const { coupleData, session } = useCouple();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (coupleData?.couple?.id) {
            fetchMessages();

            // Subscribe to new messages
            const channel = supabase
                .channel(`room:${coupleData.couple.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `couple_id=eq.${coupleData.couple.id}`
                }, (payload) => {
                    console.log('New message received:', payload);
                    setMessages(prev => [...prev, payload.new]);
                })
                .subscribe((status) => {
                    console.log('Subscription status:', status);
                });

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [coupleData?.couple?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('couple_id', coupleData.couple.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !coupleData?.couple?.id || !session?.user?.id) return;

        const content = newMessage.trim();
        setNewMessage(''); // Optimistic clear

        try {
            const { error } = await supabase
                .from('messages')
                .insert([{
                    couple_id: coupleData.couple.id,
                    sender_id: session.user.id,
                    content: content
                }]);

            if (error) throw error;
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Erreur lors de l\'envoi');
            setNewMessage(content); // Restore on error
        }
    };

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const containerRef = useRef(null);

    // ...

    const scrollToBottom = () => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    // ...

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div ref={containerRef} style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '1rem 0' }}>
                        Démarrez la conversation ! ❤️
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.sender_id === session?.user?.id;
                    const senderData = isMe
                        ? (coupleData.personA.id === session.user.id ? coupleData.personA : coupleData.personB)
                        : (coupleData.personA.id === session.user.id ? coupleData.personB : coupleData.personA);

                    return (
                        <div
                            key={msg.id}
                            style={{
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                maxWidth: '80%',
                                display: 'flex',
                                alignItems: 'flex-end',
                                gap: '0.5rem',
                                flexDirection: isMe ? 'row' : 'row-reverse'
                            }}
                        >
                            <div style={{
                                padding: '0.75rem',
                                borderRadius: '16px',
                                borderBottomRightRadius: isMe ? '4px' : '16px',
                                borderBottomLeftRadius: isMe ? '16px' : '4px',
                                backgroundColor: isMe ? 'var(--color-primary)' : 'var(--color-bg)',
                                color: isMe ? 'white' : 'var(--color-text)',
                                fontSize: '0.95rem',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                                {msg.content}
                                <div style={{
                                    fontSize: '0.65rem',
                                    opacity: 0.7,
                                    marginTop: '0.25rem',
                                    textAlign: 'right'
                                }}>
                                    {formatTime(msg.created_at)}
                                </div>
                            </div>
                            <div
                                style={{
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    backgroundImage: senderData.photo ? `url(${senderData.photo})` : 'none',
                                    backgroundColor: senderData.color,
                                    backgroundSize: 'cover',
                                    flexShrink: 0
                                }}
                                title={senderData.nickname || senderData.name}
                            />
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div style={{ marginTop: '1rem' }}>
                <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Écrire un message..."
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '20px', border: '1px solid var(--color-border)', outline: 'none' }}
                    />
                    <button
                        type="submit"
                        style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'var(--color-primary)', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatModule;
