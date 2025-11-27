import React, {useEffect, useState} from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function IssueDetailScreen({ route }) {
  const { id } = route.params;
  const [issue, setIssue] = useState(null);
  const { t } = useLanguage();

  useEffect(()=>{ fetch(); }, []);

  const fetch = async () => {
    try {
      const resp = await api.get(`/issues/${id}`);
      setIssue(resp.data);
    } catch (err) {
      console.warn(err);
    }
  };

  if (!issue) return <View style={{padding:16}}><Text>{t('issues.loading')}</Text></View>;

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return '#ffc107';
      case 'Acknowledged': return '#17a2b8';
      case 'In Progress': return '#007bff';
      case 'Resolved': return '#28a745';
      default: return '#6c757d';
    }
  };

  const translateStatus = (status) => {
    if (!status) return '';
    const normalized = status.toLowerCase().replace(/\s+/g, '');
    switch (normalized) {
      case 'pending':
        return t('status.pending');
      case 'acknowledged':
        return t('status.acknowledged');
      case 'inprogress':
        return t('status.inProgress');
      case 'resolved':
        return t('status.resolved');
      default:
        return status;
    }
  };

  return (
    <ScrollView style={{padding:16}}>
      <LanguageSwitcher />
      <View style={{marginBottom:16}}>
        <Text style={{fontSize:24, fontWeight:'bold'}}>{issue.category}</Text>
        <View style={{flexDirection:'row', marginTop:8, alignItems:'center'}}>
          <Text style={{fontSize:16, color:'#666'}}>{t('report.priority')}: {issue.priority}</Text>
          <View style={{marginLeft:12, paddingHorizontal:8, paddingVertical:4, backgroundColor:getStatusColor(issue.status), borderRadius:12}}>
            <Text style={{color:'white', fontSize:12, fontWeight:'600'}}>{translateStatus(issue.status)}</Text>
          </View>
        </View>
      </View>

      <Text style={{fontSize:18, fontWeight:'600', marginBottom:8}}>{t('report.description')}</Text>
      <Text style={{marginBottom:16, lineHeight:22, color:'#333'}}>{issue.description || t('common.notAvailable')}</Text>

      {issue.media && issue.media.length > 0 && (
        <View style={{marginBottom:16}}>
          <Text style={{fontSize:18, fontWeight:'600', marginBottom:8}}>{t('issues.attachments')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {issue.media.map((m,idx) => {
              const mediaUri = m.url || m.path || m;
              const isVideo = m.type === 'video' || m.mimeType?.includes('video');

              return isVideo ? (
                <TouchableOpacity
                  key={`video-${idx}`}
                  onPress={() => Linking.openURL(mediaUri)}
                  style={{width:200, height:120, marginRight:12, borderRadius:8, backgroundColor:'#e1f5fe', alignItems:'center', justifyContent:'center'}}
                >
                  <Text style={{fontWeight:'600'}}>{`${t('report.recordVideo')} ${idx + 1}`}</Text>
                  <Text style={{fontSize:12, color:'#555'}}>{t('issues.tapToOpen')}</Text>
                </TouchableOpacity>
              ) : (
                <Image 
                  key={`img-${idx}`} 
                  source={{uri:mediaUri}} 
                  style={{width:200, height:200, marginRight:8, borderRadius:8}} 
                />
              );
            })}
          </ScrollView>
        </View>
      )}

      {issue.location && (
        <View style={{marginBottom:16, padding:12, backgroundColor:'#f8f9fa', borderRadius:8}}>
          <Text style={{fontSize:18, fontWeight:'600', marginBottom:8}}>{t('common.location')}</Text>
          <Text style={{color:'#666'}}>{t('common.address')}: {issue.location.address || t('common.notAvailable')}</Text>
          {issue.location.latitude && issue.location.longitude && (
            <Text style={{color:'#999', fontSize:12, marginTop:4}}>
              {t('common.coordinates')}: {issue.location.latitude}, {issue.location.longitude}
            </Text>
          )}
        </View>
      )}

      {issue.assignedOfficerName && (
        <View style={{marginBottom:16, padding:12, backgroundColor:'#e7f3ff', borderRadius:8}}>
          <Text style={{fontSize:18, fontWeight:'600', marginBottom:8}}>{t('common.assignedTo')}</Text>
          <Text style={{color:'#666'}}>{t('common.officer')}: {issue.assignedOfficerName}</Text>
          {issue.assignedDepartment && (
            <Text style={{color:'#666'}}>{t('common.department')}: {issue.assignedDepartment}</Text>
          )}
        </View>
      )}

      <Text style={{fontSize:18, fontWeight:'600', marginTop:8, marginBottom:12}}>{t('issues.timeline')}</Text>
      {issue.timeline && issue.timeline.length > 0 ? (
        issue.timeline.map((entry,idx) => (
          <View key={idx} style={{marginBottom:12, padding:12, backgroundColor:'#f8f9fa', borderRadius:8, borderLeftWidth:4, borderLeftColor:getStatusColor(entry.status)}}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:4}}>
              <Text style={{fontWeight:'600', color:getStatusColor(entry.status)}}>{translateStatus(entry.status)}</Text>
              <Text style={{fontSize:12, color:'#999'}}>
                {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            {entry.note && <Text style={{color:'#666', fontSize:14, marginTop:4}}>{entry.note}</Text>}
          </View>
        ))
      ) : (
        <Text style={{color:'#999', fontStyle:'italic'}}>{t('issues.timelineEmpty')}</Text>
      )}
    </ScrollView>
  );
}
