import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import EFMenu from '../../src/views/EFMenu';

vi.mock('../../src/components/graphs/GraphEditor', () => ({
    GraphEditor: () => <div data-testid="graph-editor-mock" />
}));

const renderMenu = () => render(
    <MemoryRouter>
        <EFMenu />
    </MemoryRouter>
);

describe('EFMenu View', () => {
    it('V and E shown for random mode', () => {
        renderMenu();
        expect(screen.getByLabelText(/Vertices \(n\):/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Edges \(m\):/i)).toBeInTheDocument();
    });

    it('hides V and E and shows file input', async () => {
        const user = userEvent.setup();
        renderMenu();
        const sourceSelect = screen.getByLabelText(/Graph source:/i);
        await user.selectOptions(sourceSelect, 'file');
        expect(screen.queryByLabelText(/Vertices \(n\):/i)).not.toBeInTheDocument();
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
    });

    it('shows graph editor in draw mode', async () => {
        const user = userEvent.setup();
        renderMenu();
        const sourceSelect = screen.getByLabelText(/Graph source:/i);
        await user.selectOptions(sourceSelect, 'draw');
        const graphEditors = screen.getAllByTestId('graph-editor-mock');
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