import asyncio
from playwright.async_api import async_playwright
import os

async def verify_final():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        # Check Home
        await page.goto(f"file://{os.getcwd()}/index.html")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="verification/final_home_desktop.png")

        # Check Mobile Home
        mobile_context = await browser.new_context(viewport={'width': 375, 'height': 667}, is_mobile=True)
        mobile_page = await mobile_context.new_page()
        await mobile_page.goto(f"file://{os.getcwd()}/index.html")
        await mobile_page.wait_for_timeout(2000)
        await mobile_page.screenshot(path="verification/final_home_mobile.png")

        # Open Menu on Mobile
        await mobile_page.click("#mobile-menu-btn")
        await mobile_page.wait_for_timeout(1000)
        await mobile_page.screenshot(path="verification/final_home_mobile_menu.png")

        # Check Nihilism Page (Subpage)
        await mobile_page.goto(f"file://{os.getcwd()}/nihilism.html")
        await mobile_page.wait_for_timeout(2000)
        await mobile_page.screenshot(path="verification/final_nihilism_mobile.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_final())
