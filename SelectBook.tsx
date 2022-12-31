import React from 'react';
import { SafeAreaView, VirtualizedList, StyleSheet, StatusBar, Pressable } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { FOGWHITE, MIDNIGHTBLACK } from './COLORS';
import { Paragraph } from './components/Paragraph';
import { useAppDispatch, useAppSelector } from './hooks';
import { setBook } from './planSlice';

const DATA = require("./assets/key_english.json")["resultset"]["keys"];

export interface keyEnglish {
    n: string,
    b: number
}

export const Item = ({ title, idx }: any) => {
    const dispatch = useAppDispatch();
    const navigation = React.useContext(NavigationContext);
    return (
        <Pressable style={styles.item} onPress={() => { dispatch(setBook({ name: title, number: idx })); navigation?.navigate("Select Chapter") }}>
            <Paragraph style={styles.title}>{title}</Paragraph>
        </Pressable>
    );
}

export const getItemCount = (data: any[]) => data.length;

export const getItem = (data: any[], index: number) => {
    return data[index];
}


const SelectBook = () => {
    const selectedBook = useAppSelector(state => state.plans.scriptureRef.book);
    return (
        <SafeAreaView style={styles.container}>
            <VirtualizedList
                data={DATA}
                renderItem={({ item }: { item: keyEnglish }) => <Item title={item.n} idx={item.b} />}
                keyExtractor={(item: keyEnglish) => item.n}
                getItemCount={getItemCount}
                getItem={getItem}
            />
        </SafeAreaView>
    );
}

export const styles = StyleSheet.create({
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