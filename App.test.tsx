import { render, screen } from '@testing-library/react-native';
import React from 'react';
import App from './App';

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