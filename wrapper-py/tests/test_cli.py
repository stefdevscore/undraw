import json
import unittest.mock as mock

from click.testing import CliRunner
from undraw.cli import cli

def test_cli_help():
    runner = CliRunner()
    result = runner.invoke(cli, ['--help'])
    assert result.exit_code == 0
    assert 'CLI for unDraw illustrations' in result.output

def test_cli_list():
    runner = CliRunner()
    result = runner.invoke(cli, ['list', '--page', '1'])
    assert result.exit_code == 0
    # Should contain some illustration names from the embedded inventory
    assert 'Page 1' in result.output

def test_cli_list_json():
    runner = CliRunner()
    result = runner.invoke(cli, ['list', 'astronomy', '--json'])
    assert result.exit_code == 0

    payload = json.loads(result.output)
    assert payload['query'] == 'astronomy'
    assert payload['page'] == 1
    assert payload['per_page'] == 20
    assert payload['total'] >= 1
    assert payload['total_pages'] >= 1
    assert {'id': 'astronomy_ied1', 'title': 'Astronomy'} in payload['items']

@mock.patch('undraw.cli.fetch_url')
def test_cli_download(mock_fetch):
    mock_fetch.return_value = b'<svg>Test</svg>'
    runner = CliRunner()
    with runner.isolated_filesystem():
        result = runner.invoke(cli, ['download', 'test-id'])
        assert result.exit_code == 0
        assert 'Saved to ./test-id.svg' in result.output
        with open('test-id.svg', 'r') as f:
            assert f.read() == '<svg>Test</svg>'
