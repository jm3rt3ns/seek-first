import { render, screen } from '@testing-library/react-native';
import React from 'react';
import App from './App';

describe('General Meta checks', () => {
    it('has app name somewhere on main page', async () => {
        render(<App />);

        await screen.findByText("Seek First");
    })
})