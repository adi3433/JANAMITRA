from playwright.sync_api import sync_playwright
import time
import json

BASE = "https://www.eci.gov.in/faq/{}/{}"


def scrape() -> tuple[list[str], list[dict]]:
    blocks: list[str] = []
    faq_list: list[dict] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        for cat in range(1, 20):
            for pg in range(1, 20):
                url = BASE.format(cat, pg)
                page.goto(url)
                time.sleep(2)

                text = page.inner_text("body")
                if "No data found" in text:
                    break

                questions = page.query_selector_all("h3")
                answers = page.query_selector_all("p")

                for q, a in zip(questions, answers):
                    q_text = q.inner_text().strip()
                    a_text = a.inner_text().strip()

                    block = f"""
CATEGORY: {cat}
PAGE: {pg}

Q: {q_text}

A: {a_text}

SOURCE: {url}

----------------------------------
"""
                    blocks.append(block)

                    faq_list.append(
                        {
                            "category": cat,
                            "page": pg,
                            "question": q_text,
                            "answer": a_text,
                            "url": url,
                        }
                    )

                print("Scraped", url)

        browser.close()

    return blocks, faq_list


if __name__ == "__main__":
    txt_blocks, faq_json = scrape()

    with open("eci_faq.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(txt_blocks))

    with open("eci_faq.json", "w", encoding="utf-8") as f:
        json.dump(faq_json, f, indent=2, ensure_ascii=False)

    print("DONE")
