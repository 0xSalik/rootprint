"""The /api/v1/search/techniques response contract is unchanged from
A1's mocked version — same shape, same field names. The frontend's
HANDOVER.md documents these as the locked-in shape; this test fails
loudly if anyone changes them.
"""

from __future__ import annotations

from app.api.endpoints.search import SearchResult


def test_search_result_shape_is_locked() -> None:
    fields = SearchResult.model_fields
    expected = {"id", "master_id", "technique_name", "translated_transcript", "similarity_score"}
    assert set(fields) == expected, (
        "Frontend contract violation: SearchResult fields must remain the "
        "exact set documented in HANDOVER.md."
    )


def test_search_result_field_types() -> None:
    import uuid

    obj = SearchResult(
        id=uuid.uuid4(),
        master_id=uuid.uuid4(),
        technique_name="Kani",
        translated_transcript="...",
        similarity_score=0.42,
    )
    dumped = obj.model_dump(mode="json")
    assert isinstance(dumped["id"], str)
    assert isinstance(dumped["master_id"], str)
    assert isinstance(dumped["technique_name"], str)
    assert isinstance(dumped["translated_transcript"], str)
    assert isinstance(dumped["similarity_score"], (int, float))
