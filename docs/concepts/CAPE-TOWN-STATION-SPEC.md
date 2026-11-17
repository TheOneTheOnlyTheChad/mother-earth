# Mother Earth — Cape Town observation station

17 November 2026 · Concept spec for review

## 1. Goal

Use the Raspberry Pi to collect our own Cape Town observations alongside Mother Earth’s existing global feeds. Start with aircraft reception and assess which additional radio, sensor or camera would give us the most useful local stream.

The first deliverable is a private preview using the existing Pi. Keep the public control centre at $0/month. Any public release requires Chad’s separate production approval.

## 2. Current setup

- The Pi is running the ADSB.im feeder image with a 1090 MHz aircraft receiver and antenna.
- OpenSky verified the receiver as Online and Approved. Its dashboard reported 21 messages per second at 03:26 UTC on 17 November 2026. This is a message rate, separate from the number of aircraft seen.
- The dashboard lists coordinates. Martin’s requested location update, including antenna altitude, is still to be confirmed.
- Keep the receiver serial and precise antenna location in the private setup note.
- The public aircraft layer remains parked. This spec proposes private preview work and evaluation only.

## 3. Finding A — The existing receiver can supply multiple aircraft streams

### A1. Read our own aircraft observations

The Pi’s local readsb aircraft JSON gives us a stream we can use on the local network while OpenSky continues receiving data. Verify the endpoint on this installation before wiring it into a preview.

Build a private, page-only **Aircraft seen by our Cape Town receiver** preview.

- Show timestamped aircraft positions from the Pi and the age of those observations.
- Display altitude, heading and speed when supplied. Some received aircraft will have no usable position. Count those separately if the feed supports it.
- Describe the scope as aircraft heard by this receiver. Terrain, antenna siting, aircraft altitude and transmission all affect what appears.
- Distinguish a fresh feed with zero plottable aircraft from stale data and an unreachable feed.
- Use the local network for the preview and keep the Pi’s administration and feed endpoints private.

Acceptance

- Preview reads a fresh sample while OpenSky continues reporting.
- The map only draws aircraft with usable positions and handles ageing observations.
- Zero positions, stale data and a disconnected feed each produce the correct visible state.

### A2. Feed additional aircraft networks

ADSB.im can send the same decoded observations to several networks simultaneously. The existing ADS-B radio and antenna can serve OpenSky plus supported networks such as adsb.lol, Airplanes.live, ADS-B Exchange and FlightAware.

Assess **adsb.lol** first as a candidate for wider aircraft coverage. It documents a free feeder API tier and publishes its API data under ODbL 1.0. Feeding a network and using its combined data in Mother Earth are separate decisions.

Before recommending activation, check:

- Recent Cape Town and South African coverage.
- Available endpoints, request limits and access from the Cloudflare Worker. Test the actual endpoint proposed for the collector because some adsb.lol feeder access is tied to the station’s IP.
- ODbL obligations for our intended public display and storage.
- Which station identifiers and antenna location details the network requires and what it makes public.

Keep additional aggregators off until Chad selects one after review.

## 4. Finding B — The Pi can collect other kinds of observations

The existing ADS-B radio handles aircraft. A separate USB SDR and band-appropriate antenna can receive a second radio service concurrently. A network weather station, camera or wired sensor can provide its own stream. Confirm Pi power, USB capacity and workload before choosing what to run on the feeder itself.

| Instrument | Stream | Mother Earth use | First check |
| --- | --- | --- | --- |
| Weather balloon receiver | Position, altitude, temperature, humidity and wind where available | Track a Cape Town balloon in three dimensions and compare its observed wind profile with the GFS model used by Wind by height | Confirm recent launches, local frequency and likely reception from our site |
| Marine AIS receiver | Local vessel positions, speeds and headings | Add a separately labelled view of ships directly heard around the harbour or bay, alongside the global AISStream feed | Assess the antenna’s view toward the water and test real vessel reception |
| Outdoor weather station | Wind, gusts, rain, pressure, temperature and humidity | Show continuous local measurements and compare surface wind with the nearby GFS 10 m grid cell | Confirm local data export, sensor siting and wind measurement height |
| All-sky camera | Regular overhead images, cloud timelapses and occasional meteor or satellite captures | Add a Cape Town sky view near the existing Sky pages | Check the field of view, equipment, image processing load and whether the camera needs its own Pi |
| Outdoor particulate sensor | Local PM2.5 and PM10 time series | Compare ground-level particle readings with satellite smoke or dust imagery during events | Confirm outdoor housing, airflow and how humidity affects the readings |
| Raspberry Shake seismometer | Local ground-motion waveform | Show locally recorded shaking alongside a matching earthquake on the globe, when detectable | Assess a quiet installation site and the dedicated instrument setup |

Cape Town has an established upper-air station, WMO 68816. Balloon reception is the first hardware idea to assess because it adds a measured vertical profile to an existing feature. Confirm recent launch activity and the radio band before buying hardware. A weather station is the stronger first choice if the priority is a stream that updates throughout the day.

## 5. Suggested order

1. Verify Pi aircraft JSON and run the private Cape Town preview with the hardware we have.
2. Check Cape Town radiosonde activity and work out the receiver and antenna required. Bring back an evidence-based hardware list before purchase.
3. Evaluate adsb.lol in parallel if wider aircraft coverage becomes a priority.
4. Bring any public layer or additional outbound feed back to Chad for a separate decision.

## References

- ADSB.im feeder image and supported networks — https://github.com/dirkhh/adsb-feeder-image
- ADSB.im radio and protocol setup — https://adsb.im/using
- readsb aircraft JSON — https://github.com/wiedehopf/readsb/blob/dev/README-json.md
- adsb.lol API and feeder access — https://www.adsb.lol/docs/open-data/api
- Cape Town upper-air soundings — https://airschool.co.za/weather/sounding
- Radiosonde receiver software — https://github.com/projecthorus/radiosonde_auto_rx
- Local weather station integration — https://www.home-assistant.io/integrations/ecowitt/
- All-sky camera hardware and software — https://allskyteam.github.io/allsky/
- Sensirion Raspberry Pi sensor drivers — https://github.com/sensirion/info
- Raspberry Shake instrument guides — https://raspberryshake.org/learn-support/diy-tutorials/