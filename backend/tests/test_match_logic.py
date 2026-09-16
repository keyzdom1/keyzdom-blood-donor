from app.tasks.match_task import BLOOD_COMPATIBILITY, MIN_DAYS_BETWEEN_DONATIONS


def test_blood_compatibility():
    assert "O-" in BLOOD_COMPATIBILITY["O-"]
    assert "A+" in BLOOD_COMPATIBILITY["O-"]
    assert "AB+" in BLOOD_COMPATIBILITY["O-"]
    assert "O+" in BLOOD_COMPATIBILITY["O+"]
    assert "O-" not in BLOOD_COMPATIBILITY["O+"]
    assert "B+" in BLOOD_COMPATIBILITY["A+"]
    assert "A+" not in BLOOD_COMPATIBILITY["B+"]
    assert "AB+" in BLOOD_COMPATIBILITY["AB+"]
    assert "O+" not in BLOOD_COMPATIBILITY["AB+"]


def test_eligibility_days():
    assert MIN_DAYS_BETWEEN_DONATIONS == 56


def test_all_blood_types_covered():
    expected = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
    assert set(BLOOD_COMPATIBILITY.keys()) == expected
    for donors in BLOOD_COMPATIBILITY.values():
        for donor_type in donors:
            assert donor_type in expected
