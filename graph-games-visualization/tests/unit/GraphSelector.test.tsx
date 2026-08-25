import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi} from "vitest";
import { GraphSelector } from "../../src/components/ui/GraphSelector";

describe("GraphSelector Component", () => {
    it("renders label and default options", () => {
        render(<GraphSelector title="Choose G1:" value="random" onChange={vi.fn()} />);
        expect(screen.getByText("Choose G1:")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: /Randomly generated/i })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: /Clique/i })).toBeInTheDocument();
    });

    it("calls onChange with correct value", async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();
        const Wrapper = () => {
            const [value, setValue] = React.useState<any>("random");
            return <GraphSelector title="Graph Type" value={value} onChange={(newValue) => {
                setValue(newValue);
                handleChange(newValue);
            }} />
        };
        render(<Wrapper />)
        const select = screen.getByRole("combobox");
        fireEvent.change(select, { target: { value: 'star' } });
        expect(handleChange).toHaveBeenCalledWith("star");
        expect(handleChange).toHaveBeenCalledTimes(1);
    });
})