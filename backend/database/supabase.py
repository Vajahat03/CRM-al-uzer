"""
Backend Database Client
Provides clean REST client to Supabase tables avoiding namespace conflicts with local ./supabase folder.
"""

import os
import urllib.parse
from typing import Optional, Dict, Any, List
import requests

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://hlysqtzhyjbbnjkdfwqu.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhseXNxdHpoeWpiYm5qa2Rmd3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4Mjg4MDksImV4cCI6MjA4NzQwNDgwOX0.Y86oA0F-aK412xHqVd5y6Ew6o3n9m3m1j-5r7k4f8x9"))

class TableQuery:
    def __init__(self, base_url: str, headers: Dict[str, str], table_name: str):
        self.endpoint = f"{base_url.rstrip('/')}/rest/v1/{table_name}"
        self.headers = headers
        self.params: Dict[str, str] = {}
        self.filters: List[str] = []

    def select(self, columns: str = "*", count: str = None):
        self.params["select"] = columns
        if count:
            self.headers["Prefer"] = f"count={count}"
        return self

    def ilike(self, column: str, pattern: str):
        self.params[column] = f"ilike.{pattern}"
        return self

    def or_(self, condition: str):
        self.params["or"] = f"({condition})"
        return self

    def gte(self, column: str, value: str):
        self.params[column] = f"gte.{value}"
        return self

    def lte(self, column: str, value: str):
        self.params[column] = f"lte.{value}"
        return self

    def lt(self, column: str, value: str):
        self.params[column] = f"lt.{value}"
        return self

    def order(self, column: str, desc: bool = False):
        self.params["order"] = f"{column}.{'desc' if desc else 'asc'}"
        return self

    def limit(self, count: int):
        self.params["limit"] = str(count)
        return self

    def execute(self):
        class Result:
            def __init__(self, data, count=None):
                self.data = data
                self.count = count

        try:
            res = requests.get(self.endpoint, headers=self.headers, params=self.params, timeout=10)
            if not res.ok:
                print(f"[Supabase REST] Error {res.status_code}: {res.text}")
                return Result([], 0)

            data = res.json()
            count = None
            cr = res.headers.get("Content-Range")
            if cr and "/" in cr:
                try:
                    count = int(cr.split("/")[1])
                except Exception:
                    pass
            if count is None:
                count = len(data) if isinstance(data, list) else 0

            return Result(data if isinstance(data, list) else [], count)
        except Exception as e:
            print(f"[Supabase REST] Request failed: {e}")
            return Result([], 0)

class SupabaseClient:
    def __init__(self, base_url: str, key: str):
        self.base_url = base_url
        self.key = key
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }

    def table(self, table_name: str) -> TableQuery:
        return TableQuery(self.base_url, dict(self.headers), table_name)

_client = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)

def get_supabase_client() -> SupabaseClient:
    return _client
