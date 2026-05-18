import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, 
  Image, Keyboard
} from 'react-native';
import { AuthContext, API_URL } from '../context/AuthContext';
import { Send, ChevronLeft, MessageSquare, AlertCircle } from 'lucide-react-native';
import axios from 'axios';

const ChatScreen = ({ navigation }) => {
  const { workerInfo } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  // Fetch messages thread
  const fetchMessages = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/messages/worker/${workerInfo.id}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Poll for messages in background every 4 seconds
  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when messages load/update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!text.trim()) return;
    
    const messageText = text;
    setText('');
    setSending(true);
    Keyboard.dismiss();

    try {
      const payload = {
        senderType: 'Worker',
        workerId: workerInfo.id,
        senderName: `${workerInfo.firstName} ${workerInfo.lastName}`,
        text: messageText
      };

      const response = await axios.post(`${API_URL}/messages`, payload);
      
      // Instantly append local message for ultra-snappy feedback loop
      setMessages(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessageBubble = ({ item }) => {
    const isMe = item.senderType === 'Worker';
    
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AD</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.theirTimestamp]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Chat Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={24} color="#0A5C43" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Support & Admin Chat</Text>
            <View style={styles.statusIndicatorRow}>
              <View style={styles.activeDot} />
              <Text style={styles.statusText}>Cleaniq Office Support</Text>
            </View>
          </View>
        </View>

        {/* Keyboard Avoiding Container containing Chat Body & Input */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 110}
        >
          {/* Chat Body */}
          <View style={styles.chatBody}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0A5C43" />
                <Text style={styles.loadingText}>Syncing Support Thread...</Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item._id || String(Math.random())}
                renderItem={renderMessageBubble}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <MessageSquare size={50} color="#CBD5E1" style={{ marginBottom: 16 }} />
                    <Text style={styles.emptyTitle}>Direct Line to Admin</Text>
                    <Text style={styles.emptyText}>
                      Need assistance or have questions about a booking? Message the office directly here.
                    </Text>
                  </View>
                }
              />
            )}
          </View>

          {/* Chat Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message..."
              placeholderTextColor="#94A3B8"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !text.trim() && styles.disabledSendButton]} 
              onPress={handleSendMessage}
              disabled={!text.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    height: 70, 
    backgroundColor: '#FFFFFF', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 12
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  statusIndicatorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },
  statusText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  chatBody: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: '600' },
  messageList: { paddingHorizontal: 16, paddingVertical: 20, gap: 12 },
  messageWrapper: { flexDirection: 'row', marginBottom: 12, maxWidth: '80%' },
  myMessageWrapper: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  theirMessageWrapper: { alignSelf: 'flex-start', justifyContent: 'flex-start' },
  avatar: { 
    width: 32, 
    height: 32, 
    borderRadius: 10, 
    backgroundColor: '#E2E8F0', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 8,
    alignSelf: 'flex-end'
  },
  avatarText: { fontSize: 11, fontWeight: '900', color: '#64748B' },
  bubble: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 1 },
  myBubble: { backgroundColor: '#0A5C43', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  messageText: { fontSize: 14, lineHeight: 20 },
  myMessageText: { color: '#FFFFFF', fontWeight: '600' },
  theirMessageText: { color: '#334155', fontWeight: '500' },
  timestamp: { fontSize: 9, marginTop: 4, alignSelf: 'flex-end', fontWeight: '500' },
  myTimestamp: { color: '#A5F3FC', opacity: 0.8 },
  theirTimestamp: { color: '#94A3B8' },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  textInput: { 
    flex: 1, 
    minHeight: 45, 
    maxHeight: 100, 
    backgroundColor: '#F8FAFC', 
    borderRadius: 22, 
    paddingHorizontal: 18, 
    paddingVertical: 10,
    fontSize: 14, 
    color: '#334155',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10
  },
  sendButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#0A5C43', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  disabledSendButton: { backgroundColor: '#E2E8F0' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#475569', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 18, fontWeight: '500' }
});

export default ChatScreen;
