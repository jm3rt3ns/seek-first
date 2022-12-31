import React from 'react';
import { SafeAreaView, Text } from 'react-native';
import { useAppSelector } from './hooks';
import { styles } from './SelectBook';


const DATA = require("./assets/key_english.json")["resultset"]["keys"];

export const VerseSelectionHeader = () => {
    const selectedBook = useAppSelector(state => state.plans.scriptureRef.book);
    const selectedChapter = useAppSelector(state => state.plans.scriptureRef.chapter);

    return <Text>{selectedBook.name} {selectedChapter}, Verses:</Text>;
}

const SelectStartVerse = () => {
    const selectedBook = useAppSelector(state => state.plans.scriptureRef.book);
    const selectedChapter = useAppSelector(state => state.plans.scriptureRef.chapter);
    return (
        <SafeAreaView style={styles.container}>
        </SafeAreaView>
    );
}

export default SelectStartVerse;