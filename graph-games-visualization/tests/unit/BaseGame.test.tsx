import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, test } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { BaseGame } from "../../src/components/ui/BaseGame";

window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe("BaseGame Component", () => {
    const testData = {
        title: "Test",
        dashboard: <div data-testid="mock-dashboard">Dashboard</div>,
        status: "playing",
        g1Title: "Graph 1",
        g1Graph: <div data-testid="mock-g1">G1</div>,
        g2Title: "Graph 2",
        g2Graph: <div data-testid="mock-g2">G2</div>,
        menuRoute: "/menu"
    };

    it("renders basic game layout", () => {
        render(
            <MemoryRouter>
                <BaseGame {...testData} />
            </MemoryRouter>
        );
        expect(screen.getByText("Test")).toBeInTheDocument();
        expect(screen.getByTestId("mock-dashboard")).toBeInTheDocument();
        expect(screen.getByText("Graph 1")).toBeInTheDocument();
    });

    it("renders history panel with history field", () => {
        const mockHistory = [
            {
                id: 1,
                text: "Game generated!",
                type: "system" as const
            },
            {
                id: 2,
                text: "Spoiler selected v1",
                type: "spoiler" as const
            }
        ];
        render(
            <MemoryRouter>
                <BaseGame {...testData} history={mockHistory} />
            </MemoryRouter>
        );
        expect(screen.getByText("📜 Game History")).toBeInTheDocument();
        expect(screen.getByText("Game generated!")).toBeInTheDocument();
        expect(screen.getByText("Spoiler selected v1")).toBeInTheDocument();
    });
});