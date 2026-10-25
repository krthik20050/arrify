"""Retain an original still for products whose entire source gallery is animated."""
import json
import subprocess
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
from PIL import Image

root = Path(__file__).resolve().parent.parent
target = root / 'public' / 'assets' / 'card-stills'
target.mkdir(parents=True, exist_ok=True)
products = json.loads((root / 'data' / 'catalog.json').read_text(encoding='utf-8'))['products']
for product in products:
    images = product.get('images', [])
    if not images or not all(urlsplit(image['src']).path.lower().endswith('.gif') for image in images):
        continue
    parts = urlsplit(images[0]['src'])
    query = dict(parse_qsl(parts.query))
    query.update(width='600', format='jpg')
    url = urlunsplit(parts._replace(query=urlencode(query)))
    source = target / f"{product['id']}.source.gif"
    subprocess.run(['curl.exe', '--noproxy', '*', '--fail', '--silent', '--show-error',
                    '--max-time', '45', '--retry', '1', url, '-o', str(source)], check=True)
    with Image.open(source) as image:
        image.seek(0)
        image.convert('RGBA').save(target / f"{product['id']}.png")
    source.unlink()
    print(product['title'])
