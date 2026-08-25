import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function IssueCard({ item }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{item.category} - {item.priority}</Text>
      <Text numberOfLines={2}>{item.description}</Text>
      {item.media?.[0] && <Image source={{uri: item.media[0].url || item.media[0].path}} style={styles.thumb} />}
      <Text>Status: {item.status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:{ padding:12, borderWidth:1, borderColor:'#eee', borderRadius:8, marginBottom:8 },
  thumb:{ width:80, height:80, marginTop:8 }
});
