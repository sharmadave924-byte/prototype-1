import asyncio
from playwright.async_api import async_playwright
import os

async def verify_subpages():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # Mobile view
        iphone = p.devices['iPhone 13']
        context = await browser.new_context(**iphone)
        page = await context.new_page()

        output_dir = "/home/jules/verification/subpages"
        os.makedirs(output_dir, exist_ok=True)

        subpages = ["zen.html", "nihilism.html", "debate.html"]

        for sp in subpages:
            url = f"file://{os.getcwd()}/{sp}"
            print(f"Verifying {url}...")
            await page.goto(url)
            await asyncio.sleep(2) # wait for animations

            # Take normal screenshot
            await page.screenshot(path=f"{output_dir}/{sp.replace('.html', '_mobile.png')}")

            # Verify and screenshot mobile menu
            menu_btn = page.locator("#mobile-menu-btn")
            if await menu_btn.is_visible():
                await menu_btn.click()
                await asyncio.sleep(1) # wait for menu animation
                await page.screenshot(path=f"{output_dir}/{sp.replace('.html', '_mobile_menu.png')}")
                # Close menu
                close_btn = page.locator("#mobile-menu-close")
                await close_btn.click()
                await asyncio.sleep(1)
            else:
                print(f"WARNING: Mobile menu button not found on {sp}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_subpages())
