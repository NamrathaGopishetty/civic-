import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Alert, StyleSheet, Platform } from 'react-native';
import { TextInput, Button, Chip, Card, Surface, IconButton, Divider, Text as PaperText } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import api from '../api/api';
import { getCurrentLocationAsync } from '../utils/location';
import MenuBar from '../components/MenuBar';
import { clearToken } from '../utils/auth';
import { disconnectRealtime } from '../utils/realtime';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, RADIUS, SHADOWS, PRIORITY_COLORS } from '../theme';
import LanguageSwitcher from '../components/LanguageSwitcher';

const categoryIcons = {
  Roads: 'road-variant',
  Water: 'water',
  Sanitation: 'trash-can',
  Electricity: 'lightning-bolt',
  Other: 'dots-horizontal',
};

const priorities = ['High', 'Medium', 'Low'];

export default function ReportScreen({ navigation }) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Roads');
  const [priority, setPriority] = useState('Medium');
  const [media, setMedia] = useState([]);
  const [location, setLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLanguage();

  const ensureMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('report.permissionNeeded'), t('report.allowMediaAccess'));
      return false;
    }
    return true;
  };

  const ensureCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('report.permissionNeeded'), t('report.allowCameraAccess'));
      return false;
    }
    return true;
  };

  const appendAsset = (asset) => {
    if (!asset?.uri) return;
    const isVideo = asset.type === 'video';
    const fallbackExt = isVideo ? 'mp4' : 'jpg';
    const nameFromUri = asset.fileName || asset.uri.split('/').pop();
    const extension = nameFromUri?.split('.').pop() || fallbackExt;
    const mimeType = asset.mimeType || (isVideo ? 'video/mp4' : `image/${extension === 'jpg' ? 'jpeg' : extension}`);
    setMedia((prev) => [...prev, {
      uri: asset.uri, type: isVideo ? 'video' : 'image',
      mimeType, name: nameFromUri || `media_${Date.now()}.${fallbackExt}`,
    }]);
  };

  const pickMedia = async () => {
    if (!(await ensureMediaLibraryPermission())) return;
    const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.All });
    if (!res.canceled && res.assets?.length) res.assets.forEach(appendAsset);
  };

  const takePhoto = async () => {
    if (!(await ensureCameraPermission())) return;
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) appendAsset(res.assets[0]);
  };

  const recordVideo = async () => {
    if (!(await ensureCameraPermission())) return;
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, quality: 0.7, videoMaxDuration: 90, allowsEditing: false });
    if (!res.canceled && res.assets?.[0]) appendAsset(res.assets[0]);
  };

  const useLocation = async () => {
    const loc = await getCurrentLocationAsync();
    if (loc) setLocation(loc);
    else Alert.alert(t('report.locationDenied'), t('report.enableLocationPermission'));
  };

  const handleLogout = async () => {
    await clearToken();
    disconnectRealtime();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const removeMedia = (index) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!description.trim()) return Alert.alert(t('report.validation'), t('report.addDescription'));
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('priority', priority);
      if (location) {
        formData.append('latitude', String(location.latitude));
        formData.append('longitude', String(location.longitude));
        if (location.address) formData.append('address', location.address);
      }
      for (let i = 0; i < media.length; i++) {
        const item = media[i];
        formData.append('media', {
          uri: Platform.OS === 'android' ? item.uri : item.uri.replace('file://', ''),
          name: item.name || `media_${i}.${item.type === 'video' ? 'mp4' : 'jpg'}`,
          type: item.mimeType || (item.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        });
      }
      await api.post('/issues/create', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert(t('report.success'), t('report.issueSubmitted'));
      navigation.navigate('MyIssues');
    } catch (err) {
      Alert.alert(t('report.uploadFailed'), err?.response?.data?.message || t('report.tryAgain'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <LanguageSwitcher />
      <MenuBar navigation={navigation} active="Report" onLogout={handleLogout} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.screenTitle}>{t('report.title')}</Text>

        <Card style={styles.section} mode="elevated">
          <Card.Content>
            <Text style={styles.sectionLabel}>{t('report.description')}</Text>
            <TextInput
              placeholder={t('report.description')}
              value={description} onChangeText={setDescription}
              mode="outlined" multiline numberOfLines={4}
              style={styles.textarea}
              outlineColor={COLORS.border} activeOutlineColor={COLORS.primary}
              contentStyle={{ minHeight: 80, textAlignVertical: 'top' }}
            />
          </Card.Content>
        </Card>

        <Card style={styles.section} mode="elevated">
          <Card.Content>
            <Text style={styles.sectionLabel}>{t('report.category')}</Text>
            <View style={styles.chipRow}>
              {Object.entries(categoryIcons).map(([c, icon]) => (
                <Chip
                  key={c}
                  icon={icon}
                  selected={category === c}
                  onPress={() => setCategory(c)}
                  style={[styles.chip, category === c && styles.chipSelected]}
                  textStyle={[styles.chipText, category === c && styles.chipTextSelected]}
                  mode={category === c ? 'flat' : 'outlined'}
                  showSelectedOverlay={false}
                >
                  {t(`categories.${c.toLowerCase()}`, c)}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.section} mode="elevated">
          <Card.Content>
            <Text style={styles.sectionLabel}>{t('report.priority')}</Text>
            <View style={styles.chipRow}>
              {priorities.map((p) => (
                <Chip
                  key={p}
                  icon={p === 'High' ? 'alert-circle' : p === 'Medium' ? 'alert' : 'information-outline'}
                  selected={priority === p}
                  onPress={() => setPriority(p)}
                  style={[
                    styles.chip, styles.priorityChip,
                    priority === p && { backgroundColor: PRIORITY_COLORS[p] + '20', borderColor: PRIORITY_COLORS[p] },
                  ]}
                  textStyle={[
                    styles.chipText,
                    priority === p && { color: PRIORITY_COLORS[p], fontWeight: '700' },
                  ]}
                  mode={priority === p ? 'flat' : 'outlined'}
                  showSelectedOverlay={false}
                >
                  {t(`report.${p.toLowerCase()}`, p)}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.section} mode="elevated">
          <Card.Content>
            <Text style={styles.sectionLabel}>Media</Text>
            <View style={styles.mediaButtons}>
              <Button mode="outlined" icon="image" onPress={pickMedia} style={styles.mediaBtn} labelStyle={{ fontSize: 13 }}>
                {t('report.pickFromGallery')}
              </Button>
              <Button mode="outlined" icon="camera" onPress={takePhoto} style={styles.mediaBtn} labelStyle={{ fontSize: 13 }}>
                {t('report.takePhoto')}
              </Button>
              <Button mode="outlined" icon="video" onPress={recordVideo} style={styles.mediaBtn} labelStyle={{ fontSize: 13 }}>
                {t('report.recordVideo')}
              </Button>
            </View>
            {media.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviewScroll}>
                {media.map((m, idx) => (
                  <View key={`${m.uri}_${idx}`} style={styles.mediaItem}>
                    {m.type === 'video' ? (
                      <View style={styles.videoPlaceholder}>
                        <Text style={styles.videoLabel}>{t('report.recordVideo')} {idx + 1}</Text>
                        <Text style={styles.videoHint}>{t('report.videoHint')}</Text>
                      </View>
                    ) : (
                      <Image source={{ uri: m.uri }} style={styles.mediaImage} />
                    )}
                    <IconButton icon="close-circle" size={18} iconColor={COLORS.error}
                      style={styles.removeBtn} onPress={() => removeMedia(idx)} />
                  </View>
                ))}
              </ScrollView>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.section} mode="elevated">
          <Card.Content>
            <Text style={styles.sectionLabel}>{t('report.useCurrentLocation')}</Text>
            <Button mode="outlined" icon="map-marker" onPress={useLocation} style={styles.locationBtn}>
              {location ? t('report.locationSet') : t('report.useCurrentLocation')}
            </Button>
            {location && (
              <Surface style={styles.locationBox} elevation={0}>
                <Text style={styles.locationLabel}>{t('report.locationSet')}</Text>
                <Text style={styles.locationText}>
                  {location.address || `Lat ${location.latitude.toFixed(4)}, Lng ${location.longitude.toFixed(4)}`}
                </Text>
              </Surface>
            )}
          </Card.Content>
        </Card>

        <Button
          mode="contained" onPress={submit} loading={submitting}
          disabled={submitting || !description.trim()}
          style={styles.submitBtn} labelStyle={styles.submitBtnLabel}
          contentStyle={{ height: 50 }} icon="send" buttonColor={COLORS.primary}
        >
          {t('report.submitIssue')}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: 40 },
  screenTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.lg },
  section: { marginBottom: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.white, ...SHADOWS.sm },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  textarea: { backgroundColor: COLORS.white },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { borderRadius: RADIUS.md, borderColor: COLORS.border },
  chipSelected: { backgroundColor: COLORS.primarySurface, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontSize: 13 },
  chipTextSelected: { color: COLORS.primary, fontWeight: '700' },
  priorityChip: { borderColor: COLORS.border },
  mediaButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  mediaBtn: { flex: 1, minWidth: 100, borderColor: COLORS.border },
  mediaPreviewScroll: { marginTop: SPACING.md },
  mediaItem: { marginRight: SPACING.md, position: 'relative' },
  mediaImage: { width: 100, height: 100, borderRadius: RADIUS.md },
  videoPlaceholder: {
    width: 140, height: 100, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySurface, alignItems: 'center', justifyContent: 'center',
  },
  videoLabel: { fontWeight: '600', color: COLORS.primary, fontSize: 12 },
  videoHint: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  removeBtn: { position: 'absolute', top: -4, right: -4, backgroundColor: COLORS.white, borderRadius: 12 },
  locationBtn: { borderColor: COLORS.border },
  locationBox: { marginTop: SPACING.md, padding: SPACING.md, backgroundColor: COLORS.surfaceVariant, borderRadius: RADIUS.md },
  locationLabel: { fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: SPACING.xs, fontWeight: '600' },
  locationText: { fontSize: 14, color: COLORS.text },
  submitBtn: { marginTop: SPACING.sm, borderRadius: RADIUS.md },
  submitBtnLabel: { fontSize: 16, fontWeight: '600', color: COLORS.white },
});
