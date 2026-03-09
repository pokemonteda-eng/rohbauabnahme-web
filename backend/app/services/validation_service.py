from fastapi import HTTPException, status

from app.schemas.protokolle import LackierungsdatenSave


def validate_lackierungsdaten(payload: LackierungsdatenSave) -> None:
    invalid_fields: list[str] = []
    checks = (
        ("klarlackschicht", "klarlackschicht_bemerkung"),
        ("zinkstaubbeschichtung", "zinkstaub_bemerkung"),
        ("e_kolben_beschichtung", "e_kolben_bemerkung"),
    )

    for bool_field, note_field in checks:
        is_selected = getattr(payload, bool_field)
        note_value = getattr(payload, note_field)
        has_note = note_value is not None and note_value.strip() != ""
        if not is_selected and has_note:
            invalid_fields.append(note_field)

    if invalid_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bemerkungen sind nur bei aktivierter Option erlaubt: {', '.join(invalid_fields)}",
        )
