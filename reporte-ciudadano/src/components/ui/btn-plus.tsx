
import React from 'react';
import { Button } from '@expo/ui';
import { StyleSheet, Text, View } from 'react-native';

interface PlusProps {
  onPress: () => void;
}

export default function Plus({ onPress }: PlusProps) {
  return (
    <View style={styles.fabContainer}>
      <Button variant="filled" onPress={onPress} style={styles.fab}>
        <Text style={styles.plus}>+</Text>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1F2937',
  },
  plus: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 32,
    textAlign: 'center',
  },
});
