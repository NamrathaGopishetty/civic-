import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SegmentedButtons, IconButton } from 'react-native-paper';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../theme';

export default function MenuBar({ navigation, active, onLogout }) {

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={active}
        onValueChange={(value) => {
          if (value !== active) navigation.navigate(value);
        }}
        buttons={[
          { value: 'Report', label: 'Report', icon: 'file-document-edit' },
          { value: 'MyIssues', label: 'My Issues', icon: 'format-list-bulleted' },
        ]}
        style={styles.segmented}
        theme={{
          colors: { secondaryContainer: COLORS.primarySurface, onSecondaryContainer: COLORS.primary },
        }}
      />
      <IconButton
        icon="logout"
        mode="contained-tonal"
        iconColor={COLORS.error}
        onPress={onLogout}
        size={20}
        style={styles.logoutBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xs,
    ...SHADOWS.sm,
  },
  segmented: { flex: 1 },
  logoutBtn: { marginLeft: SPACING.xs, marginVertical: 0 },
});
