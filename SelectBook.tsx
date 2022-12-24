import React from 'react';
import { SafeAreaView, View, VirtualizedList, StyleSheet, Text, StatusBar } from 'react-native';
import { FOGWHITE, MIDNIGHTBLACK } from './App';
import { Paragraph } from './components/Paragraph';

const DATA = require("./assets/key_english.json")["resultset"]["keys"];

interface keyEnglish {
    n: string,
    b: number
}

const Item = ({ title }: any) => (
    <View style={styles.item}>
        <Paragraph style={styles.title}>{title}</Paragraph>
    </View>
);

const getItemCount = () => DATA.length;

const getItem = (data: keyEnglish[], index: number) => {
    return data[index];
}

const SelectBook = () => {
    return (
        <SafeAreaView style={styles.container}>
            <VirtualizedList
                data={DATA}
                initialNumToRender={4}
                renderItem={({ item }: { item: keyEnglish }) => <Item title={item.n} />}
                keyExtractor={(item: keyEnglish) => item.n}
                getItemCount={getItemCount}
                getItem={getItem}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: StatusBar.currentHeight,
    },
    item: {
        backgroundColor: FOGWHITE,
        borderRadius: 50,
        height: 50,
        justifyContent: 'center',
        marginHorizontal: 16,
        marginVertical: 3,
        padding: 3,
    },
    title: {
        fontSize: 22,
        color: MIDNIGHTBLACK,
        fontFamily: 'Inter-Light',
        textAlign: 'center'
    },
});

export default SelectBook;