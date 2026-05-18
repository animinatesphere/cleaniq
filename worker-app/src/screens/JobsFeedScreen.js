import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Image, SafeAreaView, Platform,
  Alert
} from 'react-native';
import { AuthContext, API_URL } from '../context/AuthContext';
import { 
  MapPin, Calendar, Clock, ChevronRight, LogOut, 
  Briefcase, CheckCircle, User, Phone, MessageSquare, 
  AlertCircle, Play, Check, Trash2 
} from 'lucide-react-native';
import axios from 'axios';

const JobsFeedScreen = ({ navigation }) => {
  const { workerInfo, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'myjobs'
  
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // ID of the job being accepted
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchJobs = async () => {
    try {
      // Fetch both available jobs and my jobs in parallel
      const [availableRes, myJobsRes] = await Promise.all([
        axios.get(`${API_URL}/workers/jobs`),
        axios.get(`${API_URL}/workers/jobs/my-jobs/${workerInfo.id}`)
      ]);
      
      setAvailableJobs(availableRes.data);
      setMyJobs(myJobsRes.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (workerInfo?.id) {
      fetchJobs();
    }
  }, [workerInfo]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const handleAcceptJob = async (jobId) => {
    Alert.alert(
      "Accept Job",
      "Are you sure you want to accept this job?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Accept", 
          style: "default",
          onPress: async () => {
            setActionLoading(jobId);
            try {
              const response = await axios.post(`${API_URL}/workers/jobs/${jobId}/accept`, {
                workerId: workerInfo.id,
                workerName: `${workerInfo.firstName} ${workerInfo.lastName}`
              });
              
              if (response.data.booking) {
                // Instantly remove from available and add to myJobs
                setAvailableJobs(prev => prev.filter(j => j._id !== jobId && j.bookingId !== jobId));
                setMyJobs(prev => [response.data.booking, ...prev]);
                
                // Switch to my jobs tab to show them their new job
                setActiveTab('myjobs');
              }
            } catch (error) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to accept job');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const handleCancelJob = async (jobId) => {
    Alert.alert(
      "Cancel Job Acceptance",
      "Are you sure you want to cancel this job? It will be released back for other workers to accept.",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            setActionLoading(jobId);
            try {
              await axios.post(`${API_URL}/workers/jobs/${jobId}/cancel`);
              setMyJobs(prev => prev.filter(j => j._id !== jobId));
              fetchJobs();
              Alert.alert("Cancelled", "Your acceptance of this job has been cancelled.");
            } catch (error) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to cancel job');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const handleArriveJob = async (jobId) => {
    setActionLoading(jobId);
    try {
      const response = await axios.post(`${API_URL}/workers/jobs/${jobId}/arrive`);
      if (response.data.booking) {
        setMyJobs(prev => prev.map(j => j._id === jobId ? response.data.booking : j));
        Alert.alert("Arrived!", "Status updated. You can now tap Start Cleaning when ready.");
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update arrival status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartJob = async (jobId) => {
    setActionLoading(jobId);
    try {
      const response = await axios.post(`${API_URL}/workers/jobs/${jobId}/start`);
      if (response.data.booking) {
        setMyJobs(prev => prev.map(j => j._id === jobId ? response.data.booking : j));
        Alert.alert("Job Started!", "The active cleaning countdown timer is now running.");
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to start clean');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteJob = async (jobId) => {
    Alert.alert(
      "Finish Clean",
      "Are you sure you want to mark this job as completed?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Finished", 
          onPress: async () => {
            setActionLoading(jobId);
            try {
              const response = await axios.post(`${API_URL}/workers/jobs/${jobId}/complete`);
              if (response.data.booking) {
                setMyJobs(prev => prev.map(j => j._id === jobId ? response.data.booking : j));
                Alert.alert("Great Work!", "Job completed. Admin has been notified.");
              }
            } catch (error) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to complete job');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const renderCountdown = (job) => {
    if (!job.jobStartTime) return null;
    
    // duration in details, e.g. 2 hours.
    const durationHours = parseFloat(job.details?.duration) || 2;
    const durationMs = durationHours * 60 * 60 * 1000;
    const startTimeMs = new Date(job.jobStartTime).getTime();
    const endTimeMs = startTimeMs + durationMs;
    const nowMs = new Date().getTime();
    const remainingMs = endTimeMs - nowMs;
    
    if (remainingMs <= 0) {
      return (
        <View style={styles.timerContainerFinished}>
          <AlertCircle size={16} color="#EF4444" />
          <Text style={styles.timerTextFinished}>Time Finished - Tap Done to Complete</Text>
        </View>
      );
    }
    
    const totalMinutes = Math.floor(remainingMs / 1000 / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const progressPercent = Math.max(0, Math.min(100, (remainingMs / durationMs) * 100));
    
    return (
      <View style={styles.timerWrapper}>
        <View style={styles.timerHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock size={16} color="#0A5C43" />
            <Text style={styles.timerTitle}>Active Timer</Text>
          </View>
          <Text style={styles.timerCount}>{hours}h {minutes}m left</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Anytime';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const renderAvailableJobCard = ({ item }) => (
    <View style={styles.jobCard}>
      <View style={styles.cardHeader}>
        <View style={styles.serviceBadge}>
          <Text style={styles.serviceText}>{item.service}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Calendar size={16} color="#64748B" />
          <Text style={styles.infoText}>{formatDate(item.schedule?.date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Clock size={16} color="#64748B" />
          <Text style={styles.infoText}>{item.schedule?.timeSlot || 'Flexible'}</Text>
        </View>
        <View style={styles.infoRow}>
          <MapPin size={16} color="#64748B" />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.property?.postcode || item.property?.city || item.region || 'Location summary'}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.acceptButton}
        onPress={() => handleAcceptJob(item._id || item.bookingId)}
        disabled={actionLoading === (item._id || item.bookingId)}
      >
        {actionLoading === (item._id || item.bookingId) ? (
          <ActivityIndicator color="#0A5C43" size="small" />
        ) : (
          <>
            <Text style={styles.acceptButtonText}>Accept Job</Text>
            <ChevronRight size={18} color="#0A5C43" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderMyJobCard = ({ item }) => {
    const isAssigned = item.status === 'Assigned' || !item.status;
    const isArrived = item.status === 'Arrived';
    const isCleaning = item.status === 'Cleaning';
    const isCompleted = item.status === 'Completed';

    return (
      <View style={[styles.jobCard, { borderColor: '#0A5C43', borderWidth: 1 }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.serviceBadge, { backgroundColor: '#E6F4F1' }]}>
            <Text style={[styles.serviceText, { color: '#0A5C43' }]}>{item.service}</Text>
          </View>
          <View style={[
            styles.assignedBadge, 
            isArrived && { backgroundColor: '#FEF3C7' },
            isCleaning && { backgroundColor: '#DBEAFE' },
            isCompleted && { backgroundColor: '#D1FAE5' }
          ]}>
            {isCompleted ? (
              <CheckCircle size={14} color="#10B981" />
            ) : (
              <CheckCircle size={14} color={isArrived ? '#D97706' : isCleaning ? '#2563EB' : '#0A5C43'} />
            )}
            <Text style={[
              styles.assignedText, 
              isArrived && { color: '#D97706' },
              isCleaning && { color: '#2563EB' },
              isCompleted && { color: '#10B981' }
            ]}>
              {item.status || 'Assigned'}
            </Text>
          </View>
        </View>
        
        {/* Customer Details Revealed */}
        <View style={styles.customerDetailsBox}>
          <View style={styles.infoRow}>
            <User size={16} color="#0A5C43" />
            <Text style={styles.customerNameText}>
              {item.customer?.firstName} {item.customer?.lastName}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Phone size={16} color="#64748B" />
            <Text style={styles.infoText}>{item.customer?.phone || 'No phone provided'}</Text>
          </View>
          <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
            <MapPin size={16} color="#64748B" style={{ marginTop: 2 }} />
            <Text style={styles.fullAddressText}>
              {item.details?.address || 'Address not provided'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Calendar size={16} color="#64748B" />
            <Text style={styles.infoText}>{formatDate(item.schedule?.date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={16} color="#64748B" />
            <Text style={styles.infoText}>{item.schedule?.timeSlot || 'Flexible'} ({item.details?.duration || 2} hrs booked)</Text>
          </View>
          
          {/* Countdown timer for active jobs */}
          {isCleaning && renderCountdown(item)}
        </View>

        <View style={styles.myJobFooter}>
          {isAssigned && (
            <View style={{ width: '100%', gap: 10, flexDirection: 'row' }}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelBtn, { flex: 1 }]}
                onPress={() => handleCancelJob(item._id)}
                disabled={actionLoading === item._id}
              >
                <Trash2 size={16} color="#EF4444" />
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryBtn, { flex: 1.5 }]}
                onPress={() => handleArriveJob(item._id)}
                disabled={actionLoading === item._id}
              >
                <MapPin size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Reach Customer</Text>
              </TouchableOpacity>
            </View>
          )}

          {isArrived && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryBtn, { width: '100%' }]}
              onPress={() => handleStartJob(item._id)}
              disabled={actionLoading === item._id}
            >
              <Play size={16} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Start Cleaning</Text>
            </TouchableOpacity>
          )}

          {isCleaning && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.completeBtn, { width: '100%' }]}
              onPress={() => handleCompleteJob(item._id)}
              disabled={actionLoading === item._id}
            >
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Mark as Done</Text>
            </TouchableOpacity>
          )}

          {isCompleted && (
            <View style={styles.completedMessageBox}>
              <CheckCircle size={18} color="#10B981" />
              <Text style={styles.completedMessageText}>Cleaning finished successfully!</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Hello, {workerInfo?.firstName || 'Worker'}</Text>
              <Text style={styles.dateText}>Ready for your next job?</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => navigation.navigate('Chat')} style={styles.chatHeaderButton}>
                <MessageSquare size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                <LogOut size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Briefcase size={20} color="#0A5C43" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statValue}>{activeTab === 'available' ? availableJobs.length : myJobs.length}</Text>
            <Text style={styles.statLabel}>{activeTab === 'available' ? 'Available Jobs' : 'Your Assigned Jobs'}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Find Jobs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'myjobs' && styles.activeTab]}
          onPress={() => setActiveTab('myjobs')}
        >
          <Text style={[styles.tabText, activeTab === 'myjobs' && styles.activeTabText]}>
            My Jobs ({myJobs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Jobs Feed */}
      <View style={styles.feedContainer}>
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#0A5C43" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={activeTab === 'available' ? availableJobs : myJobs}
            keyExtractor={(item) => item._id || item.bookingId}
            renderItem={activeTab === 'available' ? renderAvailableJobCard : renderMyJobCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0A5C43']} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Image 
                  source={require('../../assets/logo.jpg')} 
                  style={{ width: 80, height: 80, opacity: 0.2, marginBottom: 20 }}
                  resizeMode="contain"
                />
                <Text style={styles.emptyText}>
                  {activeTab === 'available' ? 'No available jobs right now.' : 'You haven\'t accepted any jobs yet.'}
                </Text>
                <Text style={styles.emptySubtext}>Pull down to refresh</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#0A5C43', paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 20 },
  greeting: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  dateText: { fontSize: 14, color: '#E2E8F0', marginTop: 4 },
  logoutButton: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  chatHeaderButton: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statsContainer: { paddingHorizontal: 24, marginTop: -30, marginBottom: 20 },
  statCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  statIconContainer: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#E6F4F1', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  statLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  tabContainer: { flexDirection: 'row', marginHorizontal: 24, marginBottom: 16, backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#0F172A', fontWeight: '800' },
  feedContainer: { flex: 1, paddingHorizontal: 24 },
  listContent: { paddingBottom: 40 },
  jobCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 16 },
  serviceBadge: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  serviceText: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  priceText: { fontSize: 20, fontWeight: '900', color: '#0A5C43' },
  priceTextSmall: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  cardBody: { gap: 12, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { marginLeft: 10, fontSize: 14, color: '#475569', fontWeight: '500', flex: 1 },
  acceptButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6F4F1', paddingVertical: 14, borderRadius: 16 },
  acceptButtonText: { color: '#0A5C43', fontSize: 14, fontWeight: '800', marginRight: 4 },
  assignedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F4F1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  assignedText: { color: '#0A5C43', fontSize: 12, fontWeight: '800', marginLeft: 4 },
  customerDetailsBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  customerNameText: { marginLeft: 10, fontSize: 16, fontWeight: '800', color: '#0F172A' },
  fullAddressText: { marginLeft: 10, fontSize: 14, color: '#475569', fontWeight: '500', flex: 1, lineHeight: 20 },
  myJobFooter: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16, width: '100%' },
  
  // Progress Action Button Styles
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 14,
    gap: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  primaryBtn: { backgroundColor: '#0A5C43' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  cancelBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FEE2E2' },
  cancelBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '800' },
  completeBtn: { backgroundColor: '#10B981' },
  
  completedMessageBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#ECFDF5', 
    paddingVertical: 10, 
    borderRadius: 12, 
    gap: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1FAE5'
  },
  completedMessageText: { color: '#10B981', fontSize: 13, fontWeight: '700' },

  // Timer Styles
  timerWrapper: { 
    backgroundColor: '#F8FAFC', 
    padding: 14, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginTop: 10 
  },
  timerHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  timerTitle: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  timerCount: { fontSize: 14, fontWeight: '900', color: '#0A5C43' },
  progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#0A5C43', borderRadius: 3 },
  
  timerContainerFinished: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FEF2F2', 
    padding: 12, 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: '#FEE2E2',
    marginTop: 10,
    gap: 8
  },
  timerTextFinished: { color: '#EF4444', fontSize: 12, fontWeight: '700', flex: 1 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#64748B' },
  emptySubtext: { fontSize: 13, color: '#94A3B8', marginTop: 4 }
});

export default JobsFeedScreen;
