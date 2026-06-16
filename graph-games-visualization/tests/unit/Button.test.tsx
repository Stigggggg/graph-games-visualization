import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../../src/components/ui/Button';

describe('Button Component', () => {
    it('correctly renders text inside the button', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('calls function after the click', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();
        render(<Button onClick={handleClick}>Start</Button>);
        const button = screen.getByText('Start');
        await user.click(button);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('blocks interactions and applies new style when disabled', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();
        render(<Button disabled onClick={handleClick}>Blocked</Button>);
        const button = screen.getByText('Blocked');
        await user.click(button);
        expect(button).toBeDisabled();
        expect(handleClick).not.toHaveBeenCalled();
        expect(button.className).toContain('disabled:opacity-50');
    });
});