// ─────────────────────────────────────────────────
// QR Code Component — uses react-native-qrcode-svg
// Install: npm install react-native-qrcode-svg
// ─────────────────────────────────────────────────
import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCodeSvg from 'react-native-qrcode-svg';

interface QRCodeProps {
  data: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export default function QRCode({
  data,
  size = 200,
  color = '#000000',
  backgroundColor = '#FFFFFF',
}: QRCodeProps) {
  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
      <QRCodeSvg
        value={data}
        size={size - 16}
        color={color}
        backgroundColor={backgroundColor}
        ecl="M"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});
