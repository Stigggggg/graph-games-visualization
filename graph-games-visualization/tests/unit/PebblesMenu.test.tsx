import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PebblesMenu from '../../src/views/PebblesMenu';

vi.mock('../components/graphs/GraphEditor', () => ({
    GraphEditor: () => <div data-testid="mock-graph-editor" />
}));

const renderMenu = () => render(
    <MemoryRouter>
        <PebblesMenu />
    </MemoryRouter>
);

describe('PebblesMenu View', () => {
    it('V, E and k shown for random mode', () => {
        renderMenu();
        expect(screen.getByLabelText(/Vertices \(n\):/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Edges \(n\):/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Number of pebbles \(k\):/i)).toBeInTheDocument();
    });

    it('hides V and E and shows file input, but k stays the same', async () => {
        const user = userEvent.setup();
        renderMenu();
        const sourceSelect = screen.getByLabelText(/Graph source:/i);
        await user.selectOptions(sourceSelect, 'file');
        expect(screen.queryByLabelText(/Vertices \(n\):/i)).not.toBeInTheDocument();
        expect(screen.getByLabelText(/Number of pebbles \(k\):/i)).toBeInTheDocument();
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
    });

    it('shows graph editor in draw mode', async () => {
        const user = userEvent.setup();
        renderMenu();
        const sourceSelect = screen.getByLabelText(/Graph source:/i);
        await user.selectOptions(sourceSelect, 'draw');
        const graphEditors = screen.getAllByTestId('mock-graph-editor');
        expect(graphEditors).toHaveLength(2);
    });

    it('error when game is started without V or E', async () => {
        const user = userEvent.setup();
        renderMenu();
        const startButton = screen.getByText('Start game');
        await user.click(startButton);
        expect(screen.getByText('Please insert the number of vertices and edges!')).toBeInTheDocument();
    });
});