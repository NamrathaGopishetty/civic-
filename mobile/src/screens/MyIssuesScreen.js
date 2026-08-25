import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/api';
import MenuBar from '../components/MenuBar';
import { clearToken } from '../utils/auth';
import { disconnectRealtime, subscribeToIssueEvents } from '../utils/realtime';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, RADIUS, SHADOWS, STATUS_COLORS, PRIORITY_COLORS } from '../theme';
import LanguageSwitcher from '../components/LanguageSwitcher';

const formatStatus = (status, t) => {
  if (!status) return '';
  const normalized = status.toLowerCase().replace(/\s+/g, '');
  switch (normalized) {
    case 'pending': return t('status.pending');
    case 'acknowledged': return t('status.acknowledged');
    case 'inprogress': return t('status.inProgress');
    case 'resolved': return t('status.resolved');
    default: return status;
  }
};

const getStatusKey = (status) => {
  if (!status) return 'Pending';
  const normalized = status.toLowerCase().replace(/\s+/g, '');
  switch (normalized) {
    case 'pending': return 'Pending';
    case 'acknowledged': return 'Acknowledged';
    case 'inprogress': return 'In Progress';
    case 'resolved': return 'Resolved';
    default: return status;
  }
};

const categoryIcons = {
  Roads: 'road-variant', Water: 'water', Sanitation: 'trash-can',
  Electricity: 'lightning-bolt', Other: 'dots-horizontal',
};

const StarDisplay = ({ score }) => (
  <View style={styles.starRow}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Text key={s} style={[styles.star, s <= score && styles.starFilled]}>{s <= score ? '★' : '☆'}</Text>
    ))}
  </View>
);

export default function MyIssuesScreen({ navigation }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await api.get('/issues/my');
      setIssues(resp.data);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchIssues(); }, [fetchIssues]));

  useEffect(() => {
    const unsubscribe = subscribeToIssueEvents(() => fetchIssues());
    return unsubscribe;
  }, [fetchIssues]);

  const handleLogout = async () => {
    await clearToken();
    disconnectRealtime();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const renderItem = ({ item }) => {
    const statusKey = getStatusKey(item.status);
    const statusColor = STATUS_COLORS[statusKey] || COLORS.textMuted;
    const priorityColor = PRIORITY_COLORS[item.priority] || COLORS.textMuted;
    const isResolved = item.status === 'Resolved';
    const hasRating = item.rating && item.rating.score;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('IssueDetail', { id: item._id || item.id })}
      >
        <Card style={styles.card} mode="elevated">
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardCategoryRow}>
                <Text style={styles.cardCategory}>{item.category}</Text>
                <Chip
                  compact
                  style={[styles.priorityBadge, { backgroundColor: priorityColor + '18' }]}
                  textStyle={{ color: priorityColor, fontSize: 10, fontWeight: '600' }}
                >
                  {item.priority}
                </Chip>
              </View>
              <Chip
                compact
                style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}
                textStyle={{ color: statusColor, fontSize: 11, fontWeight: '700' }}
              >
                {formatStatus(item.status, t)}
              </Chip>
            </View>

            <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>

            {item.createdAt && (
              <Text style={styles.cardDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            )}

            {isResolved && hasRating && (
              <View style={styles.ratingRow}>
                <StarDisplay score={item.rating.score} />
                {item.rating.review ? (
                  <Text style={styles.ratingReview} numberOfLines={1}>{item.rating.review}</Text>
                ) : null}
              </View>
            )}

            {isResolved && !hasRating && (
              <View style={styles.pendingRatingBadge}>
                <Text style={styles.pendingRatingText}>Tap to rate</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <LanguageSwitcher />
      <MenuBar navigation={navigation} active="MyIssues" onLogout={handleLogout} />
      <Text style={styles.screenTitle}>{t('issues.myIssues')}</Text>
      <FlatList
        data={issues}
        keyExtractor={item => item._id || item.id}
        contentContainerStyle={issues.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchIssues} tintColor={COLORS.primary} />}
        renderItem={renderItem}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No issues reported yet</Text>
              <Text style={styles.emptySubtext}>Report your first issue to get started</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  screenTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
  card: { marginBottom: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.white, ...SHADOWS.sm },
  cardContent: { paddingVertical: SPACING.xs },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  cardCategoryRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1, flexWrap: 'wrap', marginRight: SPACING.sm },
  cardCategory: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  statusBadge: { height: 26, flexShrink: 0 },
  priorityBadge: { height: 22, flexShrink: 0 },
  cardDescription: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.xs },
  cardDate: { fontSize: 12, color: COLORS.textMuted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, gap: SPACING.sm },
  starRow: { flexDirection: 'row' },
  star: { fontSize: 16, color: COLORS.border, marginRight: 1 },
  starFilled: { color: '#FFC107' },
  ratingReview: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic', flex: 1 },
  pendingRatingBadge: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  pendingRatingText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.textSecondary },
  emptySubtext: { fontSize: 14, color: COLORS.textMuted, marginTop: SPACING.xs },
});
