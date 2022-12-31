import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Pressable, SafeAreaView, Text, StyleSheet } from 'react-native';
import { FOGWHITE, GREY, MIDNIGHTBLACK } from './COLORS';
import { database } from './database';
import { useAppDispatch, useAppSelector } from './hooks';
import { setChapter, setStartVerse } from './planSlice';
import { styles } from './SelectBook';

export const VerseSelectionHeader = () => {
    const selectedBook = useAppSelector(state => state.plans.scriptureRef.book);
    const selectedChapter = useAppSelector(state => state.plans.scriptureRef.chapter);

    return <Text>{selectedBook.name} {selectedChapter}, Verses:</Text>;
}

enum QueryStatus {
    NOT_QUERIED,
    OPENED_DB,
    EXECUTING_TRANSACTION,
    EXECUTED_TRANSACTION
}

const NUM_COLUMNS = 6;

const SelectStartVerse = () => {
    const selectedBook = useAppSelector(state => state.plans.scriptureRef.book);
    const selectedChapter = useAppSelector(state => state.plans.scriptureRef.chapter);

    // state
    const [verseCount, setVerseCount] = useState<number>(0);
    const [queryStatus, setQueryStatus] = useState<QueryStatus>(QueryStatus.NOT_QUERIED);

    const dispatch = useAppDispatch();
    useEffect(() => {
        setQueryStatus(QueryStatus.OPENED_DB);
        fetchData();
    }, [])

    const fetchData = async () => {
        database.openDatabase()
            .then((db: any) => {
                database.getVerseCountInChapter(db, selectedBook.number, selectedChapter, setVerseCount);
            })
            .catch((err: any) => {
                console.log("Error", err);
            })
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                contentContainerStyle={{ alignSelf: 'flex-start' }}
                numColumns={NUM_COLUMNS}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                data={Array(verseCount).fill(1).map((element, index) => index + 1)}
                renderItem={({ item, index }) => {
                    return (<Pressable style={localStyles.item} onPress={() => { dispatch(setStartVerse(item)) }}><Text style={localStyles.title}>{item}</Text></Pressable>);
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

export default SelectStartVerse;