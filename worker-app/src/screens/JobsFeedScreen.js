import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Image, SafeAreaView, Platform
} from 'react-native';
import { AuthContext, API_URL } from '../context/AuthContext';
import { MapPin, Calendar, Clock, ChevronRight, LogOut, Briefcase } from 'lucide-react-native';
import axios from 'axios';

const JobsFeedScreen = () => {
  const { workerInfo, logout } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API_URL}/workers/jobs`);
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Anytime';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const renderJobCard = ({ item }) => (
    <View style={styles.jobCard}>
      <View style={styles.cardHeader}>
        <View style={styles.serviceBadge}>
          <Text style={styles.serviceText}>{item.service}</Text>
        </View>
        <Text style={styles.priceText}>
          {item.payment?.currency === 'GBP' ? '£' : '₦'}
          {item.payment?.amount || 'TBD'}
        </Text>
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
            {item.property?.postcode || item.property?.city || item.region || 'Location pending'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.acceptButton}>
        <Text style={styles.acceptButtonText}>Accept Job</Text>
        <ChevronRight size={18} color="#0A5C43" />
      </TouchableOpacity>
    </View>
  );

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
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <LogOut size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Briefcase size={20} color="#0A5C43" />
          </View>
          <View>
            <Text style={styles.statValue}>{jobs.length}</Text>
            <Text style={styles.statLabel}>Available Jobs</Text>
          </View>
        </View>
      </View>

      {/* Jobs Feed */}
      <View style={styles.feedContainer}>
        <Text style={styles.sectionTitle}>Open Bookings</Text>
        
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#0A5C43" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={(item) => item._id || item.bookingId}
            renderItem={renderJobCard}
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
                <Text style={styles.emptyText}>No available jobs right now.</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0A5C43',
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 14,
    color: '#E2E8F0',
    marginTop: 4,
  },
  logoutButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginTop: -30,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  feedContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 16,
  },
  serviceBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  serviceText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  priceText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0A5C43',
  },
  cardBody: {
    gap: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F4F1',
    paddingVertical: 14,
    borderRadius: 16,
  },
  acceptButtonText: {
    color: '#0A5C43',
    fontSize: 14,
    fontWeight: '800',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  }
});

export default JobsFeedScreen;
