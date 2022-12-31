import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PlanSelectionStatus } from './PlanSelectionStatus';
import type { RootState } from './store';



// Define a type for the slice state
interface MemPlanState {
    scriptureRef: {
        book: number,
        chapter: number,
        startVerse: number,
        endVerse: number,
    },
    versesPerWeek: number,
    startDate: string,
    reviewDay: number
    status: PlanSelectionStatus
}

// Define the initial state using that type
const initialState: MemPlanState = {
    scriptureRef: {
        book: 1,
        chapter: 1,
        startVerse: 1,
        endVerse: 1,
    },
    versesPerWeek: 2,
    startDate: (new Date()).toString(),
    reviewDay: (new Date()).getDay(),
    status: PlanSelectionStatus.NotChosen
}

export const counterSlice = createSlice({
    name: 'counter',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: {
        setBook: (state, action: PayloadAction<number>) => {
            state.scriptureRef.book = action.payload;
            state.status = PlanSelectionStatus.ChoosingChapter;
        },
        setChapter: (state, action: PayloadAction<number>) => {
            state.scriptureRef.chapter = action.payload;
            state.status = PlanSelectionStatus.ChoosingEndVerse;
        },
        setStartVerse: (state, action: PayloadAction<number>) => {
            state.scriptureRef.startVerse = action.payload;
            state.status = PlanSelectionStatus.ChoosingEndVerse;
        },
        setEndVerse: (state, action: PayloadAction<number>) => {
            state.scriptureRef.startVerse = action.payload;
            state.status = PlanSelectionStatus.ChoosingStartDate;
        },
        setStartDate: (state, action: PayloadAction<string>) => {
            state.startDate = action.payload;
            state.status = PlanSelectionStatus.ChoosingReviewDay;
        },
        setReviewDay: (state, action: PayloadAction<string>) => {
            state.startDate = action.payload;
            state.status = PlanSelectionStatus.Chosen;
        },
    },
})

export const { setBook, setChapter, setStartVerse, setEndVerse, setStartDate, setReviewDay } = counterSlice.actions;

export default counterSlice.reducer