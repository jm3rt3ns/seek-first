import React from 'react';
import { Text, View, StyleSheet, Pressable } from 'react-native';
import { CROWNGOLD } from '../COLORS';

export const PillButton = (props: any) => {
  const { onPress, title = 'Save' } = props;
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    margin: 10,
    paddingHorizontal: 32,
    borderRadius: 100,
    elevation: 3,
    backgroundColor: CROWNGOLD,
  },
  text: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
});
