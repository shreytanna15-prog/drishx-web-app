# Shop lens category images

Studio backdrop is punched to alpha so glass sits on the card in both themes.

| Category | Dark | Light |
| --- | --- | --- |
| Single Vision | `/images/catalog/singlevision-lens.png` | `/images/catalog/singlevision-light.png` |
| Kryptok | `/images/catalog/kryptok-lens.png` | `/images/catalog/kryptok-light.png` |
| Progressive | `/images/catalog/progressive-lens.png` | `/images/catalog/progressive-light.png` |

Basenames intentionally differ from `*.jpeg` catalog photos (Android drawable collision).

Regenerate from the mobile app:

```bash
node scripts/process-lens-assets.js
```
