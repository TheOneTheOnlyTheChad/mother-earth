# Cape Town radiosonde — one recorded sounding, and what fields it carries

17 Nov 2026 (17 Nov 06:32 UTC clock reading). Research only, read-only. No hardware, no account, no collector, no page. Asked for by GPT via Chad after the A1 review: find one recorded Cape Town sounding and note which flight-path and altitude-profile fields are available.

## Source and how it was read
- **SondeHub** (sondehub.org): a community archive of radiosonde telemetry received by volunteer stations running radiosonde_auto_rx. Read through its public API from Chad's Chrome (Claude's shells cannot reach it): `https://api.v2.sondehub.org/sondes?lat=…&lon=…&distance=400000&last=604800` (sondes heard within 400 km of Cape Town in the last 7 days), `/sonde/<serial>` (every frame of one flight) and `/sites`.
- **Not read:** SondeHub's terms and data licence; the long-term archive (the open S3 bucket `sondehub-history`); the South African Weather Service's own data; the University of Wyoming and IGRA archives for station 68816. Nothing here is a reuse finding.

## Launch activity near Cape Town, 10–17 Nov 2026 (as SondeHub lists it)
- **18 sondes in 7 days.** Fourteen fit a twice-daily pattern, last heard around 00:50–02:05 UTC and 12:55–13:30 UTC, on **404.0 or 405.0 MHz**, type **iMet-54** (Intermet Systems). Four others at other times or frequencies (402.7, 402.9, 404.8, 405.3 MHz; one with a different serial style).
- **Received by two volunteer stations** (callsigns as SondeHub shows them: ZS1AEG, ZS1ARB). So the launches are already being received locally and published; our own receiver would add a third station, not a first.
- The times above are the last frame heard for each sonde, not launch times. The listing's last altitude ranges from 203 m to 11,850 m, so most flights are followed well into the descent and some nearly to the ground.

## The one flight looked at: serial 55126368
| | |
|---|---|
| First frame | 16 Nov 2026 23:42:17 UTC, 211 m, 33.976°S 18.597°E |
| Highest frame | 17 Nov 2026 00:57:48 UTC, **27,429 m**, 33.736°S 19.130°E (56 km from the first frame) |
| Last frame | 17 Nov 2026 01:06:27 UTC, 9,631 m on the way down, 33.700°S 19.215°E |
| Frames | 2,829 (2,524 up, 305 down); one every 2 s (median and 90th percentile); **no gap over 60 s** |
| Mean climb | 6.0 m/s |
| Radio | 404.00 MHz; signal-to-noise 5.5 to 24.7 dB (median 14.6) |
| Receivers | both stations; decoder radiosonde_auto_rx 1.8.2 |

**Fields on every one of the 2,829 frames:** `datetime`, `lat`, `lon`, `alt`, `temp`, `humidity`, `frame`, `serial`, `type`/`subtype`/`manufacturer`, `frequency`, `snr`, `uploader_callsign`, `uploader_antenna`, `time_received`, `software_name`/`software_version`, `position`, `ref_position`, `ref_datetime`. `uploader_position` and `uploader_alt` on 2,445.

**Not present on this flight:** `pressure`, `vel_h`, `vel_v`, `heading`, `batt`, `sats`. (SondeHub's format has them as optional; this sonde type as decoded here did not supply them.)

**So, for Mother Earth's purposes:**
- **Flight path: yes.** Time, latitude, longitude and altitude every 2 s from the ground to 27.4 km and partway down: a full three-dimensional track.
- **Profile by altitude: temperature and humidity, measured, yes.** Pressure: no.
- **Wind: not reported, but derivable** from how the balloon drifts between frames. That is a calculation of ours from GPS positions, to be labelled as such, not a measured field.

**Readings at a few heights on the way up** (temperature and humidity as reported; wind is Claude's calculation from the drift over about 60 s around each height, direction it blows from; unchecked against any other source):

| Height | Temperature | Humidity | Wind (derived) |
|---|---|---|---|
| 3,000 m | 8.3 °C | 13.7 % | about 12 km/h from 231° |
| 5,007 m | −3.4 °C | 27.3 % | about 44 km/h from 229° |
| 8,003 m | −24.3 °C | 32.8 % | about 68 km/h from 231° |
| 10,007 m | −39.7 °C | 18.4 % | about 89 km/h from 231° |
| 12,000 m | −56.6 °C | 27.6 % | about 94 km/h from 220° |
| 14,999 m | −61.1 °C | 7.0 % | about 111 km/h from 244° |
| 20,006 m | −64.6 °C | 5.5 % | about 22 km/h from 272° |
| 25,007 m | −56.4 °C | 0.1 % | about 7 km/h from 347° |
| 27,429 m | −51.3 °C | 0.0 % | about 38 km/h from 26° |

Coldest frame on the ascent: −70.0 °C at 18,317 m.

## What this means for the spec's balloon idea
- The spec's "confirm recent launches, local frequency" check is answered for this week: twice daily, 404 and 405 MHz, iMet-54.
- A comparison with Wind by height is possible in principle: GFS at 250 hPa is roughly 10–11 km, where this flight's derived wind was about 89 km/h from the south-west. The heights do not match exactly (no pressure on the sonde; GFS levels are pressure levels) and no comparison has been made.
- **Open before anything is built or bought:** SondeHub's licence and terms for display and storage; whether its API may be read by a hub on a schedule; how humidity from this sonde type should be caveated; whether the other four sondes are a different programme; whether our own receiver would add anything to two existing local stations (reception from our site is unmeasured).
