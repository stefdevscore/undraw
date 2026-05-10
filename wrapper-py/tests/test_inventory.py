from undraw.inventory import load_inventory

def test_load_inventory():
    inv = load_inventory()
    assert inv is not None
    assert len(inv) > 0
    assert isinstance(inv[0], dict)
    assert set(inv[0]) == {"id", "title", "svg_url"}
    assert inv[0]["svg_url"].startswith("https://cdn.undraw.co/illustration")
