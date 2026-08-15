import sqlite3
conn = sqlite3.connect('clubtech.db')
cur = conn.cursor()
tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print('Tables:', tables)
for t in tables:
    count = cur.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    print(f"  {t}: {count} rows")

# Check for duplicate member numbers
dupes = cur.execute("SELECT member_number, COUNT(*) as c FROM members GROUP BY member_number HAVING c > 1").fetchall()
print("Duplicate member_numbers:", dupes if dupes else "None")

# Show all members
members = cur.execute("SELECT id, member_number, first_name, last_name, email, is_bureau FROM members ORDER BY id").fetchall()
print("\nAll members:")
for m in members:
    print(f"  ID={m[0]}, Num={m[1]}, Name={m[2]} {m[3]}, Email={m[4]}, Bureau={m[5]}")
conn.close()
