import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import PebblesMenu from "../../src/views/PebblesMenu";

vi.mock("../../src/components/graphs/GraphEditor", () => ({
    GraphEditor: () => <div data-testid="graph-editor-mock" />
}));

const renderMenu = () => render(
    <MemoryRouter>
        <PebblesMenu />
    </MemoryRouter>
);

describe("PebblesMenu View", () => {
    it("V, E and k shown for random mode", () => {
        renderMenu();
        expect(screen.getByLabelText(/Vertices \(n\):/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Edges \(m\):/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Number of pebbles \(k\):/i)).toBeInTheDocument();
    });

    it("hides V, E and k, then shows file input", async () => {
        const user = userEvent.setup();
        renderMenu();
        const sourceSelect = screen.getAllByRole("combobox")[0];
        await user.selectOptions(sourceSelect, "file");
        expect(screen.queryByText(/Vertices \(n\):/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Edges \(m\):/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Number of pebbles \(k\):/i)).not.toBeInTheDocument();
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
    });

    it("shows graph editor in draw mode", async () => {
        const user = userEvent.setup();
        renderMenu();
        const sourceSelect = screen.getByLabelText(/Graph source:/i);
        await user.selectOptions(sourceSelect, "draw");
        const graphEditors = screen.getAllByTestId("graph-editor-mock");
        expect(graphEditors).toHaveLength(2);
    });

    it("error when game is started without given k", async () => {
        const user = userEvent.setup();
        renderMenu();
        const startButton = screen.getByText("Start game");
        await user.click(startButton);
        expect(screen.getByText(/Number of pebbles must be between 2 and 4!/i)).toBeInTheDocument();
    });
});