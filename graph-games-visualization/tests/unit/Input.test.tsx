import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '../../src/components/ui/Wrappers';

describe ('Input Component', () => {
    it('correctly rendering with a placeholder', () => {
        render(<Input placeholder="Wpisz liczbę wierzchołków" />);
        expect(screen.getByPlaceholderText('Wpisz liczbę wierzchołków')).toBeInTheDocument();
    });

    it('correct text writing and value update', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();
        render(<Input onChange={handleChange} />);
        const input = screen.getByRole('textbox');
        await user.type(input, '5');
        expect(handleChange).toHaveBeenCalled();
        expect(input).toHaveValue('5');
    });
});