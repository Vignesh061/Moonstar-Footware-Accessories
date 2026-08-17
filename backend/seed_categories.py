"""
Seed script — inserts the 7 default categories.
Run from the backend folder:
    python seed_categories.py
"""
from app import create_app
from app.extensions import db
from app.models.category import Category

CATEGORIES = [
    {"name": "Belts",       "slug": "belts",        "description": "Premium leather and fabric belts for men.", "sort_order": 1},
    {"name": "Socks",       "slug": "socks",        "description": "Cotton, wool and sports socks for everyday wear.", "sort_order": 2},
    {"name": "Perfumes",    "slug": "perfumes",     "description": "Long-lasting fragrances and deodorants for men.", "sort_order": 3},
    {"name": "Shoe Polish", "slug": "shoe-polish",  "description": "Shoe polish, creams and care products.", "sort_order": 4},
    {"name": "Locks",       "slug": "locks",        "description": "Padlocks, combination locks and security locks.", "sort_order": 5},
    {"name": "Men's Purse", "slug": "mens-purses",  "description": "Wallets, card holders and money clips for men.", "sort_order": 6},
    {"name": "Slippers",    "slug": "slippers",     "description": "Comfortable home and casual slippers for men.", "sort_order": 7},
]

def seed():
    app = create_app()
    with app.app_context():
        added = 0
        skipped = 0
        for cat_data in CATEGORIES:
            existing = Category.query.filter_by(slug=cat_data["slug"]).first()
            if existing:
                print(f"  SKIP  — '{cat_data['name']}' already exists")
                skipped += 1
                continue

            cat = Category(
                name=cat_data["name"],
                slug=cat_data["slug"],
                description=cat_data["description"],
                sort_order=cat_data["sort_order"],
                is_active=True,
            )
            db.session.add(cat)
            print(f"  ADD   — '{cat_data['name']}'")
            added += 1

        db.session.commit()
        print(f"\nDone — {added} added, {skipped} skipped.")

if __name__ == "__main__":
    seed()
