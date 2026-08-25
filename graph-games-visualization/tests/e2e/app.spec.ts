import { test, expect } from "@playwright/test";

const url = "http://localhost:5173";

test.describe("interface and navigation", () => {
    test("going from menu to pebbles game", async ({ page }) => {
        await page.goto(url);
        await page.click("text=Pebbles");
        await expect(page).toHaveURL(/.*pebbles-menu/);
        await expect(page.locator("text=Number of pebbles (k):")).toBeVisible();
    });

    test("changing mode into draw", async ({ page }) => {
        await page.goto(`${url}/ef-menu`);
        const sourceSelect = page.getByLabel(/Graph source:/i);
        await sourceSelect.selectOption("draw");
        await expect(page.locator("text=Draw G1")).toBeVisible();
        await expect(page.locator("text=Draw G2")).toBeVisible();
        await expect(page.locator("text=Vertices (n):")).not.toBeVisible();
    });

    test("empty fields in random mode fail validation", async ({ page }) => {
        await page.goto(`${url}/pebbles-menu`);
        await page.click("text=Start game");
        await expect(page.locator("text=Number of pebbles must be between 2 and 4!")).toBeVisible();
    });

    test("different graph templates in menu", async ({ page }) => {
        await page.goto(`${url}/ef-menu`)
        const selected = page.getByRole("combobox");
        const starSelect = selected.nth(1);
        await starSelect.selectOption("star");
        const cliqueSelect = selected.nth(2);
        await cliqueSelect.selectOption("clique");
        await expect(starSelect).toHaveValue("star");
        await expect(cliqueSelect).toHaveValue("clique");
    });
});

test.describe("full stack integration", () => {
    test("succesfully generating random EF game and entering the game", async ({ page }) => {
        await page.goto(`${url}/ef-menu`);
        const inputs = page.locator('input[type="number"]');
        await inputs.nth(0).fill("4");
        await inputs.nth(1).fill("3");
        await inputs.nth(2).fill("3");
        const modeSelect = page.getByLabel(/Game mode:/i);
        await modeSelect.selectOption("ai");
        await page.click("text=Start game");
        await expect(page).toHaveURL(/.*ef/);
        await expect(page.locator("text=Server: Waiting for first move")).toBeVisible();
        await expect(page.locator("text=Round: 1 / 3")).toBeVisible();
        await expect(page.locator("text=G1").first()).toBeVisible();
        await expect(page.locator("text=G2").first()).toBeVisible();
        await expect(page.locator("text=Exit game")).toBeEnabled();
    });

    test("succesfully generating random Pebbles game and entering the game", async ({ page }) => {
        await page.goto(`${url}/pebbles-menu`);
        const inputs = page.locator('input[type="number"]');
        await inputs.nth(0).fill("4");
        await inputs.nth(1).fill("3");
        await inputs.nth(2).fill("3");
        const modeSelect = page.getByLabel(/Game mode:/i);
        await modeSelect.selectOption("ai");
        await page.click("text=Start game");
        await expect(page).toHaveURL(/.*pebbles/);
        await expect(page.locator("text=Server: Waiting for first move")).toBeVisible();
        await expect(page.locator("text=Pebbles: 3")).toBeVisible();
        await expect(page.locator("text=G1").first()).toBeVisible();
        await expect(page.locator("text=G2").first()).toBeVisible();
        await expect(page.locator("text=Exit game")).toBeEnabled();
    });

    test("exiting the game returns to main menu", async ({ page }) => {
        await page.goto(`${url}/ef-menu`);
        const inputs = page.locator('input[type="number"]');
        await inputs.nth(0).fill("4");
        await inputs.nth(1).fill("3");
        await inputs.nth(2).fill("3");
        await page.click("text=Start game");
        await expect(page).toHaveURL(/.*ef/);
        await page.click("text=Exit game");
        await expect(page).toHaveURL(url + "/");
    })
});