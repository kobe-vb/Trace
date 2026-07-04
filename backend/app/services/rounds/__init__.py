import importlib
import pkgutil

_cached_rounds = None

# test_round: str | None = "Location"
test_round: str | None = "Test"
# test_round: str | None = None

# Rounds die nooit in de classic pool mogen zitten
_EXCLUDED_FROM_CLASSIC = {"GroupQuiz"}
if not test_round:
    _EXCLUDED_FROM_CLASSIC.add("Test")


def _load_all():
    for module_info in pkgutil.iter_modules(__path__):
        name = module_info.name
        if not name.startswith("_"):
            importlib.import_module(f"{__name__}.{name}")


def get_all_rounds():
    """Classic rounds — zonder GroupQuiz."""
    global _cached_rounds
    if _cached_rounds is not None:
        return _cached_rounds

    _load_all()
    from app.services.rounds.Round import Round

    _cached_rounds = [
        cls for cls in Round.__subclasses__()
        if cls.__name__ not in _EXCLUDED_FROM_CLASSIC
        and (test_round is None or test_round == cls.__name__)
    ]

    print(f"Loaded classic rounds: {[cls.__name__ for cls in _cached_rounds]}")
    return _cached_rounds


def get_groupQuiz_rounds():
    """Alleen GroupQuiz — voor de nieuwe game modus."""
    _load_all()
    from app.services.rounds.GroupQuiz import GroupQuiz
    return [GroupQuiz]