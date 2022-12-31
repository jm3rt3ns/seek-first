import React from 'react'

import * as SQLite from "expo-sqlite"
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

const openDatabase = async (): Promise<SQLite.WebSQLDatabase> => {
    const pathToDatabaseFile = "./assets/bible-sqlite.db";
    if (!(await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'SQLite')).exists) {
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'SQLite');
    }
    await FileSystem.downloadAsync(
        Asset.fromModule(require(pathToDatabaseFile)).uri,
        FileSystem.documentDirectory + 'SQLite/bible-sqlite.db'
    );
    return SQLite.openDatabase('bible-sqlite.db');
}


const getVerseCountInChapter = (db: any, bookNum: number, chapterNum: number, setVerseCount: React.Dispatch<React.SetStateAction<number>>) => {
    db.transaction(tx => {
        console.log("executed");
        const currentChapter = bookNum.toString().padStart(2, "0") + chapterNum.toString().padStart(3, "0") + "001";
        const nextChapter = bookNum.toString().padStart(2, "0") + (chapterNum + 1).toString().padStart(3, "0") + "001";
        console.log(currentChapter);
        tx.executeSql("SELECT count(*) FROM t_asv WHERE id BETWEEN ? and ?", [currentChapter, nextChapter],
            (txObj: any, { rows: { _array } }) => {
                console.log(_array);
                setVerseCount(_array[0]["count(*)"]);
                db.closeAsync();
            },
            (txObj: any, error: any) => {
                console.log('Error ', error);
                db.closeAsync();
                return true;
            }
        )
    })
}

export const database = {
    getVerseCountInChapter,
    openDatabase
}