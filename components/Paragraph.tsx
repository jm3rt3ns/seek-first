
import React from 'react';

// third party
import { Text, View, StyleSheet } from 'react-native';

export const Paragraph = (props: any) => {

    const { children } = props;
    return (
        <Text style={{ fontFamily: 'Inter-Light', fontSize: 18, textAlign: 'center', padding: 10 }} {...props}>
            {children}
        </Text>
    );
}