import { test, expect } from '@playwright/test';

// Ustawiamy bazowy adres, żeby nie wpisywać go w każdym teście
const BASE_URL = 'http://localhost:5173';

test.describe('Graph Games E2E - Interfejs i Nawigacja', () => {
    
    test('Użytkownik może przejść z Menu do gry w Kamyki (Pebbles)', async ({ page }) => {
        await page.goto(BASE_URL);
        
        // Kliknięcie w przycisk Pebbles
        await page.click('text=Pebbles');
        
        // Sprawdzenie przekierowania
        await expect(page).toHaveURL(/.*pebbles-menu/);
        
        // Upewnienie się, że jesteśmy w dobrym menu (szukamy unikalnego pola 'k')
        await expect(page.locator('text=Number of pebbles (k):')).toBeVisible();
    });

    test('Formularz EF Menu poprawnie zmienia się w tryb rysowania (Draw)', async ({ page }) => {
        await page.goto(`${BASE_URL}/ef-menu`);
        
        // Zmiana opcji w selekcie źródła grafu
        const sourceSelect = page.getByLabel(/Graph source:/i);
        await sourceSelect.selectOption('draw');
        
        // W trybie rysowania na ekranie powinny pojawić się sekcje Draw G1 i Draw G2
        await expect(page.locator('text=Draw G1')).toBeVisible();
        await expect(page.locator('text=Draw G2')).toBeVisible();
        
        // Pola numeryczne powinny zniknąć
        await expect(page.locator('text=Vertices (n):')).not.toBeVisible();
    });

    test('Walidacja blokuje start gry przy pustych polach w trybie Random', async ({ page }) => {
        await page.goto(`${BASE_URL}/pebbles-menu`); // Testujemy na menu kamyków
        
        // Natychmiastowe kliknięcie start bez wypełniania V i E
        await page.click('text=Start game');
        
        // Serwer nie powinien zostać odpytany, a na ekranie ma pojawić się czerwony błąd
        await expect(page.locator('text=Please insert the number of vertices and edges!')).toBeVisible();
    });
});

test.describe('Graph Games E2E - Integracja Full-Stack (Wymaga działającego Backendu!)', () => {
    
    test('Pomyślne wygenerowanie losowej gry EF i wejście na główną planszę', async ({ page }) => {
        // TEN TEST SPRAWDZA POŁĄCZENIE Z FLASKIEM!
        await page.goto(`${BASE_URL}/ef-menu`);
        
        // 1. Użytkownik wypełnia formularz (V=4, E=3, Rounds=3)
        // Ze względu na strukturę komponentu Input ułatwiamy sobie szukanie pól
        const inputs = page.locator('input[type="number"]');
        await inputs.nth(0).fill('4'); // Vertices
        await inputs.nth(1).fill('3'); // Edges
        await inputs.nth(2).fill('3'); // Rounds
        
        // 2. Wybieramy grę z AI
        const modeSelect = page.getByLabel(/Game mode:/i);
        await modeSelect.selectOption('ai');

        // 3. Rozpoczęcie gry (To wyśle zapytanie POST na http://127.0.0.1:5000/generate-ef)
        await page.click('text=Start game');

        // 4. Jeśli serwer odpowie poprawnie (kod 200), aplikacja przerzuci nas na ekran gry
        await expect(page).toHaveURL(/.*ef/);

        // 5. Weryfikujemy, czy załadował się ekran rozgrywki
        await expect(page.locator('text=Status: Waiting for first move')).toBeVisible();
        await expect(page.locator('text=Round: 1/3')).toBeVisible();
        
        // 6. Sprawdzamy czy przestrzenie dla grafów G1 i G2 są obecne na ekranie
        await expect(page.locator('text=G1').first()).toBeVisible();
        await expect(page.locator('text=G2').first()).toBeVisible();
        
        // Opcjonalnie: można sprawdzić, czy przycisk wyjścia jest aktywny
        await expect(page.locator('text=Exit game')).toBeEnabled();
    });
});