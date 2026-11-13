# Toyota Card for Home Assistant

A dashboard card for Toyotas in the **MyToyota** or **Toyota** app, using either the European [Toyota integration (`pytoyoda/ha_toyota`)](https://github.com/pytoyoda/ha_toyota) or the North American [Toyota (North America) integration (`widewing/ha-toyota-na`)](https://github.com/widewing/ha-toyota-na). One card that answers "is the car locked, and how much fuel is in it?".

**📖 [Step-by-step guide and live demo](https://mymediabuild.uk/toyota-home-assistant-card/)** · **☕ [Buy me a coffee](https://buymeacoffee.com/bobgreggr)**

![Toyota card demo](images/demo.gif)

## What it shows

- Your car's photo, in your colour, straight from the Toyota integration (when provided)
- Doors, boot / trunk, bonnet / hood, windows and warning lights, in amber or red when something needs attention
- A top-down car with each door's state at its corner (or tire pressures on North American vehicles without door sensors)
- Range, odometer and a red / amber / green fuel gauge
- Average mpg, the share of miles driven on electric, the hybrid score and the last trip score (European `ha_toyota`)
- For electric and plug-in hybrid cars with battery data, a battery gauge, electric range and charging status
- Optional extra information: weekly average speed, recent trips, climate, seat heating and hazard lights (`ha_toyota`), or current speed, remote start and trip A/B (`ha-toyota-na`)
- Last service date and miles since (`ha_toyota`), or distance until next service (`ha-toyota-na`)
- When the car last reported in (tap it to ask the car for a fresh update)
- Where it's parked: "home" or the distance from home (tap it to open Google Maps)

It lays itself out for phones, tablets and full-page panel views.

| iPad | Phone | Alerts |
|---|---|---|
| ![iPad](images/ipad.webp) | ![Phone](images/phone.webp) | ![Alerts](images/alerts.webp) |

## Requirements

- Home Assistant with one of these integrations from Marketplace (HACS before 2026.11):
  - **Europe / UK**: [pytoyoda/ha_toyota](https://github.com/pytoyoda/ha_toyota)
  - **North America**: [widewing/ha-toyota-na](https://github.com/widewing/ha-toyota-na)
- A Toyota with connected services in the MyToyota / Toyota app.

## Install

### Marketplace (recommended)

1. In **Settings → Marketplace**, search for **Toyota Card**.
2. Open it, click **Install**, and reload your browser.

If it doesn't show up, click **Add from link**, paste this repository's URL (the address of this page) and choose the type **Dashboard** if asked. This asks you to connect GitHub.

The first time you use Marketplace, tick **I understand the risks and agree** and click **Continue**.

**On a version older than 2026.11?** Marketplace is still called HACS there. Use **Download** in place of Install and **⋮ → Custom repositories** in place of Add from link.

### Manual

1. Download `toyota-card.js` from the [latest release](../../releases/latest).
2. Copy it to `config/www/toyota-card.js`.
3. Go to **Settings → Dashboards → ⋮ → Resources**, add `/local/toyota-card.js?v=1.2.0` as a **JavaScript module**, then reload your browser.

## Use

Add a card in YAML mode:

```yaml
type: custom:toyota-card
```

That's it. The card finds your car on its own. If you have more than one Toyota, pick one with `prefix`:

```yaml
type: custom:toyota-card
prefix: abc123def456   # ha_toyota: the part between "sensor." and "_odometer"
                       # ha-toyota-na: the part after "sensor.odometer_" (e.g. 2024_rav4)
```

| Option | Default | What it does |
|---|---|---|
| `prefix` | first Toyota found | Which car to show (entity ID prefix for `ha_toyota`, or model suffix for `ha-toyota-na`) |
| `units` | `imperial` | `metric` shows km, km/h and L/100 km; `imperial` shows miles, mph and UK mpg |
| `show_extra_info` | `false` | Set to `true` to show optional extra vehicle details |
| `image` | integration `entity_picture` | Optional image URL or `/local/...` path for the car photo (useful for `ha-toyota-na`, which does not provide `entity_picture`) |

The battery gauge appears automatically when the selected car reports a numeric battery level (for example, an electric or plug-in hybrid Toyota). `show_extra_info` is opt-in, so existing cards keep their current layout unless you enable it.

The card fills the space it's given. It looks best in a **Panel** view or a large section. To change the background, set the CSS variable `--car-card-bg` with card-mod or your theme.

### Units

The `units` option applies to vehicle and electric range, odometer, distance from home, distance since last service (or until next service), and speed. Sensors that report their own unit (`mi` or `km`) are converted automatically. Set `units: metric` to keep metric units, or `units: imperial` to show **miles**, **mph** and **UK mpg**. The default remains `imperial` so existing cards keep their current display.

## Coming from the blog version?

The old `custom:yaris-card` name still works, so existing dashboards won't break. New dashboards should use `custom:toyota-card`.

## Notes

- Door, window, lock and bonnet / hood states are only as fresh as the car's last report. Tap the time in the top-left corner to request an update.
- The parked distance uses your Home zone.
- On European `ha_toyota` vehicles, tyre pressures aren't available from Toyota, so the corners of the top-down car show each door instead. On North American `ha-toyota-na` vehicles without door sensors, tire pressures (`psi`) are shown at each corner.

## Support and requests

I build and look after this card in my spare time.

- **Found a bug?** [Open an issue](../../issues/new/choose) and fill in the form. A screenshot and the entity list help a lot.
- **Want another car brand or a new feature?** Use the feature request form. Pull requests are very welcome. I build this in my spare time and can only test on my own car, so I can't promise every request.
- **Like the card?** A ⭐ on GitHub helps other people find it, and you can [buy me a coffee](https://buymeacoffee.com/bobgreggr) ☕. More free Home Assistant cards and guides at [mymediabuild.uk](https://mymediabuild.uk).

## Thanks

Big thanks to **CM000n** and **deejay1** for maintaining the Toyota integration and pytoyoda, and to **Simon Hansen (DurgNomis-drol)** for starting it. There's no official Toyota API, so they keep it working as Toyota changes things.

More free Home Assistant cards and guides at [mymediabuild.uk](https://mymediabuild.uk). If you find this useful, you can [buy me a coffee](https://buymeacoffee.com/bobgreggr) ☕ (no pressure).

## Licence

MIT. Not affiliated with or endorsed by Toyota.
