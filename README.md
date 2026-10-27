# Toyota Card for Home Assistant

A dashboard card for Toyotas in the **MyToyota** app, using the community [Toyota integration (pytoyoda/ha_toyota)](https://github.com/pytoyoda/ha_toyota). One card that answers "is the car locked, and how much fuel is in it?".

**📖 [Step-by-step guide and live demo](https://mymediabuild.uk/toyota-home-assistant-card/)** · **☕ [Buy me a coffee](https://buymeacoffee.com/bobgreggr)**

![Toyota card demo](images/demo.gif)

## What it shows

- Your car's photo, in your colour, straight from the Toyota integration
- Doors, boot, bonnet, windows and warning lights, in amber or red when something needs attention
- A top-down car with each door's state at its corner
- Range, odometer and a red / amber / green fuel gauge
- Average mpg, the share of miles driven on electric, the hybrid score and the last trip score
- For electric and plug-in hybrid cars with battery data, a battery gauge, electric range and charging status
- Optional extra information: weekly average speed, recent trips, climate, seat heating and hazard lights
- Last service date and miles since
- When the car last reported in (tap it to ask the car for a fresh update)
- Where it's parked: "home" or the distance from home (tap it to open Google Maps)

It lays itself out for phones, tablets and full-page panel views.

| iPad | Phone | Alerts |
|---|---|---|
| ![iPad](images/ipad.webp) | ![Phone](images/phone.webp) | ![Alerts](images/alerts.webp) |

## Requirements

- Home Assistant with the **Toyota** integration from HACS: [pytoyoda/ha_toyota](https://github.com/pytoyoda/ha_toyota)
- A Toyota with connected services in the MyToyota app. The integration uses Toyota's European servers, so it's aimed at European (including UK) cars.

## Install

### HACS (recommended)

1. In HACS, open the three-dot menu and choose **Custom repositories**.
2. Paste this repository's URL (the address of this page) and choose the type **Dashboard**.
3. Search for **Toyota Card**, download it, and reload your browser when asked.

### Manual

1. Download `toyota-card.js` from the [latest release](../../releases/latest).
2. Copy it to `config/www/toyota-card.js`.
3. Go to **Settings → Dashboards → ⋮ → Resources**, add `/local/toyota-card.js?v=1.1.0` as a **JavaScript module**, then reload your browser.

## Use

Add a card in YAML mode:

```yaml
type: custom:toyota-card
```

That's it. The card finds your car on its own. If you have more than one Toyota, pick one with `prefix`:

```yaml
type: custom:toyota-card
prefix: abc123def456   # the part between "sensor." and "_odometer" in your car's entity IDs
```

| Option | Default | What it does |
|---|---|---|
| `prefix` | first Toyota found | Which car to show (entity ID prefix) |
| `units` | `imperial` | `metric` shows km, km/h and L/100 km; `imperial` shows miles, mph and UK mpg |
| `show_extra_info` | `false` | Set to `true` to show weekly average speed, recent trips, climate, cabin temperature, seat and steering wheel heaters, hazard lights and trip history |

The battery gauge appears automatically when the selected car reports a numeric battery level (for example, an electric or plug-in hybrid Toyota). `show_extra_info` is opt-in, so existing cards keep their current layout unless you enable it.

The card fills the space it's given. It looks best in a **Panel** view or a large section. To change the background, set the CSS variable `--car-card-bg` with card-mod or your theme.

### Units

The integration reports kilometres, km/h and L/100 km. The `units` option applies to vehicle and electric range, odometer, distance from home, distance since last service, and weekly average speed. Set `units: metric` to keep metric units, or `units: imperial` to show **miles**, **mph** and **UK mpg**. The default remains `imperial` so existing cards keep their current display.

## Coming from the blog version?

The old `custom:yaris-card` name still works, so existing dashboards won't break. New dashboards should use `custom:toyota-card`.

## Notes

- Door, window, lock and bonnet states are only as fresh as the car's last report. Tap the time in the top-left corner to request an update.
- The parked distance uses your Home zone.
- Tyre pressures aren't available from Toyota, so the corners of the top-down car show each door instead.

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
