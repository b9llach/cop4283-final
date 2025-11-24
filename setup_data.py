import os
import kagglehub
import shutil

def setup_data():
    print("NBA Championship Predictor - Data Setup")
    print("=" * 50)
    print()

    data_dir = "data"

    if os.path.exists(os.path.join(data_dir, "nba.sqlite")):
        print("Database already exists. Skipping download.")
        return

    print("Downloading NBA Basketball Dataset from Kaggle...")
    print("This may take a few minutes (697MB compressed)")
    print()

    try:
        path = kagglehub.dataset_download("wyattowalsh/basketball")
        print(f"Dataset downloaded to: {path}")

        os.makedirs(data_dir, exist_ok=True)

        db_path = os.path.join(path, "nba.sqlite")
        if os.path.exists(db_path):
            dest_path = os.path.join(data_dir, "nba.sqlite")
            print(f"Copying database to {dest_path}")
            shutil.copy2(db_path, dest_path)
            print("Database setup complete!")
        else:
            print("Error: Database file not found in downloaded dataset")
            return

        config_path = os.path.join(data_dir, "config.json")
        if not os.path.exists(config_path):
            import json
            config = {
                "dataset_path": path.replace('\\', '/'),
                "db_path": "data/nba.sqlite"
            }
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
            print("Configuration file created")

        print()
        print("=" * 50)
        print("Data setup successful!")
        print("=" * 50)

    except Exception as e:
        print(f"Error downloading dataset: {e}")
        print()
        print("Please ensure you have:")
        print("1. Kaggle API credentials configured")
        print("2. Internet connection")
        print()
        print("See: https://github.com/Kaggle/kaggle-api#api-credentials")

if __name__ == "__main__":
    setup_data()
