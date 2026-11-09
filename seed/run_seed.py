"""Run seed/demo_company.sql against a MySQL/TiDB server.

Usage (PowerShell):
  $env:DB_HOST="gateway01.ap-northeast-1.prod.aws.tidbcloud.com"
  $env:DB_PORT="4000"
  $env:DB_USER="<prefix>.root"
  $env:DB_PASSWORD="<your password>"
  python seed/run_seed.py
"""
import os
from pathlib import Path

import mysql.connector

sql = Path(__file__).with_name("demo_company.sql").read_text(encoding="utf-8")
# Drop full-line comments, then split into statements.
lines = [l for l in sql.splitlines() if not l.strip().startswith("--")]
statements = [s.strip() for s in "\n".join(lines).split(";") if s.strip()]

conn = mysql.connector.connect(
    host=os.environ["DB_HOST"],
    port=int(os.environ.get("DB_PORT", 3306)),
    user=os.environ["DB_USER"],
    password=os.environ["DB_PASSWORD"],
)
cur = conn.cursor()
for stmt in statements:
    cur.execute(stmt)
conn.commit()
cur.execute("SELECT COUNT(*) FROM company_db.employees")
print("Seeded. employees rows:", cur.fetchone()[0])
cur.close()
conn.close()
