import { NavigationContext } from '@react-navigation/native';
import React from 'react';

// third party
import { Text, View, StyleSheet, Alert, Button } from 'react-native';

// local
import { FOGWHITE, GREY } from './COLORS';
import { Paragraph } from './components/Paragraph';
import { PillButton } from './components/PillButton';

const HomeScreen = () => {

    const navigation = React.useContext(NavigationContext);
    
    return (
        <View style={{ flex: 1, backgroundColor: GREY }}>
            <View style={{ flex: 1, backgroundColor: FOGWHITE, borderRadius: 20, padding: 10 }}>
                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 40, textAlign: 'center', padding: 10 }}>
                    Welcome.
                </Text>
                <Paragraph>
                    To get started, choose a scripture passage you would like to memorize.
                </Paragraph>
                <Paragraph>
                    Then, we'll create a schedule for you.
                </Paragraph>
                <Button title="Select Book" onPress={() => navigation?.navigate("Select Book")} />
                <PillButton title="Next" onPress={() => Alert.alert('Simple Button pressed')} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default HomeScreen;