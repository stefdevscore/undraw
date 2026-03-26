from undraw.inventory import load_inventory

def test_load_inventory():
    inv = load_inventory()
    assert inv is not None
    assert len(inv) > 0
    assert isinstance(inv[0], list)
    assert len(inv[0]) == 2 # [id, title]
