import json
import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient

load_dotenv()

app = Flask(__name__)
CORS(app)

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "look_pilot")
MONGO_PILOT_COLLECTION = os.getenv("MONGO_PILOT_COLLECTION", "pilot")
MONGO_USERS_COLLECTION = os.getenv("MONGO_USERS_COLLECTION", "users")

client = MongoClient(MONGO_URI) if MONGO_URI else None
db = client[MONGO_DB_NAME] if client else None
pilot_coll = db[MONGO_PILOT_COLLECTION] if db else None
users_coll = db[MONGO_USERS_COLLECTION] if db else None

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DATA_DIR = BASE_DIR.parent / "public" / "data"


def strip_id(doc):
    if doc is None:
        return None
    clean = dict(doc)
    clean.pop("_id", None)
    return clean


def load_json_file(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def seed_data():
    if not pilot_coll or not users_coll:
        return

    try:
        pilot_exists = pilot_coll.find_one({"_id": "pilot"})
        if not pilot_exists:
            pilot_path = PUBLIC_DATA_DIR / "pilot.json"
            if pilot_path.exists():
                data = load_json_file(pilot_path)
                data["_id"] = "pilot"
                pilot_coll.insert_one(data)

        users_count = users_coll.count_documents({})
        if users_count == 0:
            users_path = PUBLIC_DATA_DIR / "users.json"
            if users_path.exists():
                users = load_json_file(users_path)
                if isinstance(users, list):
                    users_coll.insert_many(users)
    except Exception as exc:  # pragma: no cover - startup guard
        print(f"Seed error: {exc}")


@app.route("/data/pilot.json", methods=["GET", "PUT"])
def pilot_data():
    if not pilot_coll:
        return jsonify({"error": "database not configured"}), 500

    if request.method == "GET":
        doc = pilot_coll.find_one({"_id": "pilot"})
        if not doc:
            return jsonify({}), 404
        return jsonify(strip_id(doc))

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "invalid payload"}), 400

    payload["_id"] = "pilot"
    pilot_coll.replace_one({"_id": "pilot"}, payload, upsert=True)
    return jsonify(strip_id(payload))


@app.route("/data/users.json", methods=["GET", "PUT"])
def users_data():
    if not users_coll:
        return jsonify({"error": "database not configured"}), 500

    if request.method == "GET":
        docs = [strip_id(doc) for doc in users_coll.find({})]
        return jsonify(docs)

    payload = request.get_json(silent=True)
    if not isinstance(payload, list):
        return jsonify({"error": "invalid payload"}), 400

    users_coll.delete_many({})
    if payload:
        users_coll.insert_many(payload)
    return jsonify({"ok": True, "count": len(payload)})


@app.route("/api/login", methods=["POST"])
def api_login():
    if not users_coll:
        return jsonify({"ok": False, "reason": "not_configured"}), 500

    payload = request.get_json(silent=True) or {}
    phone = str(payload.get("phone", "")).strip()
    user = users_coll.find_one({"phone": phone})
    if not user:
        return jsonify({"ok": False, "reason": "not_found"}), 404
    return jsonify({"ok": True, "user": strip_id(user)})


seed_data()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    app.run(host="0.0.0.0", port=port, debug=True)
