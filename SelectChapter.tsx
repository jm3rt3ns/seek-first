import React from 'react';
import { SafeAreaView, VirtualizedList, Text } from 'react-native';
import { useAppSelector } from './hooks';
import { getItem, getItemCount, Item, keyEnglish, styles } from './SelectBook';


const DATA = require("./assets/key_english.json")["resultset"]["keys"];

export const ChapterSelectionHeader = () => {
    return <Text>Choose a Chapter</Text>
}

const SelectChapter = () => {
    const selectedBook = useAppSelector(state => state.plans.scriptureRef.book);

    const numberOfChapters = DATA[selectedBook - 1].c;
    let chapters = [];

    for(let c = 0; c < numberOfChapters; c++) {
        chapters.push(c);
    }

    return (
        <SafeAreaView style={styles.container}>
            <VirtualizedList
                data={chapters}
                renderItem={({ item }: { item: number }) => <Item title={item + 1} idx={item} />}
                keyExtractor={(item: number) => item.toString()}
                getItemCount={() => getItemCount(chapters)}
                getItem={getItem}
            />
        </SafeAreaView>
    );
}

export default SelectChapter;