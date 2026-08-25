import React from 'react';
import { StyleSheet } from 'react-native';
import { Menu, Button, Portal, Dialog, Text, RadioButton } from 'react-native-paper';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, RADIUS } from '../theme';

export default function LanguageSwitcher() {
  const { locale, changeLanguage, t } = useLanguage();
  const [visible, setVisible] = React.useState(false);

  const languages = [
    { code: 'en', name: t('common.english') },
    { code: 'hi', name: t('common.hindi') },
  ];

  const handleLanguageChange = async (langCode) => {
    await changeLanguage(langCode);
    setVisible(false);
  };

  return (
    <>
      <Button
        mode="text"
        icon="translate"
        compact
        onPress={() => setVisible(true)}
        labelStyle={styles.buttonLabel}
        style={styles.button}
        textColor={COLORS.textSecondary}
      >
        {locale === 'en' ? 'EN' : 'HI'}
      </Button>

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>{t('common.selectLanguage')}</Dialog.Title>
          <Dialog.Content>
            {languages.map((lang) => (
              <RadioButton.Item
                key={lang.code}
                label={lang.name}
                value={lang.code}
                status={locale === lang.code ? 'checked' : 'unchecked'}
                onPress={() => handleLanguageChange(lang.code)}
                color={COLORS.primary}
                labelStyle={{ color: COLORS.text, fontSize: 16 }}
                style={styles.radioItem}
              />
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)} textColor={COLORS.primary}>
              {t('common.close')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  button: { alignSelf: 'flex-end' },
  buttonLabel: { fontSize: 13, fontWeight: '600' },
  dialog: { borderRadius: RADIUS.lg },
  dialogTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  radioItem: { paddingVertical: SPACING.xs },
});
