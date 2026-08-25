import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, TouchableOpacity, Linking, StyleSheet, Alert } from 'react-native';
import { Text, Card, Chip, Surface, Divider, ActivityIndicator, TextInput } from 'react-native-paper';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, RADIUS, SHADOWS, STATUS_COLORS } from '../theme';
import LanguageSwitcher from '../components/LanguageSwitcher';

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

const StarRating = ({ rating, onRate, interactive }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => interactive && onRate(star)}
          onPressIn={() => interactive && setHovered(star)}
          onPressOut={() => interactive && setHovered(0)}
          disabled={!interactive}
          style={styles.starBtn}
        >
          <Text style={[
            styles.star,
            (interactive ? (hovered || rating) >= star : rating >= star) && styles.starFilled,
          ]}>
            {(interactive ? (hovered || rating) >= star : rating >= star) ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function IssueDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratingScore, setRatingScore] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const { t } = useLanguage();

  useEffect(() => { fetchIssue(); }, []);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      const resp = await api.get(`/issues/${id}`);
      setIssue(resp.data);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async () => {
    if (ratingScore < 1 || ratingScore > 5) {
      Alert.alert('Rating Required', 'Please select a rating from 1 to 5 stars');
      return;
    }
    setSubmittingRating(true);
    try {
      await api.post(`/issues/${id}/rate`, { score: ratingScore, review });
      Alert.alert('Thank You!', 'Your rating has been submitted');
      fetchIssue();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const translateStatus = (status) => {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('issues.loading')}</Text>
      </View>
    );
  }

  if (!issue) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('issues.loading')}</Text>
      </View>
    );
  }

  const statusKey = getStatusKey(issue.status);
  const statusColor = STATUS_COLORS[statusKey] || COLORS.textMuted;
  const isResolved = issue.status === 'Resolved';
  const hasRating = issue.rating && issue.rating.score;

  const renderTimelineEntry = (entry, idx) => {
    const entryStatusKey = getStatusKey(entry.status);
    const entryColor = STATUS_COLORS[entryStatusKey] || COLORS.textMuted;
    return (
      <View key={idx} style={styles.timelineItem}>
        <View style={[styles.timelineDot, { backgroundColor: entryColor }]} />
        <View style={styles.timelineContent}>
          <View style={styles.timelineHeader}>
            <Text style={[styles.timelineStatus, { color: entryColor }]}>{translateStatus(entry.status)}</Text>
            <Text style={styles.timelineDate}>
              {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString()}
            </Text>
          </View>
          {entry.note && <Text style={styles.timelineNote}>{entry.note}</Text>}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <LanguageSwitcher />

      <Card style={styles.headerCard} mode="elevated">
        <Card.Content>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.issueCategory}>{issue.category}</Text>
          <View style={styles.badgeRow}>
            <Chip style={[styles.statusChip, { backgroundColor: statusColor + '18' }]}
              textStyle={{ color: statusColor, fontWeight: '700' }}>
              {translateStatus(issue.status)}
            </Chip>
            <Chip style={styles.priorityChip}
              textStyle={{ color: COLORS.textSecondary, fontWeight: '600' }}>
              {t('report.priority')}: {issue.priority}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.section} mode="elevated">
        <Card.Content>
          <Text style={styles.sectionTitle}>{t('report.description')}</Text>
          <Text style={styles.description}>{issue.description || t('common.notAvailable')}</Text>
        </Card.Content>
      </Card>

      {issue.media && issue.media.length > 0 && (
        <Card style={styles.section} mode="elevated">
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('issues.attachments')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {issue.media.map((m, idx) => {
                const mediaUri = m.url || m.path || m;
                const isVideo = m.type === 'video' || m.mimeType?.includes('video');
                return isVideo ? (
                  <TouchableOpacity key={`video-${idx}`} onPress={() => Linking.openURL(mediaUri)}
                    style={styles.videoPlaceholder}>
                    <Text style={styles.videoText}>{t('report.recordVideo')} {idx + 1}</Text>
                    <Text style={styles.videoHint}>{t('issues.tapToOpen')}</Text>
                  </TouchableOpacity>
                ) : (
                  <Image key={`img-${idx}`} source={{ uri: mediaUri }} style={styles.mediaImage} />
                );
              })}
            </ScrollView>
          </Card.Content>
        </Card>
      )}

      {issue.location && (
        <Card style={styles.section} mode="elevated">
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('common.location')}</Text>
            <Text style={styles.infoText}>{t('common.address')}: {issue.location.address || t('common.notAvailable')}</Text>
            {issue.location.latitude && issue.location.longitude && (
              <Text style={styles.mutedText}>{t('common.coordinates')}: {issue.location.latitude}, {issue.location.longitude}</Text>
            )}
          </Card.Content>
        </Card>
      )}

      {issue.assignedOfficerName && (
        <Card style={styles.section} mode="elevated">
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('common.assignedTo')}</Text>
            <Text style={styles.infoText}>{t('common.officer')}: {issue.assignedOfficerName}</Text>
            {issue.assignedDepartment && (
              <Text style={styles.infoText}>{t('common.department')}: {issue.assignedDepartment}</Text>
            )}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.section} mode="elevated">
        <Card.Content>
          <Text style={styles.sectionTitle}>{t('issues.timeline')}</Text>
          {issue.timeline && issue.timeline.length > 0 ? (
            issue.timeline.map((entry, idx) => renderTimelineEntry(entry, idx))
          ) : (
            <Text style={styles.mutedText}>{t('issues.timelineEmpty')}</Text>
          )}
        </Card.Content>
      </Card>

      {isResolved && !hasRating && (
        <Card style={styles.section} mode="elevated">
          <Card.Content>
            <Text style={styles.sectionTitle}>Rate This Resolution</Text>
            <Text style={styles.infoText}>How was the work done? Your feedback helps us improve.</Text>
            <StarRating rating={ratingScore} onRate={setRatingScore} interactive={true} />
            <TextInput
              label="Review (optional)"
              value={review}
              onChangeText={setReview}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.reviewInput}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              contentStyle={{ minHeight: 60, textAlignVertical: 'top' }}
            />
            <TouchableOpacity
              onPress={submitRating}
              disabled={submittingRating || ratingScore < 1}
              style={[styles.ratingBtn, (submittingRating || ratingScore < 1) && styles.ratingBtnDisabled]}
            >
              {submittingRating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.ratingBtnText}>Submit Rating</Text>
              )}
            </TouchableOpacity>
          </Card.Content>
        </Card>
      )}

      {isResolved && hasRating && (
        <Card style={styles.section} mode="elevated">
          <Card.Content>
            <Text style={styles.sectionTitle}>Your Rating</Text>
            <StarRating rating={issue.rating.score} interactive={false} />
            {issue.rating.review ? (
              <Text style={styles.reviewText}>{issue.rating.review}</Text>
            ) : null}
            <Text style={styles.mutedText}>Rated on {new Date(issue.rating.ratedAt).toLocaleDateString()}</Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: 40 },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: SPACING.md, color: COLORS.textSecondary, fontSize: 15 },
  headerCard: { marginBottom: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.white, ...SHADOWS.md },
  backBtn: { marginBottom: SPACING.md },
  backText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  issueCategory: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  badgeRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  statusChip: { height: 30 },
  priorityChip: { height: 30, backgroundColor: COLORS.surfaceVariant },
  section: { marginBottom: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.white, ...SHADOWS.sm },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm },
  description: { fontSize: 15, lineHeight: 22, color: COLORS.text },
  mediaImage: { width: 180, height: 180, borderRadius: RADIUS.md, marginRight: SPACING.md },
  videoPlaceholder: {
    width: 180, height: 120, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySurface, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  videoText: { fontWeight: '600', color: COLORS.primary, fontSize: 13 },
  videoHint: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  infoText: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  mutedText: { fontSize: 12, color: COLORS.textMuted, marginTop: SPACING.xs },
  timelineItem: { flexDirection: 'row', marginBottom: SPACING.md },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, marginRight: SPACING.md },
  timelineContent: { flex: 1, padding: SPACING.md, backgroundColor: COLORS.surfaceVariant, borderRadius: RADIUS.md },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  timelineStatus: { fontSize: 14, fontWeight: '700' },
  timelineDate: { fontSize: 11, color: COLORS.textMuted },
  timelineNote: { fontSize: 13, color: COLORS.textSecondary, marginTop: SPACING.xs },
  starRow: { flexDirection: 'row', marginVertical: SPACING.md },
  starBtn: { marginRight: 4 },
  star: { fontSize: 36, color: COLORS.border },
  starFilled: { color: '#FFC107' },
  reviewInput: { marginBottom: SPACING.md },
  ratingBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBtnDisabled: { opacity: 0.5 },
  ratingBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  reviewText: { fontSize: 14, color: COLORS.text, marginTop: SPACING.sm, lineHeight: 20 },
});
