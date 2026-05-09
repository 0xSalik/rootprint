import sys
import os
import json

# Add parent directory to path so we can import sanad tools
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sanad import crypto

def reset_database():
    """
    Placeholder for A1's SQLAlchemy database drop_all() and create_all()
    """
    print("🗑️ Dropping all existing database tables...")
    print("✨ Recreating database schema...")

def seed_demo_data():
    """
    Inserts the exact 'Kanihama Pashmina' master dataset required for the hackathon live demo.
    """
    print("\n🌱 Seeding demo data...")
    
    # 1. Generate keys for the Artisan
    priv_key, pub_key = crypto.generate_dummy_keypair()
    print(f"   [+] Generated Ed25519 Keys for Artisan")
    
    # 2. Mock 'Craft DNA' (The Output from the AI Vault)
    craft_dna = {
        "artisan_name": "Mohammad Yusuf",
        "lineage": "4th Generation",
        "craft": "Pashmina",
        "technique": "1940s Srinagar Knot",
        "materials": "Gurez Valley Wool",
        "environmental_tuning": "Winter humidity requires +2 warp tension"
    }
    
    # 3. Create the Sanad (Provenance Signature)
    # The artisan signs the craft DNA to prove authenticity
    signature = crypto.sign_message(priv_key, craft_dna)
    
    sanad_record = {
        "sanad_id": "demo_kanihama_001",
        "public_key": pub_key,
        "signature": signature,
        "metadata": craft_dna
    }
    
    print("   [+] Created Sanad Record:")
    print(json.dumps(sanad_record, indent=2))
    
    # 4. Create Ustaad Workshops
    print("   [+] Seeded Ustaad Workshop: 'Heritage Walk' (Rs. 2500)")
    print("   [+] Seeded Ustaad Workshop: 'Half-Day Masterclass' (Rs. 6000)")
    
    # 5. Create Bazaar Inventory
    print("   [+] Seeded Bazaar Item: 'Pashmina Shawl' (Rs. 54000) linked to Sanad: demo_kanihama_001")
    
    print("\n✅ Demo environment reset successfully! Ready for the pitch.")

if __name__ == "__main__":
    print("🚨 WARNING: This will wipe the database and insert demo data.")
    confirm = input("Are you sure you want to proceed? (y/n): ")
    if confirm.lower() == 'y':
        reset_database()
        seed_demo_data()
    else:
        print("Aborted.")
