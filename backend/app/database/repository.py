from app.database.supabase_client import get_supabase


def create_article(data: dict) -> dict:
    result = get_supabase().table("articles").insert(data).execute()
    return result.data[0]


def get_article(article_id: str) -> dict | None:
    result = (
        get_supabase()
        .table("articles")
        .select("*")
        .eq("id", article_id)
        .maybe_single()
        .execute()
    )
    return result.data


def list_articles() -> list[dict]:
    result = (
        get_supabase()
        .table("articles")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    articles = result.data

    # For each article, get the unsupported_count from its latest generated article's fact checks
    for article in articles:
        gen_result = (
            get_supabase()
            .table("generated_articles")
            .select("id")
            .eq("article_id", article["id"])
            .order("version", desc=True)
            .limit(1)
            .execute()
        )
        if gen_result.data:
            gen_id = gen_result.data[0]["id"]
            checks_result = (
                get_supabase()
                .table("fact_checks")
                .select("id")
                .eq("generated_article_id", gen_id)
                .eq("status", "unsupported")
                .execute()
            )
            article["unsupported_count"] = len(checks_result.data)
        else:
            article["unsupported_count"] = 0

    return articles


def update_article_status(article_id: str, status: str) -> None:
    get_supabase().table("articles").update({"status": status}).eq("id", article_id).execute()


def create_extracted_facts(article_id: str, facts: list[dict]) -> list[dict]:
    if not facts:
        return []
    rows = [{**f, "article_id": article_id} for f in facts]
    result = get_supabase().table("extracted_facts").insert(rows).execute()
    return result.data


def create_generated_article(data: dict) -> dict:
    result = get_supabase().table("generated_articles").insert(data).execute()
    return result.data[0]


def get_latest_generated(article_id: str) -> dict | None:
    result = (
        get_supabase()
        .table("generated_articles")
        .select("*")
        .eq("article_id", article_id)
        .order("version", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )
    return result.data


def create_fact_checks(generated_article_id: str, checks: list[dict]) -> list[dict]:
    if not checks:
        return []
    rows = [{**c, "generated_article_id": generated_article_id} for c in checks]
    result = get_supabase().table("fact_checks").insert(rows).execute()
    return result.data


def get_fact_checks(generated_article_id: str) -> list[dict]:
    result = (
        get_supabase()
        .table("fact_checks")
        .select("*")
        .eq("generated_article_id", generated_article_id)
        .execute()
    )
    return result.data


def get_extracted_facts(article_id: str) -> list[dict]:
    result = (
        get_supabase()
        .table("extracted_facts")
        .select("*")
        .eq("article_id", article_id)
        .execute()
    )
    return result.data
