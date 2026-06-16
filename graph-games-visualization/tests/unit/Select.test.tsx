import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Select } from '../../src/components/ui/Wrappers';

describe('Select Component', () => {
    it('correctly rendering with given options and default value', () => {
        render (
            <Select defaultValue="ai" data-testid="mode-select">
                <option value="human">Human vs Human</option>
                <option value="ai">Human vs AI</option>
            </Select>
        );
        const select = screen.getByTestId('mode-select');
        expect(select).toHaveValue('ai');
        expect(screen.getByText('Human vs AI')).toBeInTheDocument();
    });

    it('onChange triggers after choosing other option', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();
        render(
            <Select onChange={handleChange} data-testid="source-select">
                <option value="random">Randomly generated</option>
                <option value="file">Uploaded from file</option>
            </Select>
        );
        const select = screen.getByTestId('source-select');
        await user.selectOptions(select, 'file');
        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(select).toHaveValue('file');
    });
});