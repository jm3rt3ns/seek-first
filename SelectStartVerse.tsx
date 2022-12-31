import React from 'react';
import { SafeAreaView, VirtualizedList, Text } from 'react-native';
import { useAppSelector } from './hooks';
import { getItem, getItemCount, Item, keyEnglish, styles } from './SelectBook';


const DATA = require("./assets/key_english.json")["resultset"]["keys"];
const SelectStartVerse = () => {
    const selectedBook = useAppSelector(state => state.plans.scriptureRef.book);
    const selectedChapter = useAppSelector(state => state.plans.scriptureRef.book);
    return (
        <SafeAreaView style={styles.container}>
            <Text>{selectedBook}</Text>
            <VirtualizedList
                data={DATA}
                initialNumToRender={4}
                renderItem={({ item }: { item: keyEnglish }) => <Item title={item.n} idx={item.b} />}
                keyExtractor={(item: keyEnglish) => item.n}
                getItemCount={getItemCount}
                getItem={getItem}
            />
        </SafeAreaView>
    );
}

export default SelectStartVerse;