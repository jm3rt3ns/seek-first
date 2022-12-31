import { NavigationContext, useNavigationState } from '@react-navigation/native';
import React from 'react';
import { SafeAreaView, Text, ScrollView, FlatList, Pressable, StyleSheet, Dimensions } from 'react-native';
import { FOGWHITE, GREY, MIDNIGHTBLACK } from './COLORS';
import { useAppDispatch, useAppSelector } from './hooks';
import { setChapter } from './planSlice';
import { styles } from './SelectBook';


const DATA = require("./assets/key_english.json")["resultset"]["keys"];

const NUM_COLUMNS = 6;

export const ChapterSelectionHeader = () => {
    const selectedBook = useAppSelector(state => state.plans.scriptureRef.book);
    return <Text>{selectedBook.name}, Chapter:</Text>
}

const SelectChapter = () => {
    const selectedBook = useAppSelector(state => state.plans.scriptureRef.book);
    const dispatch = useAppDispatch();
    const navigation = React.useContext(NavigationContext);

    const numberOfChapters = DATA[selectedBook.number - 1].c;
    let chapters = [];

    for (let c = 0; c < numberOfChapters; c++) {
        chapters.push(c + 1);
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                contentContainerStyle={{ alignSelf: 'flex-start' }}
                numColumns={NUM_COLUMNS}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                data={chapters}
                renderItem={({ item, index }) => {
                    return (<Pressable style={localStyles.item} onPress={() => { dispatch(setChapter(item)); navigation?.navigate("Select Start Verse"); }}><Text style={localStyles.title}>{item}</Text></Pressable>);
                }}
            />
        </SafeAreaView>
    );
}

const localStyles = StyleSheet.create({
    item: {
        backgroundColor: FOGWHITE,
        borderColor: GREY,
        borderWidth: 1,
        width: Dimensions.get('window').width / NUM_COLUMNS,
        height: Dimensions.get('window').width / NUM_COLUMNS,
        justifyContent: 'center',
        textAlign: 'center'
    },
    title: {
        fontSize: 22,
        color: MIDNIGHTBLACK,
        fontFamily: 'Inter-Light',
        textAlign: 'center'
    },
});

export default SelectChapter;