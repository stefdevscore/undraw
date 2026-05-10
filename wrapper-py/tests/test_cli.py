import json
import os
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
    assert payload['schema_version'] == 1
    assert payload['query'] == 'astronomy'
    assert payload['page'] == 1
    assert payload['per_page'] == 20
    assert payload['total'] >= 1
    assert payload['total_pages'] >= 1
    assert {
        'id': 'astronomy_ied1',
        'title': 'Astronomy',
        'svg_url': mock.ANY,
    } in payload['items']
    astronomy = next(item for item in payload['items'] if item['id'] == 'astronomy_ied1')
    assert astronomy['svg_url'].startswith('https://cdn.undraw.co/illustration')

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

@mock.patch('undraw.cli.fetch_url')
def test_cli_download_json_manifest(mock_fetch):
    mock_fetch.return_value = b'<svg>Test</svg>'
    runner = CliRunner()
    with runner.isolated_filesystem():
        result = runner.invoke(cli, ['download', 'astronomy_ied1', '--json'])
        assert result.exit_code == 0

        payload = json.loads(result.output)
        assert payload['schema_version'] == 1
        assert payload['id'] == 'astronomy_ied1'
        assert payload['title'] == 'Astronomy'
        assert payload['color'] == '#6c63ff'
        assert payload['path'] == './astronomy_ied1.svg'
        assert payload['bytes'] == len(b'<svg>Test</svg>')
        assert payload['svg_url'].startswith('https://cdn.undraw.co/illustration')
        assert os.path.exists('astronomy_ied1.svg')

def test_cli_list_rejects_page_zero_json():
    runner = CliRunner()
    result = runner.invoke(cli, ['list', 'astronomy', '--page', '0', '--json'])
    assert result.exit_code != 0

    payload = json.loads(result.output)
    assert payload['schema_version'] == 1
    assert payload['error'] == 'invalid_page'
    assert payload['page'] == 0

@mock.patch('undraw.cli.fetch_url')
def test_cli_download_missing_exits_nonzero_json(mock_fetch):
    mock_fetch.side_effect = RuntimeError('not found')
    runner = CliRunner()
    result = runner.invoke(cli, ['download', 'definitely_missing_asset_zzzz', '--json'])
    assert result.exit_code != 0

    payload = json.loads(result.output)
    assert payload['schema_version'] == 1
    assert payload['error'] == 'download_failed'
    assert payload['id'] == 'definitely_missing_asset_zzzz'
