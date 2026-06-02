from groq import Groq
from pathlib import Path
from db import execute_query


def create_query(statement, schema_path="schema.txt", api_key=""):
    schema = Path(schema_path).read_text(encoding="utf-8")

    prompt = f"Database Schema:\n{schema}\n\nStatement: {statement}\n\nGenerate the MySQL query:"

    response = Groq(api_key=api_key).chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": (
                "You are an expert MySQL query generator. Follow these rules strictly:\n\n"
                "RULE 1 — DDL (CREATE TABLE, ALTER TABLE ADD COLUMN):\n"
                "Generate the SQL immediately. Do NOT look at the schema. Do NOT validate anything. "
                "Just produce the exact SQL the user asked for.\n\n"
                "RULE 2 — Everything else (SELECT, INSERT, UPDATE, DELETE, DROP, JOIN, etc.):\n"
                "Validate every table and column against the provided schema. "
                "If anything is missing or ambiguous, reply ONLY with: CLARIFY: <reason>. "
                "Otherwise generate the SQL.\n\n"
                "OUTPUT RULES (always):\n"
                "- Return exactly one SQL statement.\n"
                "- No markdown, no code fences, no explanation, no extra text.\n"
                "- End with a semicolon."
            )},
            {"role": "user", "content": prompt}
        ]
    )

    query = response.choices[0].message.content
    query = query.replace("```sql", "").replace("```", "").strip()

    is_clarify = query.upper().startswith("CLARIFY")

    if not is_clarify and not query.endswith(";"):
        query += ";"

    return query


def print_query_details(result):
    print(result["message"])

    if not result["with_rows"]:
        return

    columns = result["columns"]
    rows = result["rows"]

    widths = []
    for col in columns:
        widths.append(len(col))

    for row in rows:
        idx = 0
        for value in row:
            widths[idx] = max(widths[idx], len(str(value)))
            idx += 1

    header_parts = []
    idx = 0
    for col in columns:
        header_parts.append(col.ljust(widths[idx]))
        idx += 1

    separator_parts = []
    for width in widths:
        separator_parts.append("-" * width)

    header = " | ".join(header_parts)
    separator = "-+-".join(separator_parts)

    print(header)
    print(separator)

    for row in rows:
        row_parts = []
        idx = 0
        for value in row:
            row_parts.append(str(value).ljust(widths[idx]))
            idx += 1
        print(" | ".join(row_parts))


def iterate_queries():
    while True:
        statement = input("Enter your request (or 'exit' to quit): ")
        if statement.lower() == "exit":
            break
        try:
            query = create_query(statement)
            is_clarify = query.strip().upper().startswith("CLARIFY")

            if is_clarify:
                clarification = query.split(":", 1)[1].strip().rstrip(";")
                print(f"Clarification needed: {clarification}")
            else:
                print(f"Generated SQL: {query}")
                result = execute_query(query)
                print_query_details(result)
        except Exception as exc:
            print(f"Error: {exc}")
        print()

if __name__ == "__main__":
    iterate_queries()