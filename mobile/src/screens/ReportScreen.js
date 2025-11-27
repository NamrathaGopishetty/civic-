import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, ScrollView, Alert, StyleSheet, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../api/api';
import { getCurrentLocationAsync } from '../utils/location';
import MenuBar from '../components/MenuBar';
import { clearToken } from '../utils/auth';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const categories = ['Roads','Water','Sanitation','Electricity','Other'];
const priorities = ['High','Medium','Low'];

export default function ReportScreen({ navigation }) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [priority, setPriority] = useState('Medium');
  const [media, setMedia] = useState([]); // array of { uri, type, mimeType, name }
  const [location, setLocation] = useState(null);
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
    const mimeType =
      asset.mimeType ||
      (isVideo ? 'video/mp4' : `image/${extension === 'jpg' ? 'jpeg' : extension}`);

    setMedia((prev) => [
      ...prev,
      {
        uri: asset.uri,
        type: isVideo ? 'video' : 'image',
        mimeType,
        name: nameFromUri || `media_${Date.now()}.${fallbackExt}`,
      },
    ]);
  };

  const pickMedia = async () => {
    const hasPermission = await ensureMediaLibraryPermission();
    if (!hasPermission) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing:false,
      quality:0.7,
      mediaTypes: ImagePicker.MediaTypeOptions.All,
    });
    if (!res.canceled && res.assets?.length) {
      res.assets.forEach(appendAsset);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await ensureCameraPermission();
    if (!hasPermission) return;
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:0.7,
    });
    if (!res.canceled && res.assets && res.assets[0]) appendAsset(res.assets[0]);
  };

  const recordVideo = async () => {
    const hasPermission = await ensureCameraPermission();
    if (!hasPermission) return;
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality:0.7,
      videoMaxDuration: 90,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets && res.assets[0]) appendAsset(res.assets[0]);
  };

  const useLocation = async () => {
    const loc = await getCurrentLocationAsync();
    if (loc) setLocation(loc);
    else Alert.alert(t('report.locationDenied'), t('report.enableLocationPermission'));
  };

  const handleLogout = async () => {
    await clearToken();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const submit = async () => {
    if (!description) return Alert.alert(t('report.validation'), t('report.addDescription'));
    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('category', category);
      formData.append('priority', priority);
      if (location) {
        formData.append('latitude', String(location.latitude));
        formData.append('longitude', String(location.longitude));
        if (location.address) formData.append('address', location.address);
      }

      for (let i=0;i<media.length;i++){
        const item = media[i];
        const filename = item.name || `media_${i}.${item.type === 'video' ? 'mp4' : 'jpg'}`;
        const type = item.mimeType || (item.type === 'video' ? 'video/mp4' : 'image/jpeg');
        formData.append('media', {
          uri: Platform.OS === 'android' ? item.uri : item.uri.replace('file://', ''),
          name: filename,
          type: type
        });
      }

      await api.post('/issues/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Alert.alert(t('report.success'), t('report.issueSubmitted'));
      navigation.navigate('MyIssues');
    } catch (err) {
      console.warn(err);
      Alert.alert(t('report.uploadFailed'), err?.response?.data?.message || t('report.tryAgain'));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LanguageSwitcher />
      <MenuBar navigation={navigation} active="Report" onLogout={handleLogout} />
      <Text style={styles.h1}>{t('report.title')}</Text>
      <TextInput
        placeholder={t('report.description')}
        value={description}
        onChangeText={setDescription}
        style={styles.textarea}
        multiline
      />
      <Text>{t('report.category')}</Text>
      <View style={{marginVertical:8}}>
        {categories.map(c => {
          const label = t(`categories.${c.toLowerCase()}`, c);
          return (
            <Button key={c} title={category===c?`✓ ${label}`:label} onPress={()=>setCategory(c)} />
          );
        })}
      </View>
      <Text>{t('report.priority')}</Text>
      <View style={{marginVertical:8}}>
        {priorities.map(value => {
          const label = t(`report.${value.toLowerCase()}`, value);
          return (
            <Button key={value} title={priority===value?`✓ ${label}`:label} onPress={()=>setPriority(value)} />
          );
        })}
      </View>

      <View style={{height:12}} />
      <Button title={t('report.pickFromGallery')} onPress={pickMedia} />
      <View style={{height:8}} />
      <Button title={t('report.takePhoto')} onPress={takePhoto} />
      <View style={{height:8}} />
      <Button title={t('report.recordVideo')} onPress={recordVideo} />
      <View style={{height:12}} />
      <ScrollView horizontal>
        {media.map((m, idx)=> (
          m.type === 'video'
            ? (
              <View key={`${m.uri}_${idx}`} style={styles.videoPreview}>
                <Text style={{fontWeight:'600'}}>{`${t('report.recordVideo')} ${idx + 1}`}</Text>
                <Text style={{fontSize:12, color:'#555'}}>{t('report.videoHint')}</Text>
              </View>
            )
            : (
              <Image key={`${m.uri}_${idx}`} source={{uri:m.uri}} style={{width:120,height:120, margin:6, borderRadius:8}} />
            )
        ))}
      </ScrollView>

      <View style={{height:12}} />
      <Button title={t('report.useCurrentLocation')} onPress={useLocation} />
      {location && (
        <View style={styles.locationBox}>
          <Text style={styles.locationLabel}>{t('report.locationSet')}</Text>
          <Text style={styles.locationText}>
            {location.address || `Lat ${location.latitude.toFixed(4)}, Lng ${location.longitude.toFixed(4)}`}
          </Text>
        </View>
      )}
      <View style={{height:12}} />
      <Button title={t('report.submitIssue')} onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ padding:16 },
  h1:{ fontSize:22, marginBottom:12 },
  textarea:{ borderWidth:1, borderColor:'#ccc', padding:8, borderRadius:6, minHeight:100, textAlignVertical:'top' },
  videoPreview:{ width:140, height:120, margin:6, borderRadius:8, backgroundColor:'#e1f0ff', alignItems:'center', justifyContent:'center' },
  locationBox:{ marginTop:12, padding:10, backgroundColor:'#f1f5f9', borderRadius:8 },
  locationLabel:{ fontSize:12, color:'#555', textTransform:'uppercase', marginBottom:4 },
  locationText:{ fontSize:14, color:'#222' }
});
