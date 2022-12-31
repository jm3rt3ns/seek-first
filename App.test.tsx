import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import App from './App';
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

describe('General Meta checks', () => {
    it('has app name somewhere on main page', async () => {
        render(<App />);

        await screen.findByText("Welcome.");
    })

    it('should show a book and chapter selection when no plan is active', async () => {
        render(<App />);

        await screen.findByText("Select Book");
    })
})

describe("Select a passage to memorize", () => {
    it('opens book selection drawer when "Select Book" is touched', async () => {
        render(<App />);

        await act(async () => {
            const selectButton = await screen.findByText("Select Book");
            fireEvent.press(selectButton);
        })

        const bookOption = await screen.findByText("Leviticus");
        expect(bookOption).toBeDefined();
    })

    it('opens chapter selection screen when a book is selected', async () => {
        render(<App />);

        await act(async () => {
            const selectButton = await screen.findByText("Select Book");
            fireEvent.press(selectButton);
        })

        const bookOption = screen.getByText("Leviticus");

        act(() => {
            fireEvent.press(bookOption);
        })

        const chapterOptions = screen.getAllByText("Leviticus, Chapter:");
        expect(chapterOptions.length).toEqual(2);
    })

    it('opens verse selection screen when a book is selected', async () => {
        render(<App />);

        await act(async () => {
            const selectButton = await screen.findByText("Select Book");
            fireEvent.press(selectButton);
        })

        const bookOption = screen.getByText("Leviticus");

        act(() => {
            fireEvent.press(bookOption);
        })

        const chapterOptions = screen.getAllByText("Leviticus, Chapter:");
        expect(chapterOptions.length).toEqual(2);

        act(() => {
            fireEvent.press(screen.getByText("21"));
        })

        const verseHeader = screen.getAllByText("Leviticus 21, Verses:");
        expect(verseHeader.length).toEqual(2);
    })
})