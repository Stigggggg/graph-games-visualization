import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Analysis } from "../../src/components/ui/Analysis";

vi.mock("../../src/components/graphs/Graph", () => ({
    Graph: () => <div data-testid="mock-graph"></div>
}));

describe("Analysis Component", () => {
    it("returns null and does not render missing data", () => {
        const { container } = render(<Analysis data={null} onClose={vi.fn()} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("renders winning strategy and history", () => {
        const mockData = {
            is_isomorphic: true,
            winning: "duplicator",
            history: [{
                round: 1,
                played_by_user: true,
                g1_node: "v1",
                g2_node: "u1",
                optimal_g1: "v2",
                optimal_g2: "u2"
            }],
            g1_elements: [],
            g2_elements: []
        };
        render(<Analysis data={mockData} onClose={vi.fn()} />);
        expect(screen.getByText("Post-Game Analysis")).toBeInTheDocument();
        expect(screen.getByText("Isomorphic")).toBeInTheDocument();
        expect(screen.getByText("duplicator")).toBeInTheDocument();
        expect(screen.getByText("Round 1")).toBeInTheDocument();
    });

    it("calls onClose after clicking the button", async () => {
        const handleClose = vi.fn();
        const user = userEvent.setup();
        const mockData = {
            is_isomorphic: false,
            winning: "spoiler",
            history: [],
            g1_elements: [],
            g2_elements: []
        };
        render(<Analysis data={mockData} onClose={handleClose} />);
        const closeButton = screen.getByRole("button", { name: /close/i });
        await user.click(closeButton);
        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});