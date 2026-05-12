import importlib
import pkgutil

_cached_rounds = None


# test_round: str | None = "Test" 
test_round: str | None = None 


def get_all_rounds():
    global _cached_rounds

    if _cached_rounds is not None:
        return _cached_rounds

    for module_info in pkgutil.iter_modules(__path__):
        name = module_info.name

        if name.startswith("_"):
            continue

        importlib.import_module(f"{__name__}.{name}")

    from app.services.rounds.Round import Round

    _cached_rounds = [
        cls for cls in Round.__subclasses__()
        if cls is not Round and (test_round is None or test_round == cls.__name__) and (cls.__name__ != "Test" or test_round == "Test")
    ]

    print(f"Loaded rounds: {[cls.__name__ for cls in _cached_rounds]}")
    return _cached_rounds
